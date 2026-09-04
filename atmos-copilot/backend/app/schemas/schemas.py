from pydantic import BaseModel, EmailStr

class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    phone: str
    latitude: float
    longitude: float

class AIChatRequest(BaseModel):
    query: str
    lat: float
    lon: float

class ServerStatus(BaseModel):
    status: str
    message: str