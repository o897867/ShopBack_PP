#!/usr/bin/env python3
"""
Admin helpers for Showcase (forum-like) content, designed for use in Jupyter notebooks.
Manages categories and events directly via SQLite.
"""
from __future__ import annotations
import sqlite3
import json
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
import csv
import os
import shutil
from pathlib import Path

DB_DEFAULT = "shopback_data.db"


def _ensure_tables(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS showcase_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS showcase_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            images_json TEXT,
            submitted_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES showcase_categories (id)
        )
        """
    )
    cur.execute('CREATE INDEX IF NOT EXISTS idx_showcase_events_category ON showcase_events (category_id)')
    conn.commit()


@dataclass
class Category:
    id: int
    name: str
    image_url: Optional[str]
    created_at: str


@dataclass
class Event:
    id: int
    category_id: int
    title: str
    content: Optional[str]
    images: List[str]
    submitted_by: Optional[str]
    created_at: str


class ShowcaseAdmin:
    def __init__(self, db_path: str = DB_DEFAULT):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            _ensure_tables(conn)
        # Resolve static upload directory relative to this file
        self.base_dir = Path(__file__).resolve().parent
        self.static_dir = self.base_dir / 'static'
        self.upload_dir = self.static_dir / 'uploads' / 'showcase'
        os.makedirs(self.upload_dir, exist_ok=True)

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # Categories
    def list_categories(self) -> List[Category]:
        with self._conn() as conn:
            cur = conn.execute("SELECT id, name, image_url, created_at FROM showcase_categories ORDER BY id DESC")
            return [Category(**dict(r)) for r in cur.fetchall()]

    def create_category(self, name: str, image_url: Optional[str] = None) -> Category:
        with self._conn() as conn:
            cur = conn.execute("INSERT INTO showcase_categories (name, image_url) VALUES (?, ?)", (name, image_url))
            cat_id = cur.lastrowid
            conn.commit()
            cur = conn.execute("SELECT id, name, image_url, created_at FROM showcase_categories WHERE id = ?", (cat_id,))
            return Category(**dict(cur.fetchone()))

    def update_category(self, category_id: int, name: Optional[str] = None, image_url: Optional[str] = None) -> Category:
        with self._conn() as conn:
            # Read current
            row = conn.execute("SELECT id, name, image_url, created_at FROM showcase_categories WHERE id = ?", (category_id,)).fetchone()
            if not row:
                raise ValueError("Category not found")
            new_name = name if name is not None else row["name"]
            new_image = image_url if image_url is not None else row["image_url"]
            conn.execute("UPDATE showcase_categories SET name = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                         (new_name, new_image, category_id))
            conn.commit()
            row = conn.execute("SELECT id, name, image_url, created_at FROM showcase_categories WHERE id = ?", (category_id,)).fetchone()
            return Category(**dict(row))

    def delete_category(self, category_id: int, cascade: bool = False) -> None:
        with self._conn() as conn:
            if not cascade:
                cnt = conn.execute("SELECT COUNT(*) FROM showcase_events WHERE category_id = ?", (category_id,)).fetchone()[0]
                if cnt > 0:
                    raise ValueError(f"Category has {cnt} events. Use cascade=True to delete.")
            else:
                conn.execute("DELETE FROM showcase_events WHERE category_id = ?", (category_id,))
            cur = conn.execute("DELETE FROM showcase_categories WHERE id = ?", (category_id,))
            if cur.rowcount == 0:
                raise ValueError("Category not found")
            conn.commit()

    # Events
    def list_events(self, category_id: int) -> List[Event]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events WHERE category_id = ? ORDER BY created_at DESC, id DESC",
                (category_id,)
            )
            result: List[Event] = []
            for r in cur.fetchall():
                d = dict(r)
                images = []
                try:
                    images = json.loads(d.get("images_json") or "[]")
                except Exception:
                    images = []
                result.append(Event(
                    id=d["id"],
                    category_id=d["category_id"],
                    title=d["title"],
                    content=d.get("content"),
                    images=images,
                    submitted_by=d.get("submitted_by"),
                    created_at=d["created_at"],
                ))
            return result

    def get_event(self, event_id: int) -> Event:
        with self._conn() as conn:
            r = conn.execute(
                "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events WHERE id = ?",
                (event_id,)
            ).fetchone()
            if not r:
                raise ValueError("Event not found")
            d = dict(r)
            images = []
            try:
                images = json.loads(d.get("images_json") or "[]")
            except Exception:
                images = []
            return Event(
                id=d["id"],
                category_id=d["category_id"],
                title=d["title"],
                content=d.get("content"),
                images=images,
                submitted_by=d.get("submitted_by"),
                created_at=d["created_at"],
            )

    def create_event(self, category_id: int, title: str, content: Optional[str] = None,
                     images: Optional[List[str]] = None, submitted_by: Optional[str] = None) -> Event:
        with self._conn() as conn:
            # Ensure category exists
            if not conn.execute("SELECT 1 FROM showcase_categories WHERE id = ?", (category_id,)).fetchone():
                raise ValueError("Category not found")
            cur = conn.execute(
                "INSERT INTO showcase_events (category_id, title, content, images_json, submitted_by) VALUES (?, ?, ?, ?, ?)",
                (category_id, title, content, json.dumps(images or []), submitted_by)
            )
            ev_id = cur.lastrowid
            conn.commit()
            return self.get_event(ev_id)

    def update_event(self, event_id: int, *, title: Optional[str] = None, content: Optional[str] = None,
                     images: Optional[List[str]] = None, submitted_by: Optional[str] = None) -> Event:
        with self._conn() as conn:
            row = conn.execute("SELECT id, title, content, images_json, submitted_by FROM showcase_events WHERE id = ?", (event_id,)).fetchone()
            if not row:
                raise ValueError("Event not found")
            current = dict(row)
            new_title = title if title is not None else current["title"]
            new_content = content if content is not None else current["content"]
            new_images_json = json.dumps(images) if images is not None else current["images_json"]
            new_submitter = submitted_by if submitted_by is not None else current["submitted_by"]
            conn.execute(
                "UPDATE showcase_events SET title = ?, content = ?, images_json = ?, submitted_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (new_title, new_content, new_images_json, new_submitter, event_id)
            )
            conn.commit()
            return self.get_event(event_id)

    def delete_event(self, event_id: int) -> None:
        with self._conn() as conn:
            cur = conn.execute("DELETE FROM showcase_events WHERE id = ?", (event_id,))
            if cur.rowcount == 0:
                raise ValueError("Event not found")
            conn.commit()

    # CSV utilities (simple UTF-8 CSV import/export)
    def export_categories_csv(self, filepath: str) -> None:
        rows = self.list_categories()
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["id", "name", "image_url", "created_at"])  # header
            for r in rows:
                writer.writerow([r.id, r.name, r.image_url or "", r.created_at])

    def import_categories_csv(self, filepath: str) -> int:
        count = 0
        with open(filepath, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('name')
                if not name:
                    continue
                image_url = row.get('image_url') or None
                self.create_category(name, image_url)
                count += 1
        return count

    # Local file helpers (for notebooks running on backend host)
    def save_image_from_path(self, src_path: str) -> str:
        """Copy a local image file into static uploads and return its public URL path.
        Returns: '/static/uploads/showcase/<filename>'
        """
        src = Path(src_path)
        if not src.exists():
            raise FileNotFoundError(src_path)
        # Keep extension, generate unique name
        import uuid
        ext = src.suffix.lower() or '.jpg'
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / fname
        shutil.copyfile(str(src), str(dest))
        return f"/static/uploads/showcase/{fname}"

    def export_events_csv(self, filepath: str, category_id: Optional[int] = None) -> None:
        with self._conn() as conn:
            cur = conn.cursor()
            if category_id:
                cur.execute(
                    "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events WHERE category_id = ? ORDER BY created_at DESC, id DESC",
                    (category_id,)
                )
            else:
                cur.execute(
                    "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events ORDER BY created_at DESC, id DESC"
                )
            rows = cur.fetchall()
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["id", "category_id", "title", "content", "images", "submitted_by", "created_at"])  # header
            for r in rows:
                d = dict(r)
                # store images as JSON string
                images_json = d.get('images_json') or '[]'
                writer.writerow([
                    d['id'], d['category_id'], d['title'], d.get('content') or "",
                    images_json, d.get('submitted_by') or "", d['created_at']
                ])

    def import_events_csv(self, filepath: str) -> int:
        count = 0
        with open(filepath, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    category_id = int(row.get('category_id'))
                except Exception:
                    continue
                title = row.get('title')
                if not title:
                    continue
                content = row.get('content') or None
                images_json = row.get('images') or '[]'
                try:
                    images = json.loads(images_json)
                except Exception:
                    images = []
                submitted_by = row.get('submitted_by') or None
                self.create_event(category_id, title, content, images, submitted_by)
                count += 1
        return count


__all__ = [
    "ShowcaseAdmin",
    "Category",
    "Event",
]
