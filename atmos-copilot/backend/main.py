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

app = FastAPI(title="AtmosCopilot Dynamic Meteorological Intelligence Engine", version="2.5.1")

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

# Robust worldwide city resolver using wttr.in coordinate lookup
async def resolve_place_coordinates(place: str) -> Optional[Tuple[float, float, str]]:
    if not place:
        return None

    clean_place = place.strip().strip("?.!,")
    # Handle common misspellings or regional names
    typo_map = {
        "chenni": "Chennai",
        "chenai": "Chennai",
        "kodagu": "Madikeri",
        "coorg": "Madikeri",
        "bangalore": "Bengaluru",
        "davangere": "Davanagere"
    }
    target_query = typo_map.get(clean_place.lower(), clean_place)

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtmosCopilot/3.5"}
    
    # 1. Primary geocoder via Open-Meteo search
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={target_query}&count=1&language=en&format=json"
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(geo_url, headers=headers)
            if res.status_code == 200:
                results = res.json().get("results")
                if results:
                    top = results[0]
                    return float(top["latitude"]), float(top["longitude"]), top.get("name", target_query)
    except Exception as e:
        print("Geocoding primary failed:", e)

    # 2. Direct coordinate lookup via wttr.in
    try:
        wttr_url = f"https://wttr.in/{target_query}?format=j1"
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(wttr_url, headers=headers)
            if res.status_code == 200:
                area = res.json().get("nearest_area", [{}])[0]
                lat = float(area.get("latitude", 0))
                lon = float(area.get("longitude", 0))
                name = area.get("areaName", [{}])[0].get("value", target_query)
                if lat != 0 and lon != 0:
                    return lat, lon, name
    except Exception as e:
        print("wttr fallback geocoding failed:", e)

    return None

@app.get("/api/reverse-geocode")
async def reverse_geocode_endpoint(lat: float = Query(...), lon: float = Query(...)):
    osm_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=jsonv2&zoom=16&addressdetails=1"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            osm_res = await client.get(osm_url, headers={"User-Agent": "AtmosCopilot/3.5"})
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
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtmosCopilot/3.5"}

    try:
        wttr_url = f"https://wttr.in/{lat:.4f},{lon:.4f}?format=j1"
        async with httpx.AsyncClient(timeout=7.0) as client:
            res = await client.get(wttr_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                cc = data["current_condition"][0]
                weather_today = data["weather"][0]

                cur_temp = int(cc.get("temp_C", 25))
                cur_hum = int(cc.get("humidity", 60))
                cur_wind = int(cc.get("windspeedKmph", 12))
                cur_desc = cc.get("weatherDesc", [{}])[0].get("value", "Partly Cloudy")

                max_t = int(weather_today.get("maxtempC", cur_temp + 3))
                min_t = int(weather_today.get("mintempC", cur_temp - 4))

                rain_prob = 10
                hourly_entries = weather_today.get("hourly", [])
                if hourly_entries:
                    rain_prob = max([int(h.get("chanceofrain", 0)) for h in hourly_entries])

                return {
                    "resolved_city": location_label,
                    "latitude": lat,
                    "longitude": lon,
                    "current": {
                        "temp": cur_temp,
                        "condition": cur_desc,
                        "humidity": cur_hum,
                        "wind": cur_wind,
                        "max_temp": max_t,
                        "min_temp": min_t,
                        "rain_prob": rain_prob
                    }
                }
    except Exception as wttr_err:
        print("wttr.in error:", wttr_err)

    return {
        "resolved_city": location_label,
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temp": 25,
            "condition": "Partly Cloudy",
            "humidity": 60,
            "wind": 10,
            "max_temp": 28,
            "min_temp": 21,
            "rain_prob": 15
        }
    }

@app.post("/api/copilot")
@app.post("/api/ai-query")
async def copilot_intelligence(req: QueryRequest):
    prompt_text = req.query.strip()
    target_lat = req.lat
    target_lon = req.lon
    target_name = "User Location"

    # Robust regex location matching covering typos like "wether in..."
    candidate = None
    place_match = re.search(r"(?:in|at|for|near|around)\s+([a-zA-Z\s]+)", prompt_text, re.IGNORECASE)
    if place_match:
        raw_place = place_match.group(1).strip("?.!, ")
        cleaned = re.sub(r"\b(today|tomorrow|now|currently|tonight|please|the|a)\b", "", raw_place, flags=re.IGNORECASE).strip()
        if len(cleaned) >= 3:
            candidate = cleaned
    else:
        words = [w for w in re.findall(r"[a-zA-Z]+", prompt_text) if len(w) > 3 and w.lower() not in ["what", "weather", "wether", "temperature", "forecast", "today", "tomorrow"]]
        if words:
            candidate = words[-1]

    if candidate:
        resolved = await resolve_place_coordinates(candidate)
        if resolved:
            target_lat, target_lon, target_name = resolved
        else:
            target_name = candidate.title()

    telemetry = await fetch_live_grid_telemetry(target_lat, target_lon, target_name)
    cur = telemetry.get("current", {})

    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip() or "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"
    models_to_try = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b", "groq/compound-mini"]

    system_instruction = (
        "You are Sun Copilot, the meteorological AI for AtmosCopilot. "
        "Answer directly, naturally, and concisely using the provided live telemetry. "
        "Strictly cite the exact numbers from the telemetry. Keep your response under 60 words."
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
                print(f"Model {m_id} error:", loop_err)
                continue
    except Exception as client_err:
        print("Groq Client init error:", client_err)

    return {
        "reply": f"In {target_name}, it is currently {cur.get('condition')} at {cur.get('temp')}°C with a high of {cur.get('max_temp')}°C, low of {cur.get('min_temp')}°C, and a {cur.get('rain_prob')}% chance of rain.",
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
