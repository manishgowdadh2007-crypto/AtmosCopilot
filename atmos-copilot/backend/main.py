from typing import Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import httpx
import sqlite3
import re

app = FastAPI(title="AtmosCopilot IMD Meteorological Core", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Initialization
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

# Schemas
class RegisterSchema(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginSchema(BaseModel):
    identifier: str
    phone: str
    password: str

class QueryRequest(BaseModel):
    query: str
    lat: float
    lon: float

# Routes
@app.get("/")
def read_root():
    return {"status": "online", "station": "IMD Bengaluru Meteorological Observatory"}

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: RegisterSchema):
    # Validate name (words/spaces only)
    if not re.match(r"^[a-zA-Z\s]+$", user.name):
        raise HTTPException(status_code=400, detail="Name can only contain letters and spaces.")
    
    # Validate email
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", user.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    
    # Validate phone (exact 10 digits)
    if not re.match(r"^\d{10}$", user.phone):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    
    # Validate password
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()

    # Check for duplicate email or duplicate name
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
        "user": {
            "name": user.name.strip(),
            "email": user.email.lower().strip(),
            "phone": user.phone.strip()
        }
    }

@app.post("/api/login")
def login(creds: LoginSchema):
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()

    cursor.execute("""
        SELECT name, email, phone FROM users 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) 
          AND phone = ? 
          AND password = ?
    """, (creds.identifier, creds.identifier, creds.phone, creds.password))
    
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=401, 
            detail="Invalid credentials. Verify your name/email, mobile, and password."
        )

    return {
        "status": "authenticated",
        "user": {
            "name": row[0],
            "email": row[1],
            "phone": row[2]
        }
    }

async def fetch_imd_bengaluru_telemetry():
    """Scrapes real-time station metrics directly from IMD Bengaluru's portal."""
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

            # 1. Temperature parsing
            temp_match = re.search(r'([0-9]{2}(?:\.[0-9])?)\s*°\s*C', html)
            temp = float(temp_match.group(1)) if temp_match else None

            # 2. Humidity parsing
            humidity_match = re.search(r'([0-9]{2})\s*%', html)
            humidity = int(humidity_match.group(1)) if humidity_match else None

            # 3. Wind speed & direction
            wind_match = re.search(r'([A-Za-z]+)\s+([0-9]+(?:\.[0-9])?)\s*km/?h', html, re.IGNORECASE)
            wind_dir = wind_match.group(1).title() if wind_match else "Southwesterly"
            wind_speed = float(wind_match.group(2)) if wind_match else 12.0

            # 4. Sun & Moon ephemeris
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
            print("IMD direct scrap warning:", e)
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
        f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m"
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

            # Prefer live IMD telemetry; fallback to Open-Meteo if IMD server is unresponsive
            cur_temp = imd_data["temp"] if imd_data else round(m_curr.get("temperature_2m", 26))
            cur_hum = imd_data["humidity"] if imd_data else round(m_curr.get("relative_humidity_2m", 68))
            cur_wind = imd_data["wind"] if imd_data else round(m_curr.get("wind_speed_10m", 10))
            wind_dir = imd_data.get("wind_dir", "Westerly") if imd_data else "Southwesterly"

            # Diurnal hourly projection
            now_hour = datetime.now().hour
            hourly_times = hourly_raw.get("time", [])
            hourly_temps = hourly_raw.get("temperature_2m", [])
            hourly_precip = hourly_raw.get("precipitation_probability", [])
            hourly_winds = hourly_raw.get("wind_speed_10m", [])

            hourly_list = []
            for i in range(now_hour, min(now_hour + 24, len(hourly_times)), 3):
                dt_point = datetime.fromisoformat(hourly_times[i])
                h
