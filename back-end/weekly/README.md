# Weekly Mindmap - Backend

FastAPI + SQLAlchemy module for the weekly report mindmap. Fully isolated from the main ShopBack backend (separate SQLite DB, prefixed tables, independent router).

## API Endpoints

All endpoints are under `/api/weekly`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports` | List all reports (sorted by date desc, includes node_count) |
| GET | `/reports/{report_id}` | Single report with all its nodes |
| GET | `/nodes` | List all nodes (optional `?tag=` filter) |
| GET | `/nodes/{node_id}` | Single node detail |
| GET | `/links` | List all links (optional `?node=` filter for connected links) |
| GET | `/tags` | List all tags |
| GET | `/tags/{slug}/timeline` | All nodes under a tag, sorted by report date |

## Database

- Engine: SQLite via SQLAlchemy 2.0
- File: `back-end/data/weekly.db` (gitignored)
- Tables: `weekly_reports`, `weekly_nodes`, `weekly_links`, `weekly_tags`

## Scripts

```bash
cd back-end

# Create tables (idempotent)
python scripts/init_weekly_db.py

# Seed with 2 sample reports, 10 nodes, 6 links, 12 tags (idempotent)
python scripts/seed_weekly.py
```

## Running

The weekly router is mounted in `fapi.py`. Start the backend as usual:

```bash
cd back-end
uvicorn fapi:app --host 0.0.0.0 --port 8001
```

## Tests

```bash
cd back-end
pytest tests/test_weekly_read.py -v
```

Tests use an in-memory SQLite database with `StaticPool` and `httpx.AsyncClient`.

## Module Structure

```
weekly/
  __init__.py
  database.py          # Engine, SessionLocal, Base, get_db, init_db
  models.py            # ORM: Report, Node, Link, Tag
  schemas.py           # Pydantic response models
  crud.py              # Read functions (7 queries)
  router.py            # FastAPI router with 7 GET endpoints
  deps.py              # Placeholder (Phase 2: bearer token auth)
  import_service.py    # Placeholder (Phase 2: JSON import)
```
