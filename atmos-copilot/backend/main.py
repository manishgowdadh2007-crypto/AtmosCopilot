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
    
    # Prioritize city search if passed; otherwise fall back to exact GPS
    target_query = city.strip() if (city and city.strip()) else ""
    if not target_query:
        if lat is not None and lon is not None:
            target_query = f"{lat},{lon}"
        else:
            target_query = "Bengaluru"

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            param = f"{target_query}?format=j1"
            if date_str:
                param = f"{target_query}?date={date_str}&format=j1"

            res = await client.get(f"https://wttr.in/{param}", headers=headers)
            res.raise_for_status()
            data = res.json()

            current_cond = data["current_condition"][0]
            today_weather = data.get("weather", [{}])[0]
            area_info = data.get("nearest_area", [{}])[0]

            # If user explicitly searched a city/locality, use their input as the label
            if city and city.strip():
                resolved_label = city.strip().title()
            else:
                raw_area = area_info.get("areaName", [{}])[0].get("value", "")
                raw_region = area_info.get("region", [{}])[0].get("value", "")
                resolved_label = f"{raw_area}, {raw_region}".strip(", ") or "Your Location"

            cloud_cover = int(current_cond.get("cloudcover", 0))
            rain_chance = int(today_weather.get("hourly", [{}])[0].get("chanceofrain", 0))

            return {
                "latitude": float(area_info.get("latitude", lat or 12.97)),
                "longitude": float(area_info.get("longitude", lon or 77.59)),
                "resolved_city": resolved_label,
                "current": {
                    "temperature_2m": float(current_cond.get("temp_C", 25.0)),
                    "relative_humidity_2m": float(current_cond.get("humidity", 60.0)),
                    "precipitation": float(current_cond.get("precipMM", 0.0)),
                    "wind_speed_10m": float(current_cond.get("windspeedKmph", 10.0)),
                    "weather_desc": current_cond.get("weatherDesc", [{}])[0].get("value", "Clear"),
                    "cloudcover": cloud_cover,
                    "chance_of_rain": rain_chance
                }
            }
        except Exception as e:
            return {
                "latitude": lat or 12.97,
                "longitude": lon or 77.59,
                "resolved_city": (city.title() if city else "Current Location"),
                "current": {
                    "temperature_2m": 25.0,
                    "relative_humidity_2m": 60,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.0,
                    "weather_desc": "Clear",
                    "cloudcover": 20,
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
    q = req.query.strip()
    q_lower = q.lower()

    # 1. Improved place extraction
    # Matches patterns like: "in mysore", "at tokyo", "for london", "weather of paris", "temperature in JJR nagar"
    target_city = None
    place_match = re.search(r'(?:in|at|for|around|of)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:today|tomorrow|yesterday|now|right now|on)|$|\?)', q, re.IGNORECASE)
    
    if place_match:
        candidate = place_match.group(1).strip()
        # Filter out common stop words if falsely captured
        if candidate.lower() not in ["the", "my area", "here", "current location", "present area", "today", "tomorrow", "yesterday"]:
            target_city = candidate

    # 2. Date extraction (YYYY-MM-DD)
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', q)
    date_str = date_match.group(1) if date_match else None

    # If user asked about a specific place, IGNORE the device GPS so it does not fetch your current place
    fetch_lat = None if target_city else req.lat
    fetch_lon = None if target_city else req.lon

    telemetry = await get_weather_telemetry(
        lat=fetch_lat,
        lon=fetch_lon,
        city=target_city,
        date_str=date_str
    )

    city_label = target_city.title() if target_city else telemetry.get("resolved_city", "your present location")
    cur = telemetry.get("current", {})
    temp = cur.get("temperature_2m", 25.0)
    wind = cur.get("wind_speed_10m", 10.0)
    humidity = cur.get("relative_humidity_2m", 60.0)
    precip = cur.get("precipitation", 0.0)
    cond = cur.get("weather_desc", "Clear").lower()
    clouds = cur.get("cloudcover", 20)
    rain_chance = cur.get("chance_of_rain", 0)

    # 3. Dynamic Intent Responses
    if "rain" in q_lower or "precipitation" in q_lower:
        if precip > 0.1 or "rain" in cond or rain_chance > 40:
            reply = f"Yes, rain is expected in {city_label}. Precipitation is at {precip} mm with a {rain_chance}% chance of rain and {cond} skies."
        else:
            reply = f"No rain expected in {city_label} today. Precipitation is {precip} mm with only a {rain_chance}% chance of rainfall."

    elif "cloud" in q_lower or "overcast" in q_lower:
        if clouds > 50 or "overcast" in cond or "cloud" in cond:
            reply = f"Yes, it is cloudy in {city_label} with {clouds}% cloud coverage and {cond} conditions."
        else:
            reply = f"No, skies are mostly clear in {city_label} with low cloud cover at around {clouds}%."

    elif "sun" in q_lower or "sunny" in q_lower or "clear" in q_lower:
        if "sun" in cond or "clear" in cond or clouds < 30:
            reply = f"Yes, it is sunny and clear in {city_label} with {clouds}% cloud cover and temperatures around {temp}°C."
        else:
            reply = f"It is not particularly sunny in {city_label} right now; conditions are {cond} with {clouds}% cloud cover."

    elif date_str:
        reply = f"On {date_str} in {city_label}, atmospheric records indicate {cond} skies with a temperature of {temp}°C and {humidity}% humidity."

    elif "temp" in q_lower or "temperature" in q_lower or "hot" in q_lower or "cold" in q_lower:
        reply = f"The current temperature in {city_label} is {temp}°C with {humidity}% humidity and wind speeds of {wind} km/h."

    else:
        reply = f"Current weather in {city_label}: {cond} at {temp}°C, {humidity}% humidity, and wind speeds around {wind} km/h."

    return {"reply": reply, "telemetry": telemetry}
