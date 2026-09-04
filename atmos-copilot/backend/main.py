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
    headers = {"User-Agent": "AtmosCopilot/1.0 (weather-core)"}
    resolved_place = None

    async with httpx.AsyncClient(timeout=12.0) as client:
        # 1. Reverse-geocode exact sub-locality/neighborhood when GPS coords are present
        if lat is not None and lon is not None and not city:
            try:
                geo_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
                geo_res = await client.get(geo_url, headers=headers)
                if geo_res.status_code == 200:
                    g = geo_res.json()
                    suburb = g.get("locality") or g.get("city") or g.get("principalSubdivision")
                    city_name = g.get("city") or g.get("principalSubdivision")
                    if suburb and city_name and suburb.lower() != city_name.lower():
                        resolved_place = f"{suburb}, {city_name}"
                    else:
                        resolved_place = suburb or city_name
            except Exception:
                pass

        target_query = city.strip() if (city and city.strip()) else ""
        if not target_query:
            target_query = f"{lat},{lon}" if (lat is not None and lon is not None) else "Bengaluru"

        try:
            param = f"{target_query}?format=j1"
            if date_str:
                param = f"{target_query}?date={date_str}&format=j1"

            res = await client.get(f"https://wttr.in/{param}", headers=headers)
            res.raise_for_status()
            data = res.json()

            current_cond = data["current_condition"][0]
            area_info = data.get("nearest_area", [{}])[0]

            if not resolved_place:
                if city and city.strip():
                    resolved_place = city.strip().title()
                else:
                    raw_sub = area_info.get("areaName", [{}])[0].get("value", "Vijayanagar")
                    raw_reg = area_info.get("region", [{}])[0].get("value", "Bengaluru")
                    resolved_place = f"{raw_sub}, {raw_reg}"

            # 7-day forecast array for Google Weather card
            daily_list = []
            days_names = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
            for idx, w in enumerate(data.get("weather", [])[:8]):
                day_title = days_names[idx % 7]
                daily_list.append({
                    "day": day_title,
                    "max_temp": int(w.get("maxtempC", 30)),
                    "min_temp": int(w.get("mintempC", 21)),
                    "condition": w.get("hourly", [{}])[4].get("weatherDesc", [{}])[0].get("value", "Partly cloudy"),
                    "chance_of_rain": int(w.get("hourly", [{}])[4].get("chanceofrain", 12))
                })

            # 8-slot hourly trends for Google Weather chart
            first_day_hourly = data.get("weather", [{}])[0].get("hourly", [])
            hourly_list = []
            for h in first_day_hourly:
                raw_time = int(h.get("time", "0")) // 100
                time_label = "12 am" if raw_time == 0 else f"{raw_time - 12} pm" if raw_time >= 12 else f"{raw_time} am"
                if raw_time == 12:
                    time_label = "12 pm"
                hourly_list.append({
                    "time": time_label,
                    "temp": int(h.get("tempC", 24)),
                    "precip": int(h.get("chanceofrain", 12)),
                    "wind": int(h.get("windspeedKmph", 10))
                })

            cloud_cover = int(current_cond.get("cloudcover", 0))
            rain_chance = int(data.get("weather", [{}])[0].get("hourly", [{}])[0].get("chanceofrain", 12))

            return {
                "latitude": float(area_info.get("latitude", lat or 12.97)),
                "longitude": float(area_info.get("longitude", lon or 77.59)),
                "resolved_city": resolved_place,
                "current": {
                    "temp": int(current_cond.get("temp_C", 24)),
                    "temperature_2m": float(current_cond.get("temp_C", 24.0)),
                    "condition": current_cond.get("weatherDesc", [{}])[0].get("value", "Partly cloudy"),
                    "weather_desc": current_cond.get("weatherDesc", [{}])[0].get("value", "Partly cloudy"),
                    "humidity": int(current_cond.get("humidity", 75)),
                    "relative_humidity_2m": float(current_cond.get("humidity", 75.0)),
                    "wind": int(current_cond.get("windspeedKmph", 10)),
                    "wind_speed_10m": float(current_cond.get("windspeedKmph", 10.0)),
                    "precipitation": rain_chance,
                    "precipMM": float(current_cond.get("precipMM", 0.0)),
                    "cloudcover": cloud_cover,
                    "chance_of_rain": rain_chance
                },
                "hourly": hourly_list,
                "daily": daily_list
            }
        except Exception as e:
            return {
                "latitude": lat or 12.97,
                "longitude": lon or 77.59,
                "resolved_city": resolved_place or (city.title() if city else "Vijayanagar, Bengaluru"),
                "current": {
                    "temp": 24,
                    "temperature_2m": 24.0,
                    "condition": "Partly cloudy",
                    "weather_desc": "Partly cloudy",
                    "humidity": 75,
                    "relative_humidity_2m": 75.0,
                    "wind": 10,
                    "wind_speed_10m": 10.0,
                    "precipitation": 12,
                    "precipMM": 0.0,
                    "cloudcover": 30,
                    "chance_of_rain": 12
                },
                "hourly": [
                    {"time": "10 pm", "temp": 24, "precip": 12, "wind": 10},
                    {"time": "1 am", "temp": 23, "precip": 10, "wind": 9},
                    {"time": "4 am", "temp": 22, "precip": 5, "wind": 8},
                    {"time": "7 am", "temp": 21, "precip": 5, "wind": 8},
                    {"time": "10 am", "temp": 25, "precip": 10, "wind": 12},
                    {"time": "1 pm", "temp": 29, "precip": 15, "wind": 14},
                    {"time": "4 pm", "temp": 31, "precip": 20, "wind": 15},
                    {"time": "7 pm", "temp": 28, "precip": 15, "wind": 11}
                ],
                "daily": [
                    {"day": "Fri", "max_temp": 30, "min_temp": 21, "condition": "Rain"},
                    {"day": "Sat", "max_temp": 31, "min_temp": 21, "condition": "Partly cloudy"},
                    {"day": "Sun", "max_temp": 31, "min_temp": 20, "condition": "Partly cloudy"},
                    {"day": "Mon", "max_temp": 31, "min_temp": 20, "condition": "Partly cloudy"},
                    {"day": "Tue", "max_temp": 31, "min_temp": 21, "condition": "Partly cloudy"},
                    {"day": "Wed", "max_temp": 30, "min_temp": 21, "condition": "Partly cloudy"},
                    {"day": "Thu", "max_temp": 30, "min_temp": 21, "condition": "Cloudy"},
                    {"day": "Fri", "max_temp": 30, "min_temp": 21, "condition": "Partly cloudy"}
                ],
                "status": f"Fallback active: {str(e)}"
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

    # 1. Location extraction
    target_city = None
    place_match = re.search(r'(?:in|at|for|around|of)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:today|tomorrow|yesterday|now|right now|on)|$|\?)', q, re.IGNORECASE)
    
    if place_match:
        candidate = place_match.group(1).strip()
        if candidate.lower() not in ["the", "my area", "here", "current location", "present area", "today", "tomorrow", "yesterday"]:
            target_city = candidate

    # 2. Date extraction (YYYY-MM-DD)
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', q)
    date_str = date_match.group(1) if date_match else None

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
    temp = cur.get("temp", cur.get("temperature_2m", 24))
    wind = cur.get("wind", cur.get("wind_speed_10m", 10))
    humidity = cur.get("humidity", cur.get("relative_humidity_2m", 75))
    precip = cur.get("precipMM", 0.0)
    cond = cur.get("condition", cur.get("weather_desc", "Clear")).lower()
    clouds = cur.get("cloudcover", 20)
    rain_chance = cur.get("precipitation", cur.get("chance_of_rain", 12))

    # 3. Intent response formatting
    if "rain" in q_lower or "precipitation" in q_lower:
        if precip > 0.1 or "rain" in cond or rain_chance > 40:
            reply = f"Yes, rain is expected in {city_label}. Precipitation chance is {rain_chance}% with {cond} skies."
        else:
            reply = f"No rain expected in {city_label} today. Current rain probability is {rain_chance}%."

    elif "cloud" in q_lower or "overcast" in q_lower:
        if clouds > 50 or "overcast" in cond or "cloud" in cond:
            reply = f"Yes, it is cloudy in {city_label} with {clouds}% cloud coverage and {cond} conditions."
        else:
            reply = f"No, skies are mostly clear in {city_label} with low cloud cover around {clouds}%."

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
