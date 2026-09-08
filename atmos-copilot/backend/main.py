import os
import re
import sqlite3
from typing import Optional, Tuple
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from groq import Groq

app = FastAPI(title="AtmosCopilot Groq Intelligence Engine", version="2.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip() or "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"
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

class QueryRequest(BaseModel):
    query: str
    lat: float
    lon: float

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

async def resolve_place_coordinates(place: str) -> Optional[Tuple[float, float, str]]:
    if not place:
        return None

    clean_place = place.strip()

    if GOOGLE_MAPS_API_KEY:
        google_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={clean_place}&key={GOOGLE_MAPS_API_KEY}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.get(google_url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("results"):
                        item = data["results"][0]
                        lat = item["geometry"]["location"]["lat"]
                        lon = item["geometry"]["location"]["lng"]
                        name = item.get("formatted_address", clean_place).split(",")[0]
                        return lat, lon, name
            except Exception:
                pass

    osm_url = f"https://nominatim.openstreetmap.org/search?q={clean_place}&format=json&limit=1"
    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            res = await client.get(osm_url, headers={"User-Agent": "AtmosCopilot/2.2"})
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    display_name = data[0]["display_name"].split(",")[0]
                    return lat, lon, display_name
        except Exception:
            pass

    return None

@app.get("/api/reverse-geocode")
async def reverse_geocode_endpoint(lat: float = Query(...), lon: float = Query(...)):
    if GOOGLE_MAPS_API_KEY:
        google_url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={GOOGLE_MAPS_API_KEY}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.get(google_url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("results"):
                        first_res = data["results"][0]
                        sublocality, locality, district, state = "", "", "", ""
                        for comp in first_res.get("address_components", []):
                            types = comp.get("types", [])
                            if any(k in types for k in ["sublocality", "sublocality_level_1", "neighborhood"]):
                                sublocality = comp.get("long_name", "")
                            if "locality" in types:
                                locality = comp.get("long_name", "")
                            if "administrative_area_level_2" in types:
                                district = comp.get("long_name", "")
                            if "administrative_area_level_1" in types:
                                state = comp.get("long_name", "")
                        
                        primary = sublocality or locality or district
                        secondary = locality if primary != locality else (district or state)
                        if primary and secondary:
                            return {"city": f"{primary}, {secondary}"}
                        return {"city": first_res.get("formatted_address", "").split(",")[0]}
            except Exception:
                pass

    osm_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=jsonv2&zoom=16&addressdetails=1"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            osm_res = await client.get(osm_url, headers={"User-Agent": "AtmosCopilot/2.2"})
            if osm_res.status_code == 200:
                addr = osm_res.json().get("address", {})
                micro = addr.get("suburb") or addr.get("neighbourhood") or addr.get("village") or addr.get("road")
                macro = addr.get("city") or addr.get("town") or addr.get("county") or addr.get("state_district")
                if micro and macro:
                    return {"city": f"{micro}, {macro}"}
                if macro:
                    return {"city": macro}
        except Exception:
            pass

    return {"city": f"{lat:.4f}°N, {lon:.4f}°E"}

async def fetch_live_grid_telemetry(lat: float, lon: float, location_label: str) -> dict:
    meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,surface_pressure,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
        f"&timezone=auto"
    )

    def wmo_to_condition(code: int) -> str:
        if code == 0: return "Clear Sky"
        if code in [1, 2]: return "Partly Cloudy"
        if code == 3: return "Overcast"
        if code in [45, 48]: return "Fog"
        if code in [51, 53, 55]: return "Drizzle"
        if code in [61, 63, 65]: return "Rain"
        if code in [80, 81, 82]: return "Rain Showers"
        if code in [95, 96, 99]: return "Thunderstorm"
        return "Partly Cloudy"

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(meteo_url)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current", {})
                daily_raw = data.get("daily", {})
                hourly_raw = data.get("hourly", {})

                cur_temp = round(current.get("temperature_2m", 26))
                cur_humidity = round(current.get("relative_humidity_2m", 55))
                cur_wind = round(current.get("wind_speed_10m", 12))
                cur_precip = round(current.get("precipitation", 0))
                cur_pressure = round(current.get("surface_pressure", 1013))
                cur_condition = wmo_to_condition(current.get("weather_code", 1))

                max_temp = round(daily_raw.get("temperature_2m_max", [cur_temp])[0])
                min_temp = round(daily_raw.get("temperature_2m_min", [cur_temp])[0])
                rain_prob = daily_raw.get("precipitation_probability_max", [0])[0]

                current_hour = datetime.now().hour
                hourly = []
                times = hourly_raw.get("time", [])
                for i in range(current_hour, min(current_hour + 24, len(times)), 3):
                    try:
                        d_obj = datetime.fromisoformat(times[i])
                        hr = d_obj.hour
                        label = "12 am" if hr == 0 else "12 pm" if hr == 12 else f"{hr - 12} pm" if hr > 12 else f"{hr} am"
                    except Exception:
                        label = f"{i % 24}:00"

                    hourly.append({
                        "time": label,
                        "temp": round(hourly_raw.get("temperature_2m", [26] * len(times))[i]),
                        "precip": round(hourly_raw.get("precipitation_probability", [0] * len(times))[i]),
                        "wind": round(hourly_raw.get("wind_speed_10m", [10] * len(times))[i])
                    })

                day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                daily = []
                daily_times = daily_raw.get("time", [])
                for idx, dt in enumerate(daily_times[:7]):
                    try:
                        d_obj = datetime.fromisoformat(dt)
                        day_name = "Today" if idx == 0 else day_labels[d_obj.weekday()]
                    except Exception:
                        day_name = "Today" if idx == 0 else f"Day {idx + 1}"

                    daily.append({
                        "day": day_name,
                        "max_temp": round(daily_raw.get("temperature_2m_max", [30])[idx]),
                        "min_temp": round(daily_raw.get("temperature_2m_min", [20])[idx]),
                        "condition": wmo_to_condition(daily_raw.get("weather_code", [0])[idx]),
                        "chance_of_rain": round(daily_raw.get("precipitation_probability_max", [0])[idx])
                    })

                return {
                    "resolved_city": location_label,
                    "latitude": lat,
                    "longitude": lon,
                    "current": {
                        "temp": cur_temp,
                        "condition": cur_condition,
                        "humidity": cur_humidity,
                        "wind": cur_wind,
                        "pressure": cur_pressure,
                        "precipitation": cur_precip,
                        "dew_point": round(cur_temp - ((100 - cur_humidity) / 5)),
                        "max_temp": max_temp,
                        "min_temp": min_temp,
                        "rain_prob": rain_prob
                    },
                    "hourly": hourly,
                    "daily": daily
                }
    except Exception as e:
        print("Meteo upstream error:", e)

    return {
        "resolved_city": location_label,
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temp": 26,
            "condition": "Partly Cloudy",
            "humidity": 55,
            "wind": 12,
            "pressure": 1013,
            "precipitation": 0,
            "dew_point": 16,
            "max_temp": 30,
            "min_temp": 20,
            "rain_prob": 10
        },
        "hourly": [
            {"time": "6 pm", "temp": 26, "precip": 0, "wind": 12},
            {"time": "9 pm", "temp": 24, "precip": 0, "wind": 10},
            {"time": "12 am", "temp": 22, "precip": 0, "wind": 8},
            {"time": "3 am", "temp": 20, "precip": 0, "wind": 7}
        ],
        "daily": [
            {"day": "Today", "max_temp": 30, "min_temp": 20, "condition": "Partly Cloudy", "chance_of_rain": 10}
        ]
    }

@app.post("/api/copilot")
@app.post("/api/ai-query")
async def copilot_intelligence(req: QueryRequest):
    prompt_text = req.query.strip()
    match = re.search(r"(?:in|at|for|around)\s+([a-zA-Z\s]+)", prompt_text, re.IGNORECASE)

    target_lat = req.lat
    target_lon = req.lon
    target_name = "User's Location"

    if match:
        extracted = match.group(1).strip("?.!, ")
        cleaned = re.sub(r"\b(today|tomorrow|now|currently|tonight|please)\b", "", extracted, flags=re.IGNORECASE).strip()
        if cleaned and len(cleaned) >= 2:
            geocoded = await resolve_place_coordinates(cleaned)
            if geocoded:
                target_lat, target_lon, target_name = geocoded
            else:
                target_name = cleaned

    telemetry = await fetch_live_grid_telemetry(target_lat, target_lon, target_name)
    cur = telemetry.get("current", {})

    client = None
    try:
        if GROQ_API_KEY:
            client = Groq(api_key=GROQ_API_KEY)
    except Exception as init_err:
        print("Groq Init Error:", init_err)

    system_instruction = (
        "You are Sun Copilot, the sharp, authentic AI meteorological co-pilot for AtmosCopilot. "
        "Answer the user's questions clearly, naturally, and contextually. "
        "Handle spelling mistakes seamlessly (e.g., 'wether in chenni' means weather in Chennai). "
        "Rules:\n"
        "1. Never give boilerplate openings (avoid 'Sure!', 'Certainly'). Jump directly into the answer.\n"
        "2. For weather queries, ground your answer in the provided live telemetry.\n"
        "3. Keep answers concise, helpful, and under 100 words."
    )

    user_context = f"""
[LIVE VERIFIED METEOROLOGICAL TELEMETRY]
Target Station: {target_name} ({target_lat:.4f}°N, {target_lon:.4f}°E)
Current Temp: {cur.get('temp', 26)}°C (High: {cur.get('max_temp', 30)}°C / Low: {cur.get('min_temp', 20)}°C)
Atmospheric State: {cur.get('condition', 'Partly Cloudy')}
Relative Humidity: {cur.get('humidity', 55)}%
Wind Velocity: {cur.get('wind', 12)} km/h
Precipitation Probability: {cur.get('rain_prob', 10)}%

User Inquiry:
"{req.query}"
"""

    if client:
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_context}
                ],
                temperature=0.3,
                max_tokens=220
            )
            return {
                "reply": completion.choices[0].message.content.strip(),
                "telemetry": telemetry,
                "engine": "groq-llama-3.1-8b"
            }
        except Exception as groq_err:
            print("Groq Inference Error:", groq_err)

    cond = cur.get('condition', 'Partly Cloudy')
    temp = cur.get('temp', 26)
    rain = cur.get('rain_prob', 10)
    return {
        "reply": f"In {target_name}, it is currently {cond} at {temp}°C with {cur.get('humidity', 55)}% humidity and a {rain}% chance of rain.",
        "telemetry": telemetry,
        "engine": "smart_telemetry_fallback"
    }

@app.get("/api/weather-telemetry")
async def get_weather_telemetry(
    lat: float = Query(...),
    lon: float = Query(...),
    city: Optional[str] = Query(default=None)
):
    if not city or city.startswith("annotation="):
        resolved_info = await reverse_geocode_endpoint(lat=lat, lon=lon)
        target_name = resolved_info.get("city", f"{lat:.4f}°N, {lon:.4f}°E")
    else:
        target_name = city

    return await fetch_live_grid_telemetry(lat, lon, target_name)

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: RegisterSchema):
    if not re.match(r"^[a-zA-Z\s]+$", user.name):
        raise HTTPException(status_code=400, detail="Name can only contain letters and spaces.")
    if not re.match(r"^\d{10}$", user.phone):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT email, name FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)", 
                   (user.email, user.name))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="User or email already registered.")

    cursor.execute("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
                   (user.name.strip(), user.email.lower().strip(), user.phone.strip(), user.password.strip()))
    conn.commit()
    conn.close()
    return {"status": "registered", "user": {"name": user.name, "email": user.email, "phone": user.phone}}

@app.post("/api/login")
def login(creds: LoginSchema):
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, phone FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) AND phone = ? AND password = ?",
                   (creds.identifier, creds.identifier, creds.phone, creds.password))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    return {"status": "authenticated", "user": {"name": row[0], "email": row[1], "phone": row[2]}}

@app.post("/api/reset-password")
def reset_password(payload: ResetPasswordSchema):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) AND phone = ?",
                   (payload.new_password.strip(), payload.identifier, payload.identifier, payload.phone))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found or details incorrect.")
    conn.commit()
    conn.close()
    return {"status": "password_updated"}

@app.get("/")
def root():
    return {"status": "online", "engine": "Groq Llama 3.1 8B Meteorological Core"}
