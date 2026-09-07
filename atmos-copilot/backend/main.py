import os
import re
import sqlite3
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import httpx
from google import genai
from google.genai import types

app = FastAPI(title="AtmosCopilot Core & Intelligence Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Database Initialization
def init_db():
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# 2. Gemini Client Initialization
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# 3. Request Schemas
class RegisterSchema(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginSchema(BaseModel):
    identifier: str
    phone: str
    password: str

class ResetPasswordSchema(BaseModel):
    identifier: str
    phone: str
    new_password: str

class QueryRequest(BaseModel):
    query: str
    lat: float
    lon: float

# 4. Authentication Endpoints
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: RegisterSchema):
    if not re.match(r"^[a-zA-Z\s]+$", user.name):
        raise HTTPException(status_code=400, detail="Name can only contain letters and spaces.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", user.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    if not re.match(r"^\d{10}$", user.phone):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT email, name FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)", 
        (user.email, user.name)
    )
    existing = cursor.fetchone()
    if existing:
        conn.close()
        if existing[0].lower() == user.email.lower():
            raise HTTPException(status_code=409, detail="Email address is already registered.")
        raise HTTPException(status_code=409, detail="Operator name is already taken.")

    cursor.execute(
        "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
        (user.name.strip(), user.email.lower().strip(), user.phone.strip(), user.password.strip())
    )
    conn.commit()
    conn.close()

    return {
        "status": "registered",
        "user": {"name": user.name.strip(), "email": user.email.lower().strip(), "phone": user.phone.strip()}
    }

@app.post("/api/login")
def login(creds: LoginSchema):
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name, email, phone FROM users 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) 
          AND phone = ? AND password = ?
    """, (creds.identifier, creds.identifier, creds.phone, creds.password))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials. Verify your name/email, mobile, and password.")
    return {"status": "authenticated", "user": {"name": row[0], "email": row[1], "phone": row[2]}}

@app.post("/api/reset-password")
def reset_password(data: ResetPasswordSchema):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id FROM users 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) AND phone = ?
    """, (data.identifier, data.identifier, data.phone))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No operator found matching this identifier and mobile number.")

    cursor.execute("UPDATE users SET password = ? WHERE id = ?", (data.new_password.strip(), row[0]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Password updated successfully."}

# 5. Meteorological Telemetry Fetcher
async def fetch_imd_bengaluru_telemetry():
    """Scrapes station telemetry directly from IMD Bengaluru's portal."""
    imd_url = "https://mausam.imd.gov.in/bengaluru/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
        try:
            res = await client.get(imd_url, headers=headers)
            if res.status_code != 200:
                return None
            html = res.text

            temp_match = re.search(r'([0-9]{2}(?:\.[0-9])?)\s*°\s*C', html)
            temp = float(temp_match.group(1)) if temp_match else None

            humidity_match = re.search(r'([0-9]{2})\s*%', html)
            humidity = int(humidity_match.group(1)) if humidity_match else None

            wind_match = re.search(r'([A-Za-z]+)\s+([0-9]+(?:\.[0-9])?)\s*km/?h', html, re.IGNORECASE)
            wind_dir = wind_match.group(1).title() if wind_match else "Southwesterly"
            wind_speed = float(wind_match.group(2)) if wind_match else 12.0

            sunrise_match = re.search(r'Sunrise\s*:\s*([0-9]{2}:[0-9]{2})', html, re.IGNORECASE)
            sunset_match = re.search(r'Sunset\s*:\s*([0-9]{2}:[0-9]{2})', html, re.IGNORECASE)

            if temp is not None:
                return {
                    "source": "IMD RMC Bengaluru",
                    "temp": round(temp),
                    "humidity": humidity or 75,
                    "wind": round(wind_speed),
                    "wind_dir": wind_dir,
                    "sunrise": sunrise_match.group(1) if sunrise_match else "06:09",
                    "sunset": sunset_match.group(1) if sunset_match else "18:28",
                    "condition": "Partly Cloudy"
                }
        except Exception as e:
            print("IMD scrap telemetry warning:", e)
    return None

@app.get("/api/weather-telemetry")
async def get_weather_telemetry(
    lat: float = Query(...),
    lon: float = Query(...),
    city: Optional[str] = Query(None)
):
    resolved_place = city or "Bengaluru (IMD Station)"
    imd_data = await fetch_imd_bengaluru_telemetry()

    open_meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
        f"&hourly=temperature_2m,precipitation_probability,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
        f"&timezone=auto"
    )

    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            m_res = await client.get(open_meteo_url)
            m_data = m_res.json()
            m_curr = m_data.get("current", {})
            hourly_raw = m_data.get("hourly", {})
            daily_raw = m_data.get("daily", {})

            cur_temp = imd_data["temp"] if imd_data else round(m_curr.get("temperature_2m", 26))
            cur_hum = imd_data["humidity"] if imd_data else round(m_curr.get("relative_humidity_2m", 68))
            cur_wind = imd_data["wind"] if imd_data else round(m_curr.get("wind_speed_10m", 10))
            wind_dir = imd_data.get("wind_dir", "Southwesterly") if imd_data else "Westerly"

            now_hour = datetime.now().hour
            hourly_times = hourly_raw.get("time", [])
            hourly_temps = hourly_raw.get("temperature_2m", [])
            hourly_precip = hourly_raw.get("precipitation_probability", [])
            hourly_winds = hourly_raw.get("wind_speed_10m", [])

            hourly_list = []
            for i in range(now_hour, min(now_hour + 24, len(hourly_times)), 3):
                dt_point = datetime.fromisoformat(hourly_times[i])
                h_val = dt_point.hour
                t_lbl = "12 am" if h_val == 0 else f"{h_val - 12} pm" if h_val >= 12 else f"{h_val} am"
                if h_val == 12:
                    t_lbl = "12 pm"

                hourly_list.append({
                    "time": t_lbl,
                    "temp": round(hourly_temps[i]),
                    "precip": hourly_precip[i] if i < len(hourly_precip) else 0,
                    "wind": round(hourly_winds[i]) if i < len(hourly_winds) else 10
                })

            d_times = daily_raw.get("time", [])
            d_max = daily_raw.get("temperature_2m_max", [])
            d_min = daily_raw.get("temperature_2m_min", [])
            daily_list = []
            for idx in range(min(7, len(d_times))):
                date_obj = datetime.fromisoformat(d_times[idx])
                d_title = "Today" if idx == 0 else date_obj.strftime("%a")
                daily_list.append({
                    "day": d_title,
                    "max_temp": round(d_max[idx]),
                    "min_temp": round(d_min[idx]),
                    "condition": "Partly Cloudy",
                    "chance_of_rain": daily_raw.get("precipitation_probability_max", [10])[idx]
                })

            return {
                "latitude": lat,
                "longitude": lon,
                "resolved_city": resolved_place,
                "station_source": "India Meteorological Department (IMD Bengaluru)",
                "current": {
                    "temp": cur_temp,
                    "condition": "Partly Cloudy",
                    "humidity": cur_hum,
                    "wind": cur_wind,
                    "wind_dir": wind_dir,
                    "precipitation": round(m_curr.get("precipitation", 0)),
                    "dew_point": round(cur_temp - ((100 - cur_hum) / 5)),
                    "sunrise": imd_data.get("sunrise", "06:09") if imd_data else "06:09",
                    "sunset": imd_data.get("sunset", "18:28") if imd_data else "18:28"
                },
                "hourly": hourly_list,
                "daily": daily_list
            }
        except Exception:
            return {
                "latitude": lat,
                "longitude": lon,
                "resolved_city": resolved_place,
                "station_source": "IMD Bengaluru Baseline",
                "current": {
                    "temp": 26,
                    "condition": "Partly Cloudy",
                    "humidity": 68,
                    "wind": 10,
                    "wind_dir": "Southwesterly",
                    "precipitation": 0,
                    "dew_point": 19,
                    "sunrise": "06:09",
                    "sunset": "18:28"
                },
                "hourly": [
                    {"time": "12 pm", "temp": 28, "precip": 0, "wind": 14},
                    {"time": "3 pm", "temp": 29, "precip": 5, "wind": 15},
                    {"time": "6 pm", "temp": 27, "precip": 10, "wind": 12},
                    {"time": "9 pm", "temp": 24, "precip": 5, "wind": 9}
                ],
                "daily": [
                    {"day": "Today", "max_temp": 29, "min_temp": 21, "condition": "Partly Cloudy"},
                    {"day": "Day", "max_temp": 30, "min_temp": 21, "condition": "Partly Cloudy"}
                ]
            }

# 6. Gemini-Integrated Sun Copilot Intelligence Endpoint
@app.post("/api/ai-query")
@app.post("/api/copilot")
async def copilot_intelligence(req: QueryRequest):
    telemetry = await get_weather_telemetry(lat=req.lat, lon=req.lon)
    cur = telemetry.get("current", {})
    resolved_place = telemetry.get("resolved_city", "Station Coordinates")
    
    # Baseline telemetry fallback if GEMINI_API_KEY is not set
    if not gemini_client or not GEMINI_API_KEY:
        q = req.query.strip().lower()
        temp = cur.get("temp", 26)
        hum = cur.get("humidity", 70)
        wind = cur.get("wind", 12)
        cond = cur.get("condition", "Partly Cloudy")
        precip = cur.get("precipitation", 0)

        if "rain" in q or "umbrella" in q:
            reply = f"Precipitation risk around {resolved_place} is {precip}%. Current atmospheric condition: {cond}."
        elif "temp" in q or "hot" in q or "cold" in q:
            reply = f"Current surface temperature in {resolved_place} is {temp}°C with {hum}% relative humidity."
        else:
            reply = f"Live telemetry for {resolved_place}: {cond} at {temp}°C, humidity {hum}%, winds {wind} km/h."
        return {"reply": reply, "telemetry": telemetry, "engine": "local_baseline"}

    # Grounded Gemini System Instructions & Context
    system_instruction = (
        "You are Sun Copilot, the meteorological and atmospheric intelligence core for AtmosCopilot. "
        "Provide direct, accurate, scientifically grounded, and concise answers without introductory fluff or robotic setup sentences. "
        "Use the provided sensor readings to contextualize questions regarding weather, agriculture, travel, safety, and health."
    )

    context_prompt = f"""
[LIVE METEOROLOGICAL TELEMETRY]
Target Locality: {resolved_place}
Coordinates: {req.lat:.4f}°N, {req.lon:.4f}°E
Current Temperature: {cur.get('temp', 26)}°C
Dew Point: {cur.get('dew_point', 18)}°C
Relative Humidity: {cur.get('humidity', 65)}%
Atmospheric Condition: {cur.get('condition', 'Partly Cloudy')}
Precipitation Probability: {cur.get('precipitation', 0)}%
Wind Velocity: {cur.get('wind', 12)} km/h ({cur.get('wind_dir', 'Westerly')})
Sunrise / Sunset: {cur.get('sunrise', '06:09')} / {cur.get('sunset', '18:28')}
Station Origin: {telemetry.get('station_source', 'IMD Synoptic Feed')}

User Query:
"{req.query}"
"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=context_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.35,
                max_output_tokens=300
            )
        )
        return {
            "reply": response.text.strip(),
            "telemetry": telemetry,
            "engine": "gemini-2.5-flash"
        }
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return {
            "reply": f"Atmospheric observation for {resolved_place}: {cur.get('condition')} at {cur.get('temp')}°C, {cur.get('humidity')}% relative humidity, and winds at {cur.get('wind')} km/h.",
            "telemetry": telemetry,
            "engine": "fallback"
        }

@app.get("/")
def read_root():
    return {"status": "online", "station": "IMD Meteorological Observatory Core"}
