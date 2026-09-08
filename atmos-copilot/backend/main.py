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

app = FastAPI(title="AtmosCopilot Groq Intelligence Engine", version="2.4.0")

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

# 4. Open-Meteo Direct Geocoding (Handles typos, worldwide cities, zero API keys required)
async def resolve_place_coordinates(place: str) -> Optional[Tuple[float, float, str]]:
    if not place:
        return None

    clean_place = place.strip().strip("?.!,")
    # Normalize common typos
    if clean_place.lower() in ["chenni", "chenai"]:
        clean_place = "Chennai"

    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_place}&count=1&language=en&format=json"
    headers = {"User-Agent": "AtmosCopilot-App/3.0 (dev-telemetry)"}

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(geo_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                results = data.get("results")
                if results and len(results) > 0:
                    top = results[0]
                    lat = float(top["latitude"])
                    lon = float(top["longitude"])
                    name = top.get("name", clean_place)
                    admin = top.get("admin1", "")
                    country = top.get("country", "")
                    label = f"{name}, {admin}" if admin else f"{name}, {country}" if country else name
                    return lat, lon, label
    except Exception as e:
        print("Geocoding lookup error:", e)

    return None

@app.get("/api/reverse-geocode")
async def reverse_geocode_endpoint(lat: float = Query(...), lon: float = Query(...)):
    osm_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=jsonv2&zoom=16&addressdetails=1"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            osm_res = await client.get(osm_url, headers={"User-Agent": "AtmosCopilot/2.4 (contact: dev@atmoscopilot.io)"})
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

# 6. Ultra-Fast Live Open-Meteo Telemetry
async def fetch_live_grid_telemetry(lat: float, lon: float, location_label: str) -> dict:
    meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max"
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

    headers = {"User-Agent": "AtmosCopilot-App/3.0 (dev-telemetry)"}

    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            res = await client.get(meteo_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current", {})
                daily = data.get("daily", {})

                cur_temp = round(current.get("temperature_2m", 26))
                cur_hum = round(current.get("relative_humidity_2m", 55))
                cur_wind = round(current.get("wind_speed_10m", 12))
                cur_code = current.get("weather_code", 1)

                max_list = daily.get("temperature_2m_max", [])
                min_list = daily.get("temperature_2m_min", [])
                rain_list = daily.get("precipitation_probability_max", [])

                return {
                    "resolved_city": location_label,
                    "latitude": lat,
                    "longitude": lon,
                    "current": {
                        "temp": cur_temp,
                        "condition": wmo_to_condition(cur_code),
                        "humidity": cur_hum,
                        "wind": cur_wind,
                        "max_temp": round(max_list[0]) if max_list else cur_temp + 3,
                        "min_temp": round(min_list[0]) if min_list else cur_temp - 4,
                        "rain_prob": round(rain_list[0]) if rain_list else 10
                    }
                }
    except Exception as e:
        print("Meteo live sync error:", e)

    return {
        "resolved_city": location_label,
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temp": 24,
            "condition": "Clear",
            "humidity": 50,
            "wind": 10,
            "max_temp": 28,
            "min_temp": 19,
            "rain_prob": 5
        }
    }

# 7. Conversational Copilot Intelligence
@app.post("/api/copilot")
@app.post("/api/ai-query")
async def copilot_intelligence(req: QueryRequest):
    prompt_text = req.query.strip()

    target_lat = req.lat
    target_lon = req.lon
    target_name = "User Location"

    place_match = re.search(r"(?:in|at|for|near|around)\s+([a-zA-Z\s]+)", prompt_text, re.IGNORECASE)
    candidate = None
    if place_match:
        candidate = place_match.group(1).strip("?.!, ")
    else:
        words = [w for w in prompt_text.split() if len(w) > 3 and w.lower() not in ["what", "weather", "temperature", "forecast", "today"]]
        if words:
            candidate = words[-1]

    if candidate:
        candidate = re.sub(r"\b(today|tomorrow|now|currently|tonight|please)\b", "", candidate, flags=re.IGNORECASE).strip()
        if len(candidate) >= 3:
            geocoded = await resolve_place_coordinates(candidate)
            if geocoded:
                target_lat, target_lon, target_name = geocoded
            else:
                target_name = candidate.title()

    telemetry = await fetch_live_grid_telemetry(target_lat, target_lon, target_name)
    cur = telemetry.get("current", {})

    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip() or "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"

    models_to_try = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "groq/compound-mini"
    ]

    system_instruction = (
        "You are Sun Copilot, the AI meteorologist for AtmosCopilot. "
        "Answer the user's weather or climate question directly, concisely, and naturally. "
        "Rules:\n"
        "1. Strictly use the provided [LIVE TELEMETRY] metrics (exact temperature, high, low, condition, and rain chance).\n"
        "2. Do not fabricate values or repeat boilerplate intros.\n"
        "3. Keep answers under 60 words."
    )

    context_message = f"""
[LIVE TELEMETRY]
Target Locality: {target_name} ({target_lat:.4f}°N, {target_lon:.4f}°E)
Live Temp: {cur.get('temp')}°C (High: {cur.get('max_temp')}°C, Low: {cur.get('min_temp')}°C)
Condition: {cur.get('condition')}
Humidity: {cur.get('humidity')}%
Wind Speed: {cur.get('wind')} km/h
Rain Probability: {cur.get('rain_prob')}%

User Inquiry:
"{req.query}"
"""

    try:
        client = Groq(api_key=groq_api_key)
        for m_id in models_to_try:
            try:
                completion = client.chat.completions.create(
                    model=m_id,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": context_message}
                    ],
                    temperature=0.2,
                    max_tokens=150
                )
                return {
                    "reply": completion.choices[0].message.content.strip(),
                    "telemetry": telemetry,
                    "engine": f"groq-{m_id}"
                }
            except Exception as loop_err:
                print(f"Model {m_id} failed: {loop_err}")
                continue
    except Exception as client_err:
        print("Groq Client error:", client_err)

    return {
        "reply": f"In {target_name}, it is currently {cur.get('condition')} at {cur.get('temp')}°C (High: {cur.get('max_temp')}°C, Low: {cur.get('min_temp')}°C) with a {cur.get('rain_prob')}% chance of rain.",
        "telemetry": telemetry,
        "engine": "fast_telemetry_fallback"
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
    return {"status": "online", "engine": "Groq Dynamic Meteorological Intelligence Engine"}
