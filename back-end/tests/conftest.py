#!/usr/bin/env python3
"""
Pytest configuration and shared fixtures for ShopBack backend tests

提供测试数据库、Mock服务、测试数据等共享fixtures
"""

import pytest
import sqlite3
import asyncio
import os
import tempfile
from typing import Generator, AsyncGenerator
from httpx import AsyncClient, ASGITransport
import json

# Import app and services
# Note: app import is delayed to avoid circular dependencies
from config import DATABASE_PATH


# ==================== Session-level fixtures ====================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ==================== Database fixtures ====================

@pytest.fixture(scope="function")
def test_db_path():
    """Create temporary database for testing"""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    yield db_path

    # Cleanup
    try:
        os.unlink(db_path)
    except OSError:
        pass


@pytest.fixture(scope="function")
def test_db(test_db_path):
    """Create and initialize test database with schema"""
    conn = sqlite3.connect(test_db_path)

    # Create financial_news table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS financial_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            news_id TEXT UNIQUE,
            title TEXT NOT NULL,
            content TEXT,
            summary TEXT,
            summary_cn TEXT,
            source TEXT,
            url TEXT,
            published_at TIMESTAMP,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            symbols TEXT,
            sentiment TEXT,
            impact_level TEXT,
            category TEXT,
            raw_data TEXT
        )
    """)

    # Create indexes
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_financial_news_published
        ON financial_news(published_at DESC)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_financial_news_news_id
        ON financial_news(news_id)
    """)

    # Create health tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_tokens (
            token TEXT PRIMARY KEY,
            height REAL NOT NULL,
            weight REAL NOT NULL,
            age INTEGER NOT NULL,
            recovery_code TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS weight_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL,
            weight REAL NOT NULL,
            calories_burned INTEGER DEFAULT 0,
            notes TEXT,
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (token) REFERENCES health_tokens(token)
        )
    """)

    conn.commit()
    conn.close()

    yield test_db_path


# ==================== Test Client fixtures ====================

@pytest.fixture(scope="function")
def test_client():
    """FastAPI test client (sync)"""
    # Use pytest-httpx with simple mock approach
    import httpx
    from fapi import app

    # Create a simple sync client that calls the app
    class SyncTestClient:
        def __init__(self, app):
            self.app = app
            self.base_url = "http://test"

        def get(self, path, **kwargs):
            from fapi import app
            import asyncio

            # Create async client and run sync
            async def _make_request():
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url=self.base_url
                ) as client:
                    return await client.get(path, **kwargs)

            return asyncio.run(_make_request())

        def websocket_connect(self, path):
            # For websocket testing
            from starlette.testclient import TestClient as StarletteTestClient
            from fapi import app
            tc = StarletteTestClient(app)
            return tc.websocket_connect(path)

    return SyncTestClient(app)


@pytest.fixture(scope="function")
async def async_client() -> AsyncGenerator:
    """FastAPI async test client"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


# ==================== Mock data fixtures ====================

@pytest.fixture
def sample_news_item():
    """Sample news item for testing"""
    return {
        "id": "test_news_123",
        "title": "NVIDIA Announces Record Quarterly Revenue",
        "content": "NVIDIA Corporation reported record quarterly revenue driven by AI chip demand.",
        "source": "Reuters",
        "published_at": 1735459200,  # 2024-12-29 08:00:00
        "symbols": ["NVDA"],
        "sentiment": "positive",
        "impact_level": "high",
        "category": "tech_stocks"
    }


@pytest.fixture
def sample_news_with_summary():
    """Sample news with AI summary"""
    return {
        "id": "test_news_456",
        "title": "Gold Prices Surge to New High",
        "content": "Gold prices reached a new all-time high as investors seek safe haven assets.",
        "summary": "Gold hits record high amid market uncertainty and inflation concerns.",
        "summary_cn": "黄金价格创历史新高，投资者寻求避险资产。",
        "source": "Bloomberg",
        "published_at": 1735459200,
        "symbols": ["XAU", "GOLD"],
        "sentiment": "neutral",
        "impact_level": "medium",
        "category": "precious_metals"
    }


@pytest.fixture
def sample_news_batch():
    """Batch of news items for testing pagination"""
    return [
        {
            "id": f"news_{i}",
            "title": f"Test News {i}",
            "content": f"Content for news {i}",
            "source": "TestSource",
            "published_at": 1735459200 + (i * 100),
            "symbols": ["BTC"] if i % 2 == 0 else ["ETH"],
            "sentiment": ["positive", "negative", "neutral"][i % 3],
            "impact_level": ["high", "medium", "low"][i % 3],
            "category": "crypto"
        }
        for i in range(1, 21)
    ]


@pytest.fixture
def sample_health_token_data():
    """Sample health token data"""
    return {
        "height": 175.0,
        "weight": 70.5,
        "age": 30
    }


@pytest.fixture
def sample_weight_log():
    """Sample weight log entry"""
    return {
        "weight": 69.8,
        "calories_burned": 500,
        "notes": "Morning workout completed"
    }


# ==================== Mock services ====================

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response"""
    return {
        "choices": [{
            "message": {
                "content": json.dumps({
                    "is_financial": True,
                    "summary_en": "Test summary in English",
                    "summary_cn": "测试中文摘要",
                    "sentiment": "positive",
                    "symbols": ["NVDA"],
                    "impact_level": "high",
                    "category": "tech_stocks"
                })
            }
        }]
    }


@pytest.fixture
def mock_insightsentry_ws_message():
    """Mock InsightSentry WebSocket message"""
    return {
        "id": "is_news_789",
        "title": "Federal Reserve Holds Interest Rates Steady",
        "content": "The Federal Reserve announced it will maintain current interest rates.",
        "timestamp": 1735459200,
        "source": "InsightSentry",
        "tickers": ["USD", "DXY"]
    }


# ==================== Utility fixtures ====================

@pytest.fixture
def populate_test_news(test_db, sample_news_batch):
    """Populate test database with news items"""
    conn = sqlite3.connect(test_db)

    for news in sample_news_batch:
        summary = f"Summary for {news['title']}" if int(news['id'].split('_')[1]) % 2 == 0 else ""
        summary_cn = f"{news['title']}的中文摘要" if summary else ""

        conn.execute("""
            INSERT INTO financial_news
            (news_id, title, content, summary, summary_cn, source, url, published_at,
             symbols, sentiment, impact_level, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            news['id'], news['title'], news['content'], summary, summary_cn,
            news['source'], '', news['published_at'],
            json.dumps(news['symbols']), news['sentiment'],
            news['impact_level'], news['category']
        ))

    conn.commit()
    conn.close()

    return test_db


# ==================== Pytest configuration hooks ====================

def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "unit: Unit tests (fast, isolated)"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests (requires services)"
    )
    config.addinivalue_line(
        "markers", "slow: Slow tests (>1s)"
    )
