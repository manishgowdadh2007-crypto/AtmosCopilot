from typing import Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import re

app = FastAPI(title="AtmosCopilot Core", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

class RegisterSchema(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginSchema(BaseModel):
    identifier: str
    phone: str
    password: str

class ResetPasswordSchema(BaseModel):
    identifier: str
    phone: str
    new_password: str

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: RegisterSchema):
    if not re.match(r"^[a-zA-Z\s]+$", user.name):
        raise HTTPException(status_code=400, detail="Name can only contain letters and spaces.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", user.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    if not re.match(r"^\d{10}$", user.phone):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT email, name FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)", 
                   (user.email, user.name))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        if existing[0].lower() == user.email.lower():
            raise HTTPException(status_code=409, detail="Email address is already registered.")
        raise HTTPException(status_code=409, detail="Operator name is already taken.")

    cursor.execute("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
                   (user.name.strip(), user.email.lower().strip(), user.phone.strip(), user.password.strip()))
    conn.commit()
    conn.close()

    return {
        "status": "registered",
        "user": {"name": user.name.strip(), "email": user.email.lower().strip(), "phone": user.phone.strip()}
    }

@app.post("/api/login")
def login(creds: LoginSchema):
    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name, email, phone FROM users 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) 
          AND phone = ? AND password = ?
    """, (creds.identifier, creds.identifier, creds.phone, creds.password))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials. Verify your name/email, mobile, and password.")
    return {"status": "authenticated", "user": {"name": row[0], "email": row[1], "phone": row[2]}}

@app.post("/api/reset-password")
def reset_password(data: ResetPasswordSchema):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    conn = sqlite3.connect("atmos_users.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id FROM users 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)) AND phone = ?
    """, (data.identifier, data.identifier, data.phone))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No operator found matching this identifier and mobile number.")

    cursor.execute("UPDATE users SET password = ? WHERE id = ?", (data.new_password.strip(), row[0]))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Password updated successfully."}
