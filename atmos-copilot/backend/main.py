from pydantic import BaseModel
import re
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="AtmosCopilot Backend Engine", version="1.0.0")

# Enable CORS for your Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "AtmosCopilot Backend Operational"}

@app.get("/api/weather-telemetry")
async def get_weather_telemetry(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    city: Optional[str] = Query(None)
):
    headers = {"User-Agent": "AtmosCopilot/1.0 (weather-app)"}
    target_lat = lat
    target_lon = lon
    resolved_name = "Target Area"

    async with httpx.AsyncClient(timeout=12.0) as client:
        # 1. If city name was passed, resolve coordinates via geocoding
        if city:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
            try:
                geo_res = await client.get(geo_url, headers=headers)
                geo_data = geo_res.json()
                if geo_data.get("results"):
                    target_lat = geo_data["results"][0]["latitude"]
                    target_lon = geo_data["results"][0]["longitude"]
                    city_name = geo_data["results"][0].get("name", city)
                    country = geo_data["results"][0].get("country", "")
                    resolved_name = f"{city_name}, {country}".strip(", ")
            except Exception:
                pass

        # 2. Fallback coordinates if neither coords nor valid city resolved
        if target_lat is None or target_lon is None:
            target_lat, target_lon = 12.96, 77.56
            resolved_name = "Bengaluru, India"

        # 3. Fetch telemetry for target coordinates
        forecast_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": target_lat,
            "longitude": target_lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
            "hourly": "temperature_2m",
            "daily": "temperature_2m_max,temperature_2m_min",
            "timezone": "auto"
        }

        try:
            res = await client.get(forecast_url, params=params, headers=headers)
            res.raise_for_status()
            data = res.json()
            data["resolved_city"] = resolved_name
            return data
        except Exception as e:
            # Fallback mock so UI never breaks if Open-Meteo rate-limits
            return {
                "latitude": target_lat,
                "longitude": target_lon,
                "resolved_city": resolved_name,
                "current": {
                    "temperature_2m": 24.5,
                    "relative_humidity_2m": 65,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.8
                },
                "hourly": {
                    "temperature_2m": [22.0, 21.5, 20.8, 23.0, 26.5, 25.0]
                },
                "status": f"Fallback mode active: {str(e)}"
            }
class QueryRequest(BaseModel):
    query: str
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.post("/api/ai-query")
@app.post("/api/copilot")
async def copilot_intelligence(req: QueryRequest):
    user_text = req.query.strip()
    
    # Extract place name if user mentions "in <city>", "at <city>", etc.
    place_match = re.search(r'(?:in|at|for|around)\s+([a-zA-Z\s]+)', user_text, re.IGNORECASE)
    detected_city = place_match.group(1).strip() if place_match else None
    
    try:
        telemetry = await get_weather_telemetry(lat=req.lat, lon=req.lon, city=detected_city)
    except Exception:
        telemetry = {
            "resolved_city": detected_city or "Current Region",
            "current": {"temperature_2m": 24.5, "relative_humidity_2m": 65, "wind_speed_10m": 12.0}
        }

    city_label = telemetry.get("resolved_city", "your area")
    cur = telemetry.get("current", {})
    temp = cur.get("temperature_2m", "--")
    wind = cur.get("wind_speed_10m", "--")
    humidity = cur.get("relative_humidity_2m", "--")

    reply = (
        f"In {city_label}, the current temperature is {temp}°C with a relative humidity of "
        f"{humidity}% and wind velocities reaching {wind} km/h."
    )
    
    return {"reply": reply, "telemetry": telemetry}
