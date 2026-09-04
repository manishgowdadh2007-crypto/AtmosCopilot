from fastapi import APIRouter
import httpx
from app.schemas.schemas import AIChatRequest
from app.core.config import OPEN_METEO_BASE_URL

router = APIRouter()

@router.post("/ai-query")
async def handle_ai_query(req: AIChatRequest):
    # Fetch ground truth telemetry from numerical prediction model
    params = {
        "latitude": req.lat,
        "longitude": req.lon,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"],
        "timezone": "auto"
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.get(OPEN_METEO_BASE_URL, params=params)
        data = res.json().get("current", {}) if res.status_code == 200 else {}

    temp = data.get("temperature_2m", "--")
    rain = data.get("precipitation", 0.0)
    wind = data.get("wind_speed_10m", "--")
    humidity = data.get("relative_humidity_2m", "--")
    q = req.query.lower()

    # Meteorological Strict Boundary Check
    valid_meteorology_terms = ["weather", "rain", "temperature", "forecast", "climate", "wind", "storm", "hot", "cold", "humidity", "cloud", "heat"]
    if not any(word in q for word in valid_meteorology_terms):
        return {
            "reply": "I am AtmosCopilot, an exclusive meteorological core. I am constrained strictly to verified weather, precipitation, and atmospheric forecast intelligence."
        }

    if "rain" in q or "precipitation" in q:
        reply = f"Current precipitation index stands at {rain}mm. {'Active rainfall recorded; protect open field crops.' if rain > 0 else 'Skies are dry with zero detected rainfall.'}"
    elif "temp" in q or "hot" in q or "cold" in q:
        reply = f"The live ambient temperature is {temp}°C (Wind: {wind} km/h, Humidity: {humidity}%)."
    elif "wind" in q or "storm" in q:
        reply = f"Current surface wind velocity is {wind} km/h. {'Caution: Gusts exceed normal thresholds.' if isinstance(wind, (int, float)) and wind > 35 else 'Wind vectors remain stable.'}"
    else:
        reply = f"Synoptic reading for ({req.lat:.2f}°N, {req.lon:.2f}°E): Ambient Temp {temp}°C, Humidity {humidity}%, Surface Wind {wind} km/h, Precipitation {rain}mm."

    return {"reply": reply}