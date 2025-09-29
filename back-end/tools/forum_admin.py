#!/usr/bin/env python3
"""
Forum Admin CLI (SQLite)

Text-only management for threads/posts/moderation without any GUI.

Usage examples:
  # List last 10 threads
  python back-end/tools/forum_admin.py list-threads --limit 10

  # View posts in a thread
  python back-end/tools/forum_admin.py list-posts --thread 1 --include-pending

  # List pending posts
  python back-end/tools/forum_admin.py pending --limit 50

  # Approve / reject
  python back-end/tools/forum_admin.py approve --post 123 --reason ok --moderator admin
  python back-end/tools/forum_admin.py reject  --post 124 --reason spam --moderator mod1

  # Create a thread and reply
  python back-end/tools/forum_admin.py create-thread --title "测试" --content "<p>内容</p>" --author admin --tags general,notice
  python back-end/tools/forum_admin.py reply --thread 1 --content "<p>hi</p>" --author admin

  # Edit / delete
  python back-end/tools/forum_admin.py edit --post 10 --content "<p>new</p>" --status published
  python back-end/tools/forum_admin.py delete --post 11

  # Search / export
  python back-end/tools/forum_admin.py search --keyword 关键字 --limit 50
  python back-end/tools/forum_admin.py export --out posts.csv --status pending

DB path:
  - Defaults to the same file used by the app (back-end/shopback_data.db)
  - Override with env DB_PATH=/absolute/path/to/shopback_data.db
"""
from __future__ import annotations

import os
import sys
import csv
import json as _json
import argparse
import sqlite3
from pathlib import Path
from typing import Iterable


def db_path() -> str:
    base = Path(__file__).resolve().parent.parent
    return os.getenv("DB_PATH") or str(base / "shopback_data.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    return conn


def print_rows(rows: Iterable[sqlite3.Row], limit: int | None = None) -> None:
    count = 0
    for r in rows:
        d = dict(r)
        print(d)
        count += 1
        if limit is not None and count >= limit:
            break
    print(f"-- {count} row(s)")


def cmd_list_threads(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute(
            "SELECT id, title, author_name, status, created_at, last_post_at "
            "FROM forum_threads ORDER BY COALESCE(last_post_at, created_at) DESC, id DESC LIMIT ? OFFSET ?",
            (args.limit, args.offset),
        )
        print_rows(cur.fetchall())


def cmd_list_posts(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        if args.include_pending:
            cur.execute(
                "SELECT id, thread_id, author_name, status, created_at "
                "FROM forum_posts WHERE thread_id=? ORDER BY id ASC LIMIT ? OFFSET ?",
                (args.thread, args.limit, args.offset),
            )
        else:
            cur.execute(
                "SELECT id, thread_id, author_name, status, created_at "
                "FROM forum_posts WHERE thread_id=? AND status='published' ORDER BY id ASC LIMIT ? OFFSET ?",
                (args.thread, args.limit, args.offset),
            )
        print_rows(cur.fetchall())


def cmd_pending(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute(
            "SELECT id, thread_id, author_name, status, created_at FROM forum_posts "
            "WHERE status='pending' ORDER BY created_at ASC LIMIT ? OFFSET ?",
            (args.limit, args.offset),
        )
        print_rows(cur.fetchall())


def cmd_approve(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("UPDATE forum_posts SET status='published', updated_at=CURRENT_TIMESTAMP WHERE id=?", (args.post,))
        if cur.rowcount == 0:
            print("post not found")
            return
        cur.execute(
            "INSERT INTO forum_moderation_actions (post_id, moderator_name, action, reason) VALUES (?, ?, 'approve', ?)",
            (args.post, args.moderator, args.reason),
        )
        c.commit()
        print("approved", args.post)


def cmd_reject(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("UPDATE forum_posts SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?", (args.post,))
        if cur.rowcount == 0:
            print("post not found")
            return
        cur.execute(
            "INSERT INTO forum_moderation_actions (post_id, moderator_name, action, reason) VALUES (?, ?, 'reject', ?)",
            (args.post, args.moderator, args.reason),
        )
        c.commit()
        print("rejected", args.post)


def cmd_create_thread(args: argparse.Namespace) -> None:
    tags_json = _json.dumps([t for t in (args.tags.split(",") if args.tags else []) if t]) or None
    with get_conn() as c:
        cur = c.cursor()
        cur.execute(
            "INSERT INTO forum_threads (title, author_name, tags_json, status, last_post_at) VALUES (?, ?, ?, 'normal', CURRENT_TIMESTAMP)",
            (args.title.strip(), args.author, tags_json),
        )
        thread_id = cur.lastrowid
        cur.execute(
            "INSERT INTO forum_posts (thread_id, author_name, raw_html, safe_html, status, rules_score) VALUES (?, ?, ?, ?, 'published', 0)",
            (thread_id, args.author, args.content, args.content),
        )
        c.commit()
        print("thread created:", thread_id)


def cmd_reply(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("SELECT 1 FROM forum_threads WHERE id=?", (args.thread,))
        if not cur.fetchone():
            print("thread not found")
            return
        cur.execute(
            "INSERT INTO forum_posts (thread_id, author_name, raw_html, safe_html, status, rules_score) VALUES (?, ?, ?, ?, ?, 0)",
            (args.thread, args.author, args.content, args.content, args.status),
        )
        c.commit()
        print("replied post id:", cur.lastrowid)


def cmd_edit(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        if args.status:
            cur.execute(
                "UPDATE forum_posts SET raw_html=?, safe_html=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (args.content, args.content, args.status, args.post),
            )
        else:
            cur.execute(
                "UPDATE forum_posts SET raw_html=?, safe_html=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (args.content, args.post),
            )
        c.commit()
        print("edited", args.post)


def cmd_delete(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        cur.execute("UPDATE forum_posts SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?", (args.post,))
        c.commit()
        print("deleted", args.post)


def cmd_search(args: argparse.Namespace) -> None:
    kw = f"%{args.keyword.replace('%','%%').replace('_','__')}%"
    with get_conn() as c:
        cur = c.cursor()
        cur.execute(
            "SELECT t.id AS thread_id, t.title, p.id AS post_id, p.author_name, p.status, p.created_at "
            "FROM forum_threads t JOIN forum_posts p ON p.thread_id=t.id "
            "WHERE t.title LIKE ? OR p.raw_html LIKE ? "
            "ORDER BY p.created_at DESC LIMIT ?",
            (kw, kw, args.limit),
        )
        print_rows(cur.fetchall())


def cmd_export(args: argparse.Namespace) -> None:
    with get_conn() as c:
        cur = c.cursor()
        if args.status:
            cur.execute(
                "SELECT id, thread_id, author_name, status, created_at FROM forum_posts WHERE status=? ORDER BY created_at DESC",
                (args.status,),
            )
        else:
            cur.execute(
                "SELECT id, thread_id, author_name, status, created_at FROM forum_posts ORDER BY created_at DESC",
            )
        rows = cur.fetchall()
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "thread_id", "author_name", "status", "created_at"])
        for r in rows:
            d = dict(r)
            w.writerow([d["id"], d["thread_id"], d.get("author_name"), d.get("status"), d.get("created_at")])
    print("exported ->", args.out, "rows:", len(rows))


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Forum admin CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("list-threads")
    s.add_argument("--limit", type=int, default=20)
    s.add_argument("--offset", type=int, default=0)
    s.set_defaults(func=cmd_list_threads)

    s = sub.add_parser("list-posts")
    s.add_argument("--thread", type=int, required=True)
    s.add_argument("--include-pending", action="store_true")
    s.add_argument("--limit", type=int, default=50)
    s.add_argument("--offset", type=int, default=0)
    s.set_defaults(func=cmd_list_posts)

    s = sub.add_parser("pending")
    s.add_argument("--limit", type=int, default=100)
    s.add_argument("--offset", type=int, default=0)
    s.set_defaults(func=cmd_pending)

    s = sub.add_parser("approve")
    s.add_argument("--post", type=int, required=True)
    s.add_argument("--reason")
    s.add_argument("--moderator")
    s.set_defaults(func=cmd_approve)

    s = sub.add_parser("reject")
    s.add_argument("--post", type=int, required=True)
    s.add_argument("--reason")
    s.add_argument("--moderator")
    s.set_defaults(func=cmd_reject)

    s = sub.add_parser("create-thread")
    s.add_argument("--title", required=True)
    s.add_argument("--content", required=True)
    s.add_argument("--author")
    s.add_argument("--tags", help="comma separated")
    s.set_defaults(func=cmd_create_thread)

    s = sub.add_parser("reply")
    s.add_argument("--thread", type=int, required=True)
    s.add_argument("--content", required=True)
    s.add_argument("--author")
    s.add_argument("--status", default="published", choices=["published", "pending", "rejected", "deleted"])
    s.set_defaults(func=cmd_reply)

    s = sub.add_parser("edit")
    s.add_argument("--post", type=int, required=True)
    s.add_argument("--content", required=True)
    s.add_argument("--status", choices=["published", "pending", "rejected", "deleted"])
    s.set_defaults(func=cmd_edit)

    s = sub.add_parser("delete")
    s.add_argument("--post", type=int, required=True)
    s.set_defaults(func=cmd_delete)

    s = sub.add_parser("search")
    s.add_argument("--keyword", required=True)
    s.add_argument("--limit", type=int, default=50)
    s.set_defaults(func=cmd_search)

    s = sub.add_parser("export")
    s.add_argument("--out", default="forum_posts_export.csv")
    s.add_argument("--status")
    s.set_defaults(func=cmd_export)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
        return 0
    except sqlite3.Error as e:
        print("SQLite error:", e, file=sys.stderr)
        return 2
    except Exception as e:
        print("Error:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

