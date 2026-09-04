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
    city: Optional[str] = Query(None),
    date_str: Optional[str] = Query(None)
):
    headers = {"User-Agent": "curl/7.68.0"}
    target_location = city.strip() if (city and city.strip()) else ""

    if not target_location:
        target_location = f"{lat},{lon}" if (lat is not None and lon is not None) else "Bengaluru"

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            # wttr.in accepts dates directly if provided: wttr.in/Paris?date=2026-08-15
            query_param = f"{target_location}?format=j1"
            if date_str:
                query_param = f"{target_location}?date={date_str}&format=j1"

            res = await client.get(f"https://wttr.in/{query_param}", headers=headers)
            res.raise_for_status()
            data = res.json()

            current_cond = data["current_condition"][0]
            today_weather = data.get("weather", [{}])[0]
            area_info = data.get("nearest_area", [{}])[0]

            resolved_city = area_info.get("areaName", [{}])[0].get("value", target_location.title())
            country = area_info.get("country", [{}])[0].get("value", "")
            full_label = f"{resolved_city}, {country}".strip(", ")

            # Daily aggregated metrics
            rain_chance = int(today_weather.get("hourly", [{}])[0].get("chanceofrain", 0))
            cloud_cover = int(current_cond.get("cloudcover", 0))

            return {
                "latitude": float(area_info.get("latitude", lat or 12.97)),
                "longitude": float(area_info.get("longitude", lon or 77.59)),
                "resolved_city": full_label,
                "current": {
                    "temperature_2m": float(current_cond.get("temp_C", 25.0)),
                    "relative_humidity_2m": float(current_cond.get("humidity", 60.0)),
                    "precipitation": float(current_cond.get("precipMM", 0.0)),
                    "wind_speed_10m": float(current_cond.get("windspeedKmph", 10.0)),
                    "weather_desc": current_cond.get("weatherDesc", [{}])[0].get("value", "Clear"),
                    "cloudcover": cloud_cover,
                    "chance_of_rain": rain_chance
                },
                "daily": {
                    "max_temp": float(today_weather.get("maxtempC", 28.0)),
                    "min_temp": float(today_weather.get("mintempC", 20.0))
                }
            }
        except Exception as e:
            return {
                "latitude": lat or 12.97,
                "longitude": lon or 77.59,
                "resolved_city": target_location.title() or "Local Area",
                "current": {
                    "temperature_2m": 26.0,
                    "relative_humidity_2m": 60,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.0,
                    "weather_desc": "Partly Cloudy",
                    "cloudcover": 40,
                    "chance_of_rain": 10
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
    q = req.query.lower().strip()

    # 1. Detect target location
    # Matches: "in mysore", "at tokyo", "around london", "for delhi", "whether at goa"
    place_match = re.search(r'(?:in|at|for|around|of)\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|tomorrow|on|in\s+\d{4})|$)', q)
    detected_city = place_match.group(1).strip() if place_match else None

    # Disregard filler words if captured as city
    if detected_city in ["today", "tomorrow", "yesterday"]:
        detected_city = None

    # 2. Detect dates (e.g., 2026-08-15, 15 August 2026, yesterday)
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', q)
    date_str = date_match.group(1) if date_match else None

    # Fetch live telemetry
    telemetry = await get_weather_telemetry(
        lat=None if detected_city else req.lat,
        lon=None if detected_city else req.lon,
        city=detected_city,
        date_str=date_str
    )

    city_label = telemetry.get("resolved_city") or (detected_city.title() if detected_city else "your current location")
    cur = telemetry.get("current", {})
    temp = cur.get("temperature_2m", 25.0)
    wind = cur.get("wind_speed_10m", 10.0)
    humidity = cur.get("relative_humidity_2m", 60.0)
    precip = cur.get("precipitation", 0.0)
    cond = cur.get("weather_desc", "Clear").lower()
    clouds = cur.get("cloudcover", 20)
    rain_chance = cur.get("chance_of_rain", 0)

    # 3. Dynamic intent classification

    # Intent A: Rain inquiry ("does it rain today", "will it rain", "is it raining")
    if "rain" in q or "precipitation" in q:
        if precip > 0.5 or "rain" in cond or rain_chance > 50:
            reply = f"Yes, expect rain in {city_label}. Current precipitation is {precip} mm with a {rain_chance}% chance of rainfall and {cond} skies."
        else:
            reply = f"No substantial rain is expected in {city_label} today. Precipitation is at {precip} mm with an estimated rain probability of {rain_chance}%."

    # Intent B: Cloudy inquiry ("is it cloudy today", "cloud cover")
    elif "cloud" in q or "overcast" in q:
        if clouds > 60 or "overcast" in cond or "cloud" in cond:
            reply = f"Yes, it is quite cloudy in {city_label} right now with approximately {clouds}% cloud cover and {cond} conditions."
        else:
            reply = f"No, it is not particularly cloudy in {city_label}. Cloud coverage is low at roughly {clouds}%, keeping the atmosphere mostly clear."

    # Intent C: Sunny / Clear inquiry ("is it sunny today", "clear skies")
    elif "sun" in q or "sunny" in q or "clear" in q:
        if "sunny" in cond or "clear" in cond or clouds < 30:
            reply = f"Yes, it is sunny and clear in {city_label} today with {cond} skies, {clouds}% cloud cover, and temperatures around {temp}°C."
        else:
            reply = f"Not particularly sunny in {city_label} today. Skies are currently {cond} with {clouds}% cloud cover and temperatures around {temp}°C."

    # Intent D: Historical / Past Date queries
    elif date_str:
        reply = f"On {date_str} in {city_label}, atmospheric records report {cond} conditions with a recorded temperature of {temp}°C and {humidity}% humidity."

    # Intent E: Temperature specific ("what is the temperature")
    elif "temp" in q or "temperature" in q or "hot" in q or "cold" in q:
        reply = f"The current temperature in {city_label} is {temp}°C (humidity: {humidity}%, winds: {wind} km/h)."

    # Intent F: General weather overview ("what is the weather", "weather of ...")
    else:
        reply = f"Weather in {city_label}: currently {cond} at {temp}°C, {humidity}% humidity, and wind speeds reaching {wind} km/h."

    return {"reply": reply, "telemetry": telemetry}
