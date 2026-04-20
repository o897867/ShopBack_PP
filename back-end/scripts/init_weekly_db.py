"""Create weekly module tables in SQLite.

Run from back-end/:
    python -m scripts.init_weekly_db
"""

import sys
from pathlib import Path

# Ensure back-end/ is on sys.path so `weekly.*` imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from weekly.database import DB_PATH, init_db

if __name__ == "__main__":
    existed = DB_PATH.exists()
    init_db()
    if existed:
        print(f"Tables synced in existing database: {DB_PATH}")
    else:
        print(f"Created new database: {DB_PATH}")
