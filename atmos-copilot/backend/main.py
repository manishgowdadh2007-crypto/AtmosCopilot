from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import re

app = FastAPI(title="AtmosCopilot Backend Engine", version="1.0.0")

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
    headers = {"User-Agent": "curl/7.68.0"}
    target_location = city.strip() if (city and city.strip()) else ""

    if not target_location:
        target_location = f"{lat},{lon}" if (lat is not None and lon is not None) else "Bengaluru"

    async with httpx.AsyncClient(timeout=12.0) as client:
        # Use wttr.in JSON format: reliable, unblocked, and supports any global city/coordinates
        try:
            wttr_url = f"https://wttr.in/{target_location}?format=j1"
            res = await client.get(wttr_url, headers=headers)
            res.raise_for_status()
            data = res.json()

            current_cond = data["current_condition"][0]
            area_info = data.get("nearest_area", [{}])[0]
            resolved_city = area_info.get("areaName", [{}])[0].get("value", target_location.title())
            country = area_info.get("country", [{}])[0].get("value", "")
            full_label = f"{resolved_city}, {country}".strip(", ")

            return {
                "latitude": float(area_info.get("latitude", lat or 12.97)),
                "longitude": float(area_info.get("longitude", lon or 77.59)),
                "resolved_city": full_label,
                "current": {
                    "temperature_2m": float(current_cond.get("temp_C", 25.0)),
                    "relative_humidity_2m": float(current_cond.get("humidity", 60.0)),
                    "precipitation": float(current_cond.get("precipMM", 0.0)),
                    "wind_speed_10m": float(current_cond.get("windspeedKmph", 10.0)),
                    "weather_desc": current_cond.get("weatherDesc", [{}])[0].get("value", "Clear")
                },
                "hourly": {
                    "temperature_2m": [float(h.get("tempC", 24)) for h in data.get("weather", [{}])[0].get("hourly", [])]
                },
                "source": "live"
            }
        except Exception as e:
            # Fallback only if the meteorological upstream server is unreachable
            return {
                "latitude": lat or 12.97,
                "longitude": lon or 77.59,
                "resolved_city": target_location.title() or "Local Area",
                "current": {
                    "temperature_2m": 26.5,
                    "relative_humidity_2m": 60,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.0,
                    "weather_desc": "Clear"
                },
                "status": f"Fallback: {str(e)}"
            }

class QueryRequest(BaseModel):
    query: str
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.post("/api/ai-query")
@app.post("/api/copilot")
async def copilot_intelligence(req: QueryRequest):
    user_text = req.query.strip()

    # Detect city keywords like "in mysore", "of tokyo", "for london"
    place_match = re.search(
        r'(?:in|at|for|around|weather of|temperature of|temp of)\s+([a-zA-Z\s]+)', 
        user_text, 
        re.IGNORECASE
    )
    detected_city = place_match.group(1).strip() if place_match else None

    # Query telemetry for the detected city
    telemetry = await get_weather_telemetry(
        lat=None if detected_city else req.lat,
        lon=None if detected_city else req.lon,
        city=detected_city
    )

    city_label = telemetry.get("resolved_city") or (detected_city.title() if detected_city else "your current location")
    cur = telemetry.get("current", {})
    temp = cur.get("temperature_2m", "--")
    wind = cur.get("wind_speed_10m", "--")
    humidity = cur.get("relative_humidity_2m", "--")
    condition = cur.get("weather_desc", "fair conditions")

    reply = (
        f"In {city_label}, conditions are currently {condition.lower()} with a temperature of "
        f"{temp}°C, a relative humidity of {humidity}%, and winds around {wind} km/h."
    )
    return {"reply": reply, "telemetry": telemetry}
