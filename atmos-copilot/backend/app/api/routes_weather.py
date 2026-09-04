from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import OPEN_METEO_BASE_URL

router = APIRouter()

@router.get("/weather-telemetry")
async def get_weather_telemetry(lat: float, lon: float):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m", 
            "relative_humidity_2m", 
            "apparent_temperature", 
            "precipitation", 
            "weather_code", 
            "wind_speed_10m"
        ],
        "daily": [
            "weather_code", 
            "temperature_2m_max", 
            "temperature_2m_min", 
            "precipitation_sum"
        ],
        "timezone": "auto"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(OPEN_METEO_BASE_URL, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed upstream link to meteorological servers.")
        return response.json()