import os

PROJECT_NAME = "AtmosCopilot API"
API_PREFIX = "/api"
DB_PATH = os.getenv("DB_PATH", "atmos_users.db")
OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
