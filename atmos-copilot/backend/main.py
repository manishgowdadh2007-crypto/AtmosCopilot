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

app = FastAPI(title="AtmosCopilot Groq Intelligence Engine", version="2.2.0")

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

# 2. Key Provisioning
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

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

# 3. Dynamic Location Name Extraction
def extract_place_from_prompt(prompt: str) -> Optional[str]:
    text = prompt.strip()
    
    patterns = [
        r"(?:weather|forecast|rain|temperature|temp|climate|conditions)\s+(?:in|at|for|around|of)\s+([a-zA-Z\s,]+)",
        r"(?:in|at|for)\s+([a-zA-Z\s,]+)\s+(?:weather|forecast|rain|climate|temperature)",
        r"what(?:'s|\s+is)\s+(?:the\s+)?weather\s+(?:like\s+)?(?:in|at|for)\s+([a-zA-Z\s,]+)",
        r"how(?:'s|\s+is)\s+(?:the\s+)?weather\s+(?:in|at|for)\s+([a-zA-Z\s,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip("?.!, ")
            cleaned = re.sub(r"\b(today|tomorrow|now|currently|tonight|please)\b", "", candidate, flags=re.IGNORECASE).strip()
            if cleaned and len(cleaned) >= 2:
                return cleaned

    noise = {"what", "is", "the", "weather", "forecast", "temp", "temperature", "rain", 
             "in", "at", "for", "how", "like", "today", "now", "tell", "me", "about"}
    words = [w.strip("?.!,") for w in text.split() if w.strip("?.!,").lower() not in noise]
    if words:
        candidate = " ".join(words).strip()
        if len(candidate) >= 2:
            return candidate

    return None

# 4. Live Forward Geocoding for Any Arbitrary Place Name
async def resolve_place_coordinates(place: str) -> Optional[Tuple[float, float, str]]:
    if not place:
        return None

    clean_place = place.strip()

    # Priority A: Google Geocoding API if key configured
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

    # Priority B: OpenStreetMap Nominatim Live Geocoder (Global & Keyless)
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

# 5. Server-Side Reverse Geocoding Endpoint
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

# 6. Fetch Live Open-Meteo Grid Telemetry for Exact Lat/Lon Coordinates
async def fetch_live_grid_telemetry(lat: float, lon: float, location_label: str) -> dict:
    meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
        f"&timezone=auto"
    )

    def wmo_to_condition(code: int) -> str:
        if code == 0: return "Clear Sky"
        if code in [1, 2]: return "Mainly Clear / Partly Cloudy"
        if code == 3: return "Overcast"
        if code in [45, 48]: return "Fog"
        if code in [51, 53, 55]: return "Drizzle"
        if code in [61, 63, 65]: return "Rain"
        if code in [80, 81, 82]: return "Rain Showers"
        if code in [95, 96, 99]: return "Thunderstorm"
        return "Partly Cloudy"

    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.get(meteo_url)
        res.raise_for_status()
        data = res.json()
        current = data.get("current", {})
        daily = data.get("daily", {})

        cur_temp = round(current.get("temperature_2m", 0))
        cur_humidity = round(current.get("relative_humidity_2m", 0))
        cur_wind = round(current.get("wind_speed_10m", 0))
        cur_precip = round(current.get("precipitation", 0))
        cur_pressure = round(current.get("surface_pressure", 1013))
        cur_condition = wmo_to_condition(current.get("weather_code", 0))

        max_temp = round(daily.get("temperature_2m_max", [cur_temp])[0])
        min_temp = round(daily.get("temperature_2m_min", [cur_temp])[0])
        rain_prob = daily.get("precipitation_probability_max", [0])[0]

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
            }
        }

# 7. Sun Copilot Powered by Groq Llama 3.3 70B
@app.post("/api/ai-query")
@app.post("/api/copilot")
async def copilot_intelligence(req: QueryRequest):
    queried_place = extract_place_from_prompt(req.query)

    target_lat = req.lat
    target_lon = req.lon
    target_name = "your current location"

    if queried_place:
        geocoded = await resolve_place_coordinates(queried_place)
        if geocoded:
            target_lat, target_lon, target_name = geocoded
        else:
            target_name = queried_place

    try:
        telemetry = await fetch_live_grid_telemetry(target_lat, target_lon, target_name)
    except Exception as e:
        raise HTTPException(
            status_code=502, 
            detail=f"Live meteorological telemetry unavailable: {str(e)}"
        )

    cur = telemetry["current"]

    if not groq_client:
        return {
            "reply": f"Live reading for {target_name}: {cur['condition']} at {cur['temp']}°C (High: {cur['max_temp']}°C / Low: {cur['min_temp']}°C), {cur['humidity']}% humidity, and {cur['wind']} km/h wind.",
            "telemetry": telemetry,
            "engine": "live_grid_telemetry"
        }

    system_instruction = (
        "You are Sun Copilot, the sharp, authentic, and slightly witty AI meteorological co-pilot for AtmosCopilot. "
        "Your mission is to provide accurate, real-world atmospheric analysis directly grounded in live numerical telemetry. "
        "Rules:\n"
        "1. Never give robotic boilerplate openings (avoid 'Sure!', 'Certainly', 'Here is the weather'). Dive straight into the answer.\n"
        "2. Ground every response in the provided live telemetry (temperature, condition, humidity, wind, and rain probability).\n"
        "3. Provide practical, contextual insights (umbrella necessity, transit advice, comfort/heat index) with light wit.\n"
        "4. Keep answers concise, natural, and under 120 words."
    )

    user_prompt = f"""
[LIVE VERIFIED METEOROLOGICAL TELEMETRY]
Target Locality: {target_name}
Coordinates: {target_lat:.4f}°N, {target_lon:.4f}°E
Current Ambient Temp: {cur['temp']}°C (Forecast High: {cur['max_temp']}°C / Low: {cur['min_temp']}°C)
Atmospheric State: {cur['condition']}
Relative Humidity: {cur['humidity']}%
Surface Wind Velocity: {cur['wind']} km/h
Precipitation Rate: {cur['precipitation']} mm
Precipitation Probability: {cur['rain_prob']}%
Surface Barometric Pressure: {cur['pressure']} hPa

User Inquiry:
"{req.query}"
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.25,
            max_tokens=220
        )
        return {
            "reply": completion.choices[0].message.content.strip(),
            "telemetry": telemetry,
            "engine": "groq-llama-3.3-70b"
        }
    except Exception as e:
        print("Groq execution error:", e)
        return {
            "reply": f"Live observation for {target_name}: {cur['condition']} at {cur['temp']}°C with {cur['humidity']}% humidity, winds at {cur['wind']} km/h, and a {cur['rain_prob']}% chance of rain.",
            "telemetry": telemetry,
            "engine": "live_telemetry_fallback"
        }

# 8. Standard Telemetry Endpoint
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

# 9. User Auth Endpoints
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
    return {"status": "online", "engine": "Groq Llama 3.3 70B Meteorological Core"}
