from typing import Optional, Callable, Any
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, field_validator
from datetime import datetime, timedelta, timezone
import os
import uuid
import re

from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, ensure_auth_tables,
)


class RegisterBody(BaseModel):
    username: str
    password: str
    role: str  # 'trader' | 'agent'
    broker_id: int

    @field_validator('role')
    @classmethod
    def _role_ok(cls, v: str):
        if v not in ("trader", "agent"):
            raise ValueError("invalid role")
        return v

    @field_validator('username')
    @classmethod
    def _username_ok(cls, v: str):
        v2 = v.strip()
        if not re.fullmatch(r"[A-Za-z0-9_]{3,20}", v2):
            raise ValueError("用户名需为 3-20 位字母/数字/下划线")
        return v2

    @field_validator('password')
    @classmethod
    def _pwd(cls, v: str):
        if len(v) < 8:
            raise ValueError("password too short")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("password must contain letters and numbers")
        return v


class LoginBody(BaseModel):
    username: str
    password: str


def get_auth_router(get_db_connection: Callable[[], Any]) -> APIRouter:
    ensure_auth_tables(get_db_connection)
    router = APIRouter(prefix="/auth", tags=["auth"])

    # Default to False so local HTTP dev works; set COOKIE_SECURE=true in production (HTTPS)
    COOKIE_SECURE = True if os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes") else False
    ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "15"))
    REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "7"))

    def _set_tokens(resp: Response, access: str, refresh: str):
        resp.set_cookie(
            key="access_token", value=access, httponly=True, secure=COOKIE_SECURE,
            samesite="lax", path="/"
        )
        resp.set_cookie(
            key="refresh_token", value=refresh, httponly=True, secure=COOKIE_SECURE,
            samesite="lax", path="/auth/refresh"
        )

    @router.post("/register")
    def register(body: RegisterBody):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            # Check broker exists
            cur.execute("SELECT 1 FROM cfd_brokers WHERE id=?", (body.broker_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Invalid broker_id")
            username = body.username
            cur.execute("SELECT id FROM users WHERE username=?", (username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")
            cur.execute(
                """
                INSERT INTO users (email, username, password_hash, role, broker_id, display_name)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    # 兼容旧表的 NOT NULL email 约束：暂用用户名填充 email 字段
                    username,
                    username,
                    hash_password(body.password),
                    body.role,
                    body.broker_id,
                    # 发帖显示名即用户名
                    username,
                )
            )
            conn.commit()
            return {"success": True}
        finally:
            conn.close()

    @router.post("/login")
    def login(body: LoginBody, request: Request, response: Response):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            username = body.username.strip()
            cur.execute("SELECT id, password_hash, role, broker_id, display_name, failed_login_attempts, locked_until FROM users WHERE username=?", (username,))
            row = cur.fetchone()
            if not row:
                # Do not reveal existence
                raise HTTPException(status_code=401, detail="Invalid credentials")
            d = dict(row)
            # Account lock check
            locked_until = d.get("locked_until")
            if locked_until:
                try:
                    # sqlite returns str timestamp
                    # be tolerant of space-separated format
                    lu = datetime.fromisoformat(str(locked_until))
                    if lu > datetime.utcnow():
                        raise HTTPException(status_code=423, detail="Account locked. Try later.")
                except Exception:
                    pass

            if not verify_password(body.password, d["password_hash"]):
                # Increment fail count
                fails = int(d.get("failed_login_attempts") or 0) + 1
                if fails >= 5:
                    # lock 15 minutes
                    cur.execute("UPDATE users SET failed_login_attempts=?, locked_until=? WHERE id=?", (fails, (datetime.utcnow() + timedelta(minutes=15)).isoformat(), d["id"]))
                else:
                    cur.execute("UPDATE users SET failed_login_attempts=? WHERE id=?", (fails, d["id"]))
                conn.commit()
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Reset fail count and set last_login_at
            cur.execute("UPDATE users SET failed_login_attempts=0, locked_until=NULL, last_login_at=CURRENT_TIMESTAMP WHERE id=?", (d["id"],))

            user_id = int(d["id"])
            access = create_access_token(user_id, d["role"], minutes=ACCESS_TTL_MIN)
            jti = uuid.uuid4().hex
            refresh = create_refresh_token(user_id, jti, days=REFRESH_TTL_DAYS)
            # Persist refresh token
            expires_at = (datetime.utcnow() + timedelta(days=REFRESH_TTL_DAYS)).isoformat()
            issued_at = datetime.utcnow().isoformat()
            cur.execute(
                "INSERT INTO refresh_tokens (user_id, jti, issued_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, jti, issued_at, expires_at, request.headers.get("user-agent"), request.client.host if request.client else None)
            )
            conn.commit()
            _set_tokens(response, access, refresh)
            return {"success": True}
        finally:
            conn.close()

    @router.post("/refresh")
    def refresh(request: Request, response: Response):
        token = request.cookies.get("refresh_token")
        if not token:
            raise HTTPException(status_code=401, detail="No refresh token")
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = int(payload.get("sub"))
        jti = payload.get("jti")
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT id, revoked_at, expires_at FROM refresh_tokens WHERE jti=? AND user_id=?", (jti, user_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Refresh not found")
            d = dict(row)
            if d.get("revoked_at"):
                raise HTTPException(status_code=401, detail="Refresh revoked")
            # rotate
            cur.execute("UPDATE refresh_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE id=?", (d["id"],))
            new_jti = uuid.uuid4().hex
            expires_at = (datetime.utcnow() + timedelta(days=REFRESH_TTL_DAYS)).isoformat()
            issued_at = datetime.utcnow().isoformat()
            cur.execute(
                "INSERT INTO refresh_tokens (user_id, jti, issued_at, expires_at) VALUES (?, ?, ?, ?)",
                (user_id, new_jti, issued_at, expires_at)
            )
            # issue tokens
            cur.execute("SELECT role FROM users WHERE id=?", (user_id,))
            role = cur.fetchone()[0]
            access = create_access_token(user_id, role, minutes=ACCESS_TTL_MIN)
            refresh_token = create_refresh_token(user_id, new_jti, days=REFRESH_TTL_DAYS)
            conn.commit()
            _set_tokens(response, access, refresh_token)
            return {"success": True}
        finally:
            conn.close()

    @router.post("/logout")
    def logout(request: Request, response: Response):
        token = request.cookies.get("refresh_token")
        if token:
            try:
                payload = decode_token(token)
                if payload.get("type") == "refresh":
                    conn = get_db_connection()
                    cur = conn.cursor()
                    try:
                        cur.execute("UPDATE refresh_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE jti=?", (payload.get("jti"),))
                        conn.commit()
                    finally:
                        conn.close()
            except Exception:
                pass
        # Clear cookies
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/auth/refresh")
        return {"success": True}

    @router.get("/me")
    def me(request: Request):
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(payload.get("sub"))
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT u.id, u.username, u.role, u.display_name, u.broker_id, b.name AS broker_name
                FROM users u
                LEFT JOIN cfd_brokers b ON b.id = u.broker_id
                WHERE u.id = ?
            """, (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="User not found")
            return dict(row)
        finally:
            conn.close()

    return router
