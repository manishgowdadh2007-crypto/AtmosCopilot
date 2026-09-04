from fastapi import APIRouter, HTTPException
from app.schemas.schemas import UserRegistration, ServerStatus
from app.db.database import get_connection

router = APIRouter()

@router.post("/register", response_model=ServerStatus)
def register_user(user: UserRegistration):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, email, phone, latitude, longitude)
            VALUES (?, ?, ?, ?, ?)
        """, (user.name, user.email, user.phone, user.latitude, user.longitude))
        conn.commit()
        conn.close()
        return ServerStatus(status="success", message="Operator credentials recorded.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fault: {str(e)}")