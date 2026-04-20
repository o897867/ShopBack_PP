#!/usr/bin/env python3
"""
Unit tests for News Router (routers/news_router.py)

测试覆盖：
- GET /api/news/latest - 获取最新新闻
- 过滤功能（分类、情感、标的物）
- 分页逻辑
- 参数验证
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient


# ==================== Test GET /api/news/latest ====================

@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_success(test_client, populate_test_news, mocker):
    """测试成功获取最新新闻"""
    # Mock database path
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?important_limit=10&others_limit=10")

    assert response.status_code == 200
    data = response.json()

    # 验证响应结构
    assert "important" in data
    assert "others" in data
    assert isinstance(data["important"], list)
    assert isinstance(data["others"], list)

    # 验证重要新闻有摘要
    if len(data["important"]) > 0:
        for news in data["important"]:
            assert news["summary"] is not None and news["summary"] != ""


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_with_category_filter(test_client, populate_test_news, mocker):
    """测试分类过滤功能"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?category=crypto&important_limit=20")

    assert response.status_code == 200
    data = response.json()

    # 验证所有返回的新闻都是crypto分类
    all_news = data["important"] + data["others"]
    for news in all_news:
        assert news["category"] == "crypto"


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_with_sentiment_filter(test_client, populate_test_news, mocker):
    """测试情感过滤功能"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?sentiment=positive&important_limit=20")

    assert response.status_code == 200
    data = response.json()

    all_news = data["important"] + data["others"]
    for news in all_news:
        assert news["sentiment"] == "positive"


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_with_symbol_filter(test_client, populate_test_news, mocker):
    """测试标的物过滤功能"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?symbol=BTC&important_limit=20")

    assert response.status_code == 200
    data = response.json()

    all_news = data["important"] + data["others"]
    for news in all_news:
        assert "BTC" in news["symbols"]


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_with_impact_filter(test_client, populate_test_news, mocker):
    """测试影响级别过滤功能"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?impact=high&important_limit=20")

    assert response.status_code == 200
    data = response.json()

    all_news = data["important"] + data["others"]
    for news in all_news:
        assert news["impact_level"] == "high"


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_pagination(test_client, populate_test_news, mocker):
    """测试分页限制"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?important_limit=5&others_limit=3")

    assert response.status_code == 200
    data = response.json()

    assert len(data["important"]) <= 5
    assert len(data["others"]) <= 3


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_invalid_sentiment(test_client):
    """测试无效的情感参数"""
    response = test_client.get("/api/news/latest?sentiment=invalid_sentiment")

    assert response.status_code == 400
    assert "Invalid sentiment filter" in response.json()["detail"]


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_invalid_impact(test_client):
    """测试无效的影响级别参数"""
    response = test_client.get("/api/news/latest?impact=invalid_impact")

    assert response.status_code == 400
    assert "Invalid impact filter" in response.json()["detail"]


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_invalid_category(test_client):
    """测试无效的分类参数"""
    response = test_client.get("/api/news/latest?category=invalid_category")

    assert response.status_code == 400
    assert "Invalid category filter" in response.json()["detail"]


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_limit_boundaries(test_client):
    """测试分页限制的边界值"""
    # Test maximum limit
    response = test_client.get("/api/news/latest?important_limit=100&others_limit=100")
    assert response.status_code == 200

    # Test zero limit
    response = test_client.get("/api/news/latest?important_limit=0&others_limit=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["important"]) == 0
    assert len(data["others"]) == 0


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_search_functionality(test_client, populate_test_news, mocker):
    """测试搜索功能"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get("/api/news/latest?search=Test&important_limit=20")

    assert response.status_code == 200
    data = response.json()

    # 验证所有返回的新闻标题包含搜索关键词
    all_news = data["important"] + data["others"]
    for news in all_news:
        search_text = f"{news['title']} {news.get('content', '')} {news.get('summary', '')}"
        assert "Test" in search_text or "test" in search_text.lower()


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_combined_filters(test_client, populate_test_news, mocker):
    """测试多个过滤条件组合"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    response = test_client.get(
        "/api/news/latest?category=crypto&sentiment=positive&symbol=BTC&important_limit=20"
    )

    assert response.status_code == 200
    data = response.json()

    all_news = data["important"] + data["others"]
    for news in all_news:
        assert news["category"] == "crypto"
        assert news["sentiment"] == "positive"
        assert "BTC" in news["symbols"]


@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
def test_get_latest_news_empty_database(test_client, test_db, mocker):
    """测试空数据库"""
    mocker.patch('routers.news_router.DATABASE_PATH', test_db)

    response = test_client.get("/api/news/latest?important_limit=10&others_limit=10")

    assert response.status_code == 200
    data = response.json()

    assert data["important"] == []
    assert data["others"] == []


# ==================== Test WebSocket ====================

@pytest.mark.unit
@pytest.mark.websocket
@pytest.mark.news
@pytest.mark.slow
def test_news_websocket_connection(test_client):
    """测试 WebSocket 连接"""
    with test_client.websocket_connect("/api/news/ws") as websocket:
        # 接收初始消息
        data = websocket.receive_json()

        # 验证消息格式
        assert "type" in data
        assert data["type"] in ["initial_news", "connection_established"]


@pytest.mark.unit
@pytest.mark.websocket
@pytest.mark.news
def test_news_websocket_refresh_request(test_client, populate_test_news, mocker):
    """测试 WebSocket 刷新请求"""
    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    with test_client.websocket_connect("/api/news/ws") as websocket:
        # 发送刷新请求
        websocket.send_json({"type": "refresh"})

        # 接收响应
        data = websocket.receive_json()

        assert "type" in data
        assert data["type"] == "refresh_response"
        assert "news" in data
        assert isinstance(data["news"], list)


# ==================== Performance Tests ====================

@pytest.mark.unit
@pytest.mark.api
@pytest.mark.news
@pytest.mark.slow
def test_get_latest_news_performance(test_client, populate_test_news, mocker):
    """测试API响应性能（应该 <200ms）"""
    import time

    mocker.patch('routers.news_router.DATABASE_PATH', populate_test_news)

    start = time.time()
    response = test_client.get("/api/news/latest?important_limit=20&others_limit=20")
    elapsed = time.time() - start

    assert response.status_code == 200
    # Performance target: < 200ms for 40 news items
    assert elapsed < 0.2, f"API response took {elapsed:.3f}s, expected < 0.2s"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
