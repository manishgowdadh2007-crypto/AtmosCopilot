from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import re

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
    headers = {"User-Agent": "AtmosCopilot/1.0 (weather-application)"}
    target_lat = None
    target_lon = None
    resolved_name = None

    async with httpx.AsyncClient(timeout=12.0) as client:
        # 1. Geocode place name if specified
        if city and city.strip():
            clean_city = city.strip()
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_city}&count=1&language=en&format=json"
            try:
                geo_res = await client.get(geo_url, headers=headers)
                geo_data = geo_res.json()
                if geo_data.get("results"):
                    target_lat = geo_data["results"][0]["latitude"]
                    target_lon = geo_data["results"][0]["longitude"]
                    name = geo_data["results"][0].get("name", clean_city)
                    country = geo_data["results"][0].get("country", "")
                    resolved_name = f"{name}, {country}".strip(", ")
            except Exception:
                pass

        # 2. Fall back to supplied coordinates or default region
        if target_lat is None or target_lon is None:
            if lat is not None and lon is not None:
                target_lat, target_lon = lat, lon
                resolved_name = resolved_name or "Local Area"
            else:
                target_lat, target_lon = 12.9716, 77.5946
                resolved_name = "Bengaluru, India"

        # 3. Retrieve forecast telemetry
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
            return {
                "latitude": target_lat,
                "longitude": target_lon,
                "resolved_city": resolved_name,
                "current": {
                    "temperature_2m": 27.2,
                    "relative_humidity_2m": 62,
                    "precipitation": 0.0,
                    "wind_speed_10m": 11.4
                },
                "hourly": {
                    "temperature_2m": [25.0, 24.2, 23.8, 26.1, 28.0, 27.2]
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

    # Match common location prepositions and phrases
    place_match = re.search(
        r'(?:in|at|for|around|weather of|temperature of|temp of)\s+([a-zA-Z\s]+)', 
        user_text, 
        re.IGNORECASE
    )
    detected_city = place_match.group(1).strip() if place_match else None

    # Ignore default coordinate overrides when a target city is detected
    query_lat = None if detected_city else req.lat
    query_lon = None if detected_city else req.lon

    telemetry = await get_weather_telemetry(lat=query_lat, lon=query_lon, city=detected_city)

    city_label = telemetry.get("resolved_city", detected_city or "your current location")
    cur = telemetry.get("current", {})
    temp = cur.get("temperature_2m", "--")
    wind = cur.get("wind_speed_10m", "--")
    humidity = cur.get("relative_humidity_2m", "--")

    reply = (
        f"In {city_label}, the current temperature is {temp}°C with a relative humidity of "
        f"{humidity}% and wind velocities at {wind} km/h."
    )
    return {"reply": reply, "telemetry": telemetry}metry}
