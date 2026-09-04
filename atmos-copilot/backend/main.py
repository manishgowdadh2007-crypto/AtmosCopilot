from fastapi import FastAPI, HTTPException
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

@app.get("/api/weather-telemetry")
async def get_weather_telemetry(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "hourly": "temperature_2m",
        "daily": "temperature_2m_max,temperature_2m_min",
        "timezone": "auto"
    }
    headers = {
        "User-Agent": "AtmosCopilot/1.0"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(url, params=params, headers=headers)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            return {
                "latitude": lat,
                "longitude": lon,
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

# (Keep your existing /api/register and /api/ai-query endpoints below this)
