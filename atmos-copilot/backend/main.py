from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.api.routes_auth import router as auth_router
from app.api.routes_weather import router as weather_router
from app.api.routes_chat import router as chat_router

# Initialize the SQLite table on spin-up
init_db()

app = FastAPI(title="AtmosCopilot Backend Engine", version="1.0.0")

# Cross-Origin Resource Sharing for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(weather_router, prefix="/api", tags=["Weather"])
app.include_router(chat_router, prefix="/api", tags=["Copilot"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)