"""Tests for weekly mindmap read endpoints."""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from weekly.database import Base, get_db
from weekly.models import Link, LinkType, Node, Report, Tag
from weekly.router import router

# ---------- test app setup ----------

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=engine)


def _override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.include_router(router)
app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _reset_tables():
    """Recreate all tables before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
async def ac():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


def _seed_basic():
    """Insert two reports with nodes, links, and tags."""
    db = TestSession()

    db.add(Tag(slug="gold", name="黄金", color="c-amber", description="贵金属"))
    db.add(Tag(slug="policy", name="政策", color="c-blue"))

    r1 = Report(id="2026-04-12", date="2026.4.12", title="4.12 周总结", author="作者")
    r2 = Report(id="2026-04-19", date="2026.4.19", title="4.19 周总结", author="作者")
    db.add_all([r1, r2])
    db.flush()

    n1 = Node(
        id="node-412-gold", report_id="2026-04-12", order=1,
        title="黄金走势", subtitle="4700加仓",
        summary="看多黄金", body_markdown="**正文**",
        key_points=["观点1", "观点2"], tags=["gold"],
        color="c-amber",
    )
    n2 = Node(
        id="node-412-policy", report_id="2026-04-12", order=2,
        title="政策解读", tags=["policy"], color="c-blue",
    )
    n3 = Node(
        id="node-419-gold", report_id="2026-04-19", order=1,
        title="黄金验证", tags=["gold"], color="c-amber",
    )
    db.add_all([n1, n2, n3])
    db.flush()

    link = Link(
        id="link-001",
        from_node_id="node-412-gold", to_node_id="node-419-gold",
        type=LinkType.evolution, label="4700→4800",
        strength=3, ai_reasoning="上周预测验证",
    )
    db.add(link)
    db.commit()
    db.close()


# ---------- /reports ----------

class TestReports:
    async def test_empty(self, ac):
        r = await ac.get("/api/weekly/reports")
        assert r.status_code == 200
        assert r.json() == []

    async def test_list(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/reports")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        assert data[0]["id"] == "2026-04-19"
        assert data[1]["id"] == "2026-04-12"
        assert data[1]["node_count"] == 2

    async def test_detail(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/reports/2026-04-12")
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "4.12 周总结"
        assert len(data["nodes"]) == 2

    async def test_not_found(self, ac):
        r = await ac.get("/api/weekly/reports/9999-01-01")
        assert r.status_code == 404


# ---------- /nodes ----------

class TestNodes:
    async def test_empty(self, ac):
        r = await ac.get("/api/weekly/nodes")
        assert r.status_code == 200
        assert r.json() == []

    async def test_list_all(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/nodes")
        assert r.status_code == 200
        assert len(r.json()) == 3

    async def test_filter_by_tag(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/nodes", params={"tag": "gold"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        assert all("gold" in n["tags"] for n in data)

    async def test_filter_no_match(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/nodes", params={"tag": "nonexistent"})
        assert r.status_code == 200
        assert r.json() == []

    async def test_detail(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/nodes/node-412-gold")
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "黄金走势"
        assert data["key_points"] == ["观点1", "观点2"]

    async def test_not_found(self, ac):
        r = await ac.get("/api/weekly/nodes/nonexistent")
        assert r.status_code == 404


# ---------- /links ----------

class TestLinks:
    async def test_empty(self, ac):
        r = await ac.get("/api/weekly/links")
        assert r.status_code == 200
        assert r.json() == []

    async def test_list_all(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/links")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["type"] == "evolution"
        assert data[0]["strength"] == 3

    async def test_filter_by_node(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/links", params={"node": "node-412-gold"})
        assert r.status_code == 200
        assert len(r.json()) == 1

    async def test_filter_unrelated_node(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/links", params={"node": "node-412-policy"})
        assert r.status_code == 200
        assert r.json() == []


# ---------- /tags ----------

class TestTags:
    async def test_empty(self, ac):
        r = await ac.get("/api/weekly/tags")
        assert r.status_code == 200
        assert r.json() == []

    async def test_list(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/tags")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        slugs = [t["slug"] for t in data]
        assert slugs == ["gold", "policy"]

    async def test_timeline(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/tags/gold/timeline")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        assert data[0]["id"] == "node-412-gold"
        assert data[1]["id"] == "node-419-gold"

    async def test_timeline_empty(self, ac):
        _seed_basic()
        r = await ac.get("/api/weekly/tags/nonexistent/timeline")
        assert r.status_code == 200
        assert r.json() == []
