"""Seed weekly reports from JSON files.

Run from back-end/:
    python -m scripts.seed_weekly
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session

from weekly.database import SessionLocal, init_db
from weekly.models import Link, LinkType, Node, Report, Tag

SEED_DIR = Path(__file__).parent / "seed_data"


def load_json(name: str):
    with open(SEED_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def clear_all(db: Session):
    db.query(Link).delete()
    db.query(Node).delete()
    db.query(Report).delete()
    db.query(Tag).delete()
    db.commit()


def seed_tags(db: Session, tags_data: list):
    roots = [t for t in tags_data if not t.get("parent_slug")]
    children = [t for t in tags_data if t.get("parent_slug")]
    for t in roots:
        db.add(Tag(**t))
    db.flush()
    for t in children:
        db.add(Tag(**t))
    db.commit()
    print(f"✓ Inserted {len(tags_data)} tags")


def seed_reports(db: Session, reports_data: list):
    for r in reports_data:
        db.add(Report(**r))
    db.commit()
    print(f"✓ Inserted {len(reports_data)} reports")


def seed_nodes(db: Session, nodes_data: list):
    for n in nodes_data:
        db.add(Node(**n))
    db.commit()
    print(f"✓ Inserted {len(nodes_data)} nodes")


def seed_links(db: Session, links_data: list):
    for lk in links_data:
        data = dict(lk)
        data["type"] = LinkType(data["type"])
        db.add(Link(**data))
    db.commit()
    print(f"✓ Inserted {len(links_data)} links")


def main():
    init_db()
    db = SessionLocal()
    try:
        clear_all(db)

        reports_nodes = load_json("reports_nodes.json")
        links_tags = load_json("links_tags.json")

        seed_tags(db, links_tags["tags"])
        seed_reports(db, reports_nodes["reports"])
        seed_nodes(db, reports_nodes["nodes"])
        seed_links(db, links_tags["links"])

        print("\n✨ Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
