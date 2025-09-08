#!/usr/bin/env python3
"""
Admin helpers for CFD industry data (e.g., brokers like TMGM).
Designed for use in Jupyter notebooks. Stores data in SQLite.

Tables:
  - cfd_brokers(id, name, regulators, rating, website, logo_url, created_at, updated_at)
  - cfd_broker_news(id, broker_id, title, tag, created_at, updated_at)
"""
from __future__ import annotations
import os
import shutil
import sqlite3
from dataclasses import dataclass
import json
from pathlib import Path
from typing import List, Optional

DB_DEFAULT = "shopback_data.db"


def _ensure_tables(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS cfd_brokers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            regulators TEXT,
            rating TEXT,
            website TEXT,
            logo_url TEXT,
            rating_breakdown_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS cfd_broker_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            broker_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            tag TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (broker_id) REFERENCES cfd_brokers (id)
        )
        """
    )
    cur.execute('CREATE INDEX IF NOT EXISTS idx_cfd_news_broker ON cfd_broker_news (broker_id)')
    conn.commit()
    # Backfill: add rating_breakdown_json if table exists without it
    try:
        cur.execute("PRAGMA table_info(cfd_brokers)")
        cols = {r[1] for r in cur.fetchall()}
        if 'rating_breakdown_json' not in cols:
            cur.execute("ALTER TABLE cfd_brokers ADD COLUMN rating_breakdown_json TEXT")
            conn.commit()
    except Exception:
        pass


@dataclass
class Broker:
    id: int
    name: str
    regulators: Optional[str]
    rating: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    rating_breakdown: Optional[dict]
    created_at: str


@dataclass
class News:
    id: int
    broker_id: int
    title: str
    tag: Optional[str]
    created_at: str


class CFDAdmin:
    def __init__(self, db_path: str = DB_DEFAULT):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            _ensure_tables(conn)
        # static uploads
        self.base_dir = Path(__file__).resolve().parent
        self.upload_dir = self.base_dir / 'static' / 'uploads' / 'cfd'
        os.makedirs(self.upload_dir, exist_ok=True)

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # Brokers
    def list_brokers(self) -> List[Broker]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, name, regulators, rating, website, logo_url, rating_breakdown_json, created_at FROM cfd_brokers ORDER BY id DESC"
            )
            rows = []
            for r in cur.fetchall():
                d = dict(r)
                rb = None
                try:
                    rb = json.loads(d.get('rating_breakdown_json') or 'null')
                except Exception:
                    rb = None
                d['rating_breakdown'] = rb
                d.pop('rating_breakdown_json', None)
                rows.append(Broker(**d))
            return rows

    def get_broker(self, broker_id: int) -> Broker:
        with self._conn() as conn:
            r = conn.execute(
                "SELECT id, name, regulators, rating, website, logo_url, rating_breakdown_json, created_at FROM cfd_brokers WHERE id = ?",
                (broker_id,),
            ).fetchone()
            if not r:
                raise ValueError("Broker not found")
            d = dict(r)
            rb = None
            try:
                rb = json.loads(d.get('rating_breakdown_json') or 'null')
            except Exception:
                rb = None
            d['rating_breakdown'] = rb
            d.pop('rating_breakdown_json', None)
            return Broker(**d)

    def create_broker(
        self,
        name: str,
        regulators: Optional[str] = None,
        rating: Optional[str] = None,
        website: Optional[str] = None,
        logo_url: Optional[str] = None,
        rating_breakdown: Optional[dict] = None,
    ) -> Broker:
        with self._conn() as conn:
            cur = conn.execute(
                "INSERT INTO cfd_brokers (name, regulators, rating, website, logo_url, rating_breakdown_json) VALUES (?, ?, ?, ?, ?, ?)",
                (name, regulators, rating, website, logo_url, json.dumps(rating_breakdown) if rating_breakdown is not None else None),
            )
            new_id = cur.lastrowid
            conn.commit()
            return self.get_broker(new_id)

    def update_broker(
        self,
        broker_id: int,
        *,
        name: Optional[str] = None,
        regulators: Optional[str] = None,
        rating: Optional[str] = None,
        website: Optional[str] = None,
        logo_url: Optional[str] = None,
        rating_breakdown: Optional[dict] = None,
    ) -> Broker:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT id, name, regulators, rating, website, logo_url, rating_breakdown_json FROM cfd_brokers WHERE id = ?",
                (broker_id,),
            ).fetchone()
            if not row:
                raise ValueError("Broker not found")
            d = dict(row)
            conn.execute(
                "UPDATE cfd_brokers SET name = ?, regulators = ?, rating = ?, website = ?, logo_url = ?, rating_breakdown_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (
                    name if name is not None else d["name"],
                    regulators if regulators is not None else d.get("regulators"),
                    rating if rating is not None else d.get("rating"),
                    website if website is not None else d.get("website"),
                    logo_url if logo_url is not None else d.get("logo_url"),
                    json.dumps(rating_breakdown) if rating_breakdown is not None else d.get("rating_breakdown_json"),
                    broker_id,
                ),
            )
            conn.commit()
            return self.get_broker(broker_id)

    def delete_broker(self, broker_id: int, cascade: bool = True) -> None:
        with self._conn() as conn:
            if cascade:
                conn.execute("DELETE FROM cfd_broker_news WHERE broker_id = ?", (broker_id,))
            cur = conn.execute("DELETE FROM cfd_brokers WHERE id = ?", (broker_id,))
            if cur.rowcount == 0:
                raise ValueError("Broker not found")
            conn.commit()

    # News
    def list_news(self, broker_id: int) -> List[News]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, broker_id, title, tag, created_at FROM cfd_broker_news WHERE broker_id = ? ORDER BY created_at DESC, id DESC",
                (broker_id,),
            )
            return [News(**dict(r)) for r in cur.fetchall()]

    def create_news(self, broker_id: int, title: str, tag: Optional[str] = None) -> News:
        with self._conn() as conn:
            if not conn.execute("SELECT 1 FROM cfd_brokers WHERE id = ?", (broker_id,)).fetchone():
                raise ValueError("Broker not found")
            cur = conn.execute(
                "INSERT INTO cfd_broker_news (broker_id, title, tag) VALUES (?, ?, ?)",
                (broker_id, title, tag),
            )
            new_id = cur.lastrowid
            conn.commit()
            r = conn.execute(
                "SELECT id, broker_id, title, tag, created_at FROM cfd_broker_news WHERE id = ?",
                (new_id,),
            ).fetchone()
            return News(**dict(r))

    def update_news(self, news_id: int, *, title: Optional[str] = None, tag: Optional[str] = None) -> News:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT id, broker_id, title, tag FROM cfd_broker_news WHERE id = ?",
                (news_id,),
            ).fetchone()
            if not row:
                raise ValueError("News not found")
            d = dict(row)
            conn.execute(
                "UPDATE cfd_broker_news SET title = ?, tag = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (title if title is not None else d["title"], tag if tag is not None else d.get("tag"), news_id),
            )
            conn.commit()
            r = conn.execute(
                "SELECT id, broker_id, title, tag, created_at FROM cfd_broker_news WHERE id = ?",
                (news_id,),
            ).fetchone()
            return News(**dict(r))

    def delete_news(self, news_id: int) -> None:
        with self._conn() as conn:
            cur = conn.execute("DELETE FROM cfd_broker_news WHERE id = ?", (news_id,))
            if cur.rowcount == 0:
                raise ValueError("News not found")
            conn.commit()

    # Image helper (optional)
    def save_image_from_path(self, src_path: str) -> str:
        """Copy a local image file into static/uploads/cfd and return its public URL path.
        Returns: '/static/uploads/cfd/<filename>'
        """
        src = Path(src_path)
        if not src.exists():
            raise FileNotFoundError(src_path)
        import uuid
        ext = src.suffix.lower() or '.jpg'
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / fname
        shutil.copyfile(str(src), str(dest))
        return f"/static/uploads/cfd/{fname}"


__all__ = ["CFDAdmin", "Broker", "News"]
