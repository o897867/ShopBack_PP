from typing import Optional, List, Dict, Any, Callable
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field, validator
import json
import time
from typing import Deque
from collections import deque, defaultdict
import os

from sanitize import sanitize_html
from mod_rules import evaluate as evaluate_rules
import sqlite3


class ForumThreadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, description="标题不能为空且不超过120字符")
    content_html: str = Field(..., min_length=1, max_length=10000, description="内容不能为空且不超过10000字符")
    tags: Optional[List[str]] = Field(None, max_items=5, description="标签不超过5个")
    author_name: Optional[str] = Field(None, max_length=50, description="作者名不超过50字符")
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('标题不能为空')
        return v.strip()
    
    @validator('tags')
    def validate_tags(cls, v):
        if v:
            for tag in v:
                if len(tag) > 20:
                    raise ValueError('单个标签不能超过20字符')
                if not tag.strip():
                    raise ValueError('标签不能为空')
        return v
    
    @validator('author_name')
    def validate_author_name(cls, v):
        if v and len(v.strip()) == 0:
            return None
        return v


class ForumThreadOut(BaseModel):
    id: int
    title: str
    author_name: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str
    created_at: str
    last_post_at: Optional[str] = None


class ForumPostCreate(BaseModel):
    content_html: str = Field(..., min_length=1, max_length=10000, description="内容不能为空且不超过10000字符")
    author_name: Optional[str] = Field(None, max_length=50, description="作者名不超过50字符")
    
    @validator('author_name')
    def validate_author_name(cls, v):
        if v and len(v.strip()) == 0:
            return None
        return v


class ForumPostOut(BaseModel):
    id: int
    thread_id: int
    author_name: Optional[str] = None
    safe_html: str
    status: str
    created_at: str


class PostEditRequest(BaseModel):
    content_html: str = Field(..., min_length=1, max_length=10000, description="内容不能为空且不超过10000字符")


class ModerationAction(BaseModel):
    reason: Optional[str] = Field(None, max_length=500, description="原因不超过500字符")
    moderator_name: Optional[str] = Field(None, max_length=50, description="管理员名不超过50字符")


class ReportCreate(BaseModel):
    post_id: int = Field(..., gt=0, description="帖子ID必须为正整数")
    reason: str = Field(..., min_length=1, max_length=500, description="举报原因不能为空且不超过500字符")
    reporter_name: Optional[str] = Field(None, max_length=50, description="举报人名不超过50字符")
    
    @validator('reason')
    def validate_reason(cls, v):
        if not v or not v.strip():
            raise ValueError('举报原因不能为空')
        return v.strip()


RateKey = str


def get_forum_router(get_db_connection: Callable[[], Any]) -> APIRouter:
    router = APIRouter(prefix="/api/forum", tags=["forum"])

    # Ensure tables
    def ensure_forum_tables():
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS forum_threads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    author_id TEXT,
                    author_name TEXT,
                    tags_json TEXT,
                    status TEXT DEFAULT 'normal',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_post_at TIMESTAMP
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS forum_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    thread_id INTEGER NOT NULL,
                    author_id TEXT,
                    author_name TEXT,
                    raw_html TEXT,
                    safe_html TEXT,
                    status TEXT DEFAULT 'published',
                    rules_score INTEGER DEFAULT 0,
                    rules_hits_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (thread_id) REFERENCES forum_threads(id)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS forum_moderation_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    moderator_id TEXT,
                    moderator_name TEXT,
                    action TEXT NOT NULL,
                    reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES forum_posts(id)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS forum_reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    reporter_id TEXT,
                    reporter_name TEXT,
                    reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    handled_by TEXT,
                    handled_at TIMESTAMP,
                    resolution TEXT,
                    FOREIGN KEY (post_id) REFERENCES forum_posts(id)
                )
                """
            )
            cur.execute('CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id, created_at)')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status, created_at)')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_forum_threads_last_post ON forum_threads(last_post_at)')
            conn.commit()
        finally:
            try:
                conn.close()
            except Exception:
                pass

    ensure_forum_tables()

    # In-process rate limiter (MVP)
    rate_counters: dict[RateKey, Deque[float]] = defaultdict(deque)

    def rate_limit(request: Request, key_hint: str, times: int, per_seconds: int):
        now = time.time()
        user_key = request.headers.get('X-User-Id') or ''
        ip = request.client.host if request.client else 'unknown'
        key = f"{key_hint}:{user_key or ip}"
        dq = rate_counters[key]
        while dq and dq[0] <= now - per_seconds:
            dq.popleft()
        if len(dq) >= times:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        dq.append(now)

    # Simple moderator auth using shared secret (MVP)
    MOD_SECRET = os.getenv("MODERATOR_SECRET", "")

    def require_moderator(request: Request):
        if not MOD_SECRET:
            # If not configured, deny by default in production; allow in dev
            # To enable, set MODERATOR_SECRET env
            raise HTTPException(status_code=403, detail="Moderator API disabled")
        if request.headers.get("X-Admin-Secret") != MOD_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

    # Routes
    @router.post("/threads", response_model=ForumThreadOut, summary="Create thread (first post)")
    async def create_thread(body: ForumThreadCreate, request: Request):
        # Defensive: ensure tables exist
        try:
            ensure_forum_tables()
        except Exception:
            pass
        rate_limit(request, key_hint="forum_create_thread", times=10, per_seconds=60)
        # Pydantic已经验证了输入，这里直接使用
        title = body.title

        safe = sanitize_html(body.content_html)
        score, hits = evaluate_rules(body.content_html)
        status = 'pending' if score >= 5 else 'published'
        tags_json = json.dumps(body.tags or [])

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO forum_threads (title, author_name, tags_json, status, last_post_at) VALUES (?, ?, ?, 'normal', CURRENT_TIMESTAMP)",
                (title, body.author_name, tags_json)
            )
            thread_id = cur.lastrowid
            cur.execute(
                """
                INSERT INTO forum_posts (thread_id, author_name, raw_html, safe_html, status, rules_score, rules_hits_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (thread_id, body.author_name, body.content_html, safe, status, score, json.dumps([h.__dict__ for h in hits]))
            )
            conn.commit()
            cur.execute("SELECT id, title, author_name, tags_json, status, created_at, last_post_at FROM forum_threads WHERE id = ?", (thread_id,))
            row = dict(cur.fetchone())
            return ForumThreadOut(
                id=row['id'], title=row['title'], author_name=row.get('author_name'),
                tags=json.loads(row.get('tags_json') or '[]'), status=row['status'],
                created_at=row['created_at'], last_post_at=row.get('last_post_at')
            )
        except sqlite3.OperationalError as e:
            # Common production issue: SQLite file not writable
            msg = str(e).lower()
            if 'readonly' in msg or 'read-only' in msg or 'write' in msg:
                raise HTTPException(status_code=503, detail="数据库文件不可写。请检查 DB_PATH 位置与文件权限/属主。")
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass

    @router.get("/threads", response_model=List[ForumThreadOut], summary="List threads")
    async def list_threads(tag: Optional[str] = None, author: Optional[str] = None, limit: int = 20, offset: int = 0):
        try:
            ensure_forum_tables()
        except Exception:
            pass
        limit = max(1, min(limit, 50))
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            base = "SELECT id, title, author_name, tags_json, status, created_at, last_post_at FROM forum_threads"
            where = []
            args: list = []
            if tag:
                # 转义LIKE特殊字符防止SQL注入
                escaped_tag = tag.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_").replace("'", "''")
                where.append("tags_json LIKE ? ESCAPE '\\'")
                args.append(f"%{escaped_tag}%")
            if author:
                where.append("author_name = ?")
                args.append(author)
            sql = base + (" WHERE " + " AND ".join(where) if where else "") + " ORDER BY COALESCE(last_post_at, created_at) DESC, id DESC LIMIT ? OFFSET ?"
            args.extend([limit, offset])
            cur.execute(sql, args)
            rows = [dict(r) for r in cur.fetchall()]
            out: List[ForumThreadOut] = []
            for r in rows:
                out.append(ForumThreadOut(
                    id=r['id'], title=r['title'], author_name=r.get('author_name'),
                    tags=json.loads(r.get('tags_json') or '[]'), status=r['status'],
                    created_at=r['created_at'], last_post_at=r.get('last_post_at')
                ))
            return out
        finally:
            conn.close()

    @router.get("/threads/{thread_id}", summary="Get a thread with posts")
    async def get_thread(thread_id: int, page: int = 1, page_size: int = 20, moderator: bool = False):
        page_size = max(1, min(page_size, 50))
        offset = (max(1, page) - 1) * page_size
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT id, title, author_name, tags_json, status, created_at, last_post_at FROM forum_threads WHERE id = ?", (thread_id,))
            t = cur.fetchone()
            if not t:
                raise HTTPException(status_code=404, detail="Thread not found")
            thread = dict(t)
            if moderator:
                cur.execute(
                    "SELECT id, thread_id, author_name, safe_html, status, created_at FROM forum_posts WHERE thread_id = ? ORDER BY id ASC LIMIT ? OFFSET ?",
                    (thread_id, page_size, offset)
                )
            else:
                cur.execute(
                    "SELECT id, thread_id, author_name, safe_html, status, created_at FROM forum_posts WHERE thread_id = ? AND status = 'published' ORDER BY id ASC LIMIT ? OFFSET ?",
                    (thread_id, page_size, offset)
                )
            posts = [ForumPostOut(**dict(r)) for r in cur.fetchall()]
            return {
                "thread": ForumThreadOut(
                    id=thread['id'], title=thread['title'], author_name=thread.get('author_name'),
                    tags=json.loads(thread.get('tags_json') or '[]'), status=thread['status'],
                    created_at=thread['created_at'], last_post_at=thread.get('last_post_at')
                ),
                "posts": posts
            }
        finally:
            conn.close()

    @router.post("/threads/{thread_id}/posts", response_model=ForumPostOut, summary="Reply to a thread")
    async def reply_thread(thread_id: int, body: ForumPostCreate, request: Request):
        try:
            ensure_forum_tables()
        except Exception:
            pass
        rate_limit(request, key_hint="forum_reply", times=10, per_seconds=60)
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT id FROM forum_threads WHERE id = ?", (thread_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Thread not found")

            safe = sanitize_html(body.content_html)
            score, hits = evaluate_rules(body.content_html)
            status = 'pending' if score >= 5 else 'published'
            cur.execute(
                """
                INSERT INTO forum_posts (thread_id, author_name, raw_html, safe_html, status, rules_score, rules_hits_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (thread_id, body.author_name, body.content_html, safe, status, score, json.dumps([h.__dict__ for h in hits]))
            )
            post_id = cur.lastrowid
            cur.execute("UPDATE forum_threads SET last_post_at=CURRENT_TIMESTAMP WHERE id = ?", (thread_id,))
            conn.commit()
            cur.execute("SELECT id, thread_id, author_name, safe_html, status, created_at FROM forum_posts WHERE id = ?", (post_id,))
            return ForumPostOut(**dict(cur.fetchone()))
        except sqlite3.OperationalError as e:
            msg = str(e).lower()
            if 'readonly' in msg or 'read-only' in msg or 'write' in msg:
                raise HTTPException(status_code=503, detail="数据库文件不可写。请检查 DB_PATH 位置与文件权限/属主。")
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass

    @router.patch("/posts/{post_id}", response_model=ForumPostOut, summary="Edit own post (MVP)")
    async def edit_post(post_id: int, body: PostEditRequest):
        safe = sanitize_html(body.content_html)
        score, hits = evaluate_rules(body.content_html)
        status = 'pending' if score >= 5 else 'published'
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT thread_id FROM forum_posts WHERE id = ?", (post_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Post not found")
            cur.execute(
                "UPDATE forum_posts SET raw_html=?, safe_html=?, status=?, rules_score=?, rules_hits_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (body.content_html, safe, status, score, json.dumps([h.__dict__ for h in hits]), post_id)
            )
            conn.commit()
            cur.execute("SELECT id, thread_id, author_name, safe_html, status, created_at FROM forum_posts WHERE id = ?", (post_id,))
            return ForumPostOut(**dict(cur.fetchone()))
        finally:
            conn.close()

    @router.delete("/posts/{post_id}", summary="Delete post (soft)")
    async def delete_post(post_id: int):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE forum_posts SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id = ?", (post_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Post not found")
            conn.commit()
            return {"success": True}
        finally:
            conn.close()

    @router.get("/moderation/queue", response_model=List[ForumPostOut], summary="List pending posts (MVP)")
    async def moderation_queue(limit: int = 50, offset: int = 0, _: None = Depends(require_moderator)):
        limit = max(1, min(limit, 100))
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT id, thread_id, author_name, safe_html, status, created_at FROM forum_posts WHERE status='pending' ORDER BY created_at ASC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            return [ForumPostOut(**dict(r)) for r in cur.fetchall()]
        finally:
            conn.close()

    @router.post("/moderation/posts/{post_id}/approve", summary="Approve a post")
    async def moderation_approve(post_id: int, body: ModerationAction = ModerationAction(), _: None = Depends(require_moderator)):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE forum_posts SET status='published', updated_at=CURRENT_TIMESTAMP WHERE id=?", (post_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Post not found")
            cur.execute(
                "INSERT INTO forum_moderation_actions (post_id, moderator_name, action, reason) VALUES (?, ?, 'approve', ?)",
                (post_id, body.moderator_name, body.reason)
            )
            conn.commit()
            return {"success": True}
        finally:
            conn.close()

    @router.post("/moderation/posts/{post_id}/reject", summary="Reject a post")
    async def moderation_reject(post_id: int, body: ModerationAction, _: None = Depends(require_moderator)):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE forum_posts SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?", (post_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Post not found")
            cur.execute(
                "INSERT INTO forum_moderation_actions (post_id, moderator_name, action, reason) VALUES (?, ?, 'reject', ?)",
                (post_id, body.moderator_name, body.reason)
            )
            conn.commit()
            return {"success": True}
        finally:
            conn.close()

    @router.post("/reports", summary="Report a post")
    async def create_report(body: ReportCreate, request: Request):
        rate_limit(request, key_hint="forum_report", times=10, per_seconds=60)
        if not body.reason or len(body.reason) > 500:
            raise HTTPException(status_code=400, detail="Invalid reason")
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT 1 FROM forum_posts WHERE id=?", (body.post_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Post not found")
            cur.execute(
                "INSERT INTO forum_reports (post_id, reporter_name, reason) VALUES (?, ?, ?)",
                (body.post_id, body.reporter_name, body.reason)
            )
            conn.commit()
            return {"success": True}
        finally:
            conn.close()

    return router
