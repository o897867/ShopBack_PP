import os
import time
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional, Callable, Any

import jwt
from fastapi import HTTPException, Depends, Request
from pydantic import BaseModel
from argon2 import PasswordHasher


ph = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_secret() -> str:
    secret = os.getenv("SECRET_KEY")
    if not secret:
        # WARNING: For production, set SECRET_KEY in environment
        secret = "dev-secret-change-me"
    return secret


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        ph.verify(password_hash, password)
        return True
    except Exception:
        return False


def create_access_token(user_id: int, role: str, minutes: int = 15) -> str:
    now = _utcnow()
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    return jwt.encode(payload, get_secret(), algorithm="HS256")


def create_refresh_token(user_id: int, jti: str, days: int = 7) -> str:
    now = _utcnow()
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=days)).timestamp()),
    }
    return jwt.encode(payload, get_secret(), algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_dependency(get_db_connection: Callable[[], Any]):
    async def _dep(request: Request):
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = int(payload.get("sub"))
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, username, email, role, broker_id, display_name FROM users WHERE id=?", (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="User not found")
            return dict(row)
        finally:
            conn.close()
    return _dep


def ensure_auth_tables(get_db_connection: Callable[[], Any]):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                username TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('trader','agent')),
                broker_id INTEGER NOT NULL,
                display_name TEXT,
                email_verified INTEGER DEFAULT 0,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP,
                FOREIGN KEY (broker_id) REFERENCES cfd_brokers (id)
            )
            """
        )
        # Backfill username column if table existed without it
        cur.execute("PRAGMA table_info(users)")
        cols = {r[1] for r in cur.fetchall()}
        if 'username' not in cols:
            try:
                cur.execute("ALTER TABLE users ADD COLUMN username TEXT")
            except Exception:
                pass
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                jti TEXT NOT NULL UNIQUE,
                issued_at TIMESTAMP NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                revoked_at TIMESTAMP,
                user_agent TEXT,
                ip TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id)")
        conn.commit()
    finally:
        conn.close()
