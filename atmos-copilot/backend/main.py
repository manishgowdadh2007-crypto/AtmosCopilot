from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="AtmosCopilot Backend Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        # If city name was passed, resolve coordinates via geocoding
        if city:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
            try:
                geo_res = await client.get(geo_url, headers=headers)
                geo_data = geo_res.json()
                if geo_data.get("results"):
                    target_lat = geo_data["results"][0]["latitude"]
                    target_lon = geo_data["results"][0]["longitude"]
                    resolved_name = geo_data["results"][0].get("name", city)
            except Exception:
                pass

        # Fallback to defaults if neither coordinates nor valid city resolved
        if target_lat is None or target_lon is None:
            target_lat, target_lon = 12.96, 77.56

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
                    "temperature_2m": 24.5,
                    "relative_humidity_2m": 65,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.8
                },
                "status": f"Fallback mode active: {str(e)}"
            }
