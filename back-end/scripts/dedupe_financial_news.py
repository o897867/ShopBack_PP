#!/usr/bin/env python3
"""
Deduplicate financial_news by (title, published_at window).

Usage:
  python back-end/scripts/dedupe_financial_news.py            # dry-run
  python back-end/scripts/dedupe_financial_news.py --apply    # delete duplicates
  python back-end/scripts/dedupe_financial_news.py --apply --tolerance 600
"""

import argparse
import sqlite3
from pathlib import Path

try:
    from config import DATABASE_PATH
except ImportError:
    DATABASE_PATH = "../shopback_data.db"


def find_duplicates(conn: sqlite3.Connection, tolerance: int):
    """Return duplicate row ids using title_lower + published_at within tolerance seconds."""
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, title, published_at FROM financial_news WHERE title IS NOT NULL ORDER BY LOWER(title), published_at, id"
    ).fetchall()

    seen = {}
    duplicates = []

    for row in rows:
        title = (row["title"] or "").strip().lower()
        published_at = row["published_at"]
        if not title or published_at is None:
            continue

        timestamps = seen.setdefault(title, [])
        if any(abs(published_at - ts) <= tolerance for ts in timestamps):
            duplicates.append(row["id"])
        else:
            timestamps.append(published_at)

    return duplicates


def main():
    parser = argparse.ArgumentParser(description="Deduplicate financial_news table by title and time window.")
    parser.add_argument("--apply", action="store_true", help="Delete duplicates in-place. Default: dry-run.")
    parser.add_argument("--tolerance", type=int, default=600, help="Seconds window to treat as duplicate (default: 600).")
    args = parser.parse_args()

    db_path = Path(DATABASE_PATH)
    if not db_path.exists():
        raise SystemExit(f"Database not found at {db_path}")

    conn = sqlite3.connect(db_path)
    dup_ids = find_duplicates(conn, args.tolerance)

    print(f"Found {len(dup_ids)} duplicate rows (tolerance={args.tolerance}s).")

    if not args.apply or not dup_ids:
        print("Dry run complete. Use --apply to delete duplicates.")
        conn.close()
        return

    with conn:
        conn.executemany("DELETE FROM financial_news WHERE id = ?", [(i,) for i in dup_ids])

    print(f"Deleted {len(dup_ids)} rows.")
    conn.close()


if __name__ == "__main__":
    main()
