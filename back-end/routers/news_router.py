#!/usr/bin/env python3
"""
Financial News API Router
提供新闻检索和实时推送端点
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import Optional, List
import logging
import json
import asyncio

router = APIRouter(prefix="/api/news", tags=["News"])
logger = logging.getLogger(__name__)

# WebSocket 连接管理
news_ws_clients: set = set()


@router.get("/latest")
async def get_latest_news(
    limit: int = Query(50, ge=1, le=100, description="返回有摘要的新闻数量"),
    lang: Optional[str] = Query(None, description="语言偏好 (en/cn)"),
    search: Optional[str] = Query(None, description="关键词搜索（标题/内容/摘要）"),
    symbol: Optional[str] = Query(None, description="按标的物过滤，例如 BTC、ETH、XAU"),
    category: Optional[str] = Query(None, description="按分类过滤 (tech_stocks/market_indices/precious_metals/bonds/forex/central_banks/monetary_policy/crypto)"),
    sentiment: Optional[str] = Query(None, description="按情感过滤 (positive/negative/neutral)"),
    impact: Optional[str] = Query(None, description="按影响级别过滤 (high/medium/low)")
):
    """
    获取最新金融新闻（仅返回有摘要的新闻）

    - **limit**: 返回的新闻数量（1-100）
    - **lang**: 语言偏好，'en' 返回英文总结，'cn' 返回中文总结
    - **search**: 关键词搜索
    - **symbol**: 标的物筛选（如 BTC、ETH、XAU）
    - **sentiment**: 情感过滤（positive/negative/neutral）
    - **impact**: 影响级别过滤（high/medium/low）
    """
    try:
        from insightsentry_news import NewsWebSocketClient
        from config import DATABASE_PATH

        temp_client = NewsWebSocketClient(
            api_key="temp",
            openai_api_key="temp",
            db_path=DATABASE_PATH
        )

        # 参数清洗
        sanitized_symbol = symbol.upper() if symbol else None
        if sanitized_symbol == "ALL":
            sanitized_symbol = None

        sanitized_sentiment = None
        if sentiment:
            sentiment_lower = sentiment.lower()
            if sentiment_lower not in {"positive", "negative", "neutral"}:
                raise HTTPException(status_code=400, detail="Invalid sentiment filter")
            sanitized_sentiment = sentiment_lower

        sanitized_impact = None
        if impact:
            impact_lower = impact.lower()
            if impact_lower not in {"high", "medium", "low"}:
                raise HTTPException(status_code=400, detail="Invalid impact filter")
            sanitized_impact = impact_lower

        sanitized_category = None
        if category:
            category_lower = category.lower()
            valid_categories = {"tech_stocks", "market_indices", "precious_metals", "bonds", "forex", "central_banks", "monetary_policy", "crypto"}
            if category_lower not in valid_categories:
                raise HTTPException(status_code=400, detail="Invalid category filter")
            sanitized_category = category_lower

        grouped = temp_client.get_split_news(
            limit,
            0,  # others_limit=0, 不再返回无摘要新闻
            search=search.strip() if search else None,
            symbol=sanitized_symbol,
            category=sanitized_category,
            sentiment=sanitized_sentiment,
            impact=sanitized_impact,
        )
        news_items = grouped.get("important", [])

        # 根据语言偏好调整返回
        if lang == "cn":
            for item in news_items:
                if item.get('summary_cn'):
                    item['summary'] = item['summary_cn']

        return {
            "success": True,
            "count": len(news_items),
            "news": news_items
        }

    except Exception as e:
        logger.error(f"❌ Error fetching latest news: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-symbol/{symbol}")
async def get_news_by_symbol(
    symbol: str,
    limit: int = Query(20, ge=1, le=100),
    lang: Optional[str] = Query(None, description="语言偏好 (en/cn)")
):
    """
    根据金融产品代码获取相关新闻

    - **symbol**: 金融产品代码（如 COMEX:GC1!, BTCUSDT 等）
    - **limit**: 返回的新闻数量（1-100）
    - **lang**: 语言偏好
    """
    try:
        from insightsentry_news import NewsWebSocketClient
        from config import DATABASE_PATH

        temp_client = NewsWebSocketClient(
            api_key="temp",
            openai_api_key="temp",
            db_path=DATABASE_PATH
        )

        news_items = temp_client.get_news_by_symbol(symbol.upper(), limit)

        # 根据语言偏好调整返回
        if lang == "cn":
            for item in news_items:
                if item.get('summary_cn'):
                    item['summary'] = item['summary_cn']

        return {
            "success": True,
            "symbol": symbol,
            "count": len(news_items),
            "news": news_items
        }

    except Exception as e:
        logger.error(f"❌ Error fetching news by symbol: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{news_id}")
async def get_news_detail(
    news_id: str,
    lang: Optional[str] = Query(None, description="语言偏好 (en/cn)")
):
    """
    获取单条新闻的详细信息

    - **news_id**: 新闻ID
    - **lang**: 语言偏好
    """
    try:
        from database import get_db_connection

        conn = get_db_connection()
        cursor = conn.execute("""
            SELECT news_id, title, content, summary, summary_cn, source, url,
                   published_at, symbols, sentiment, impact_level, raw_data
            FROM financial_news
            WHERE news_id = ?
        """, (news_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="News not found")

        news_item = {
            'id': row['news_id'],
            'title': row['title'],
            'summary': row['summary'],
            'summary_cn': row['summary_cn'],
            'source': row['source'],
            'url': row['url'],
            'published_at': row['published_at'],
            'symbols': json.loads(row['symbols']) if row['symbols'] else [],
            'sentiment': row['sentiment'],
            'impact_level': row['impact_level']
        }

        # 根据语言偏好调整返回
        if lang == "cn" and news_item.get('summary_cn'):
            news_item['summary'] = news_item['summary_cn']

        return {
            "success": True,
            "news": news_item
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching news detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def news_websocket(websocket: WebSocket):
    """
    WebSocket 端点：实时推送新闻更新

    客户端连接后会实时接收新的金融新闻（已包含 ChatGPT 总结）
    """
    await websocket.accept()
    news_ws_clients.add(websocket)
    logger.info(f"📡 News WebSocket client connected. Total: {len(news_ws_clients)}")

    try:
        # 发送欢迎消息
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to financial news feed",
            "timestamp": asyncio.get_event_loop().time()
        })

        # 发送最新几条新闻
        try:
            from insightsentry_news import NewsWebSocketClient
            from config import DATABASE_PATH

            temp_client = NewsWebSocketClient(
                api_key="temp",
                openai_api_key="temp",
                db_path=DATABASE_PATH
            )

            latest_news = temp_client.get_latest_news(5)
            if latest_news:
                await websocket.send_json({
                    "type": "initial_news",
                    "news": latest_news
                })
        except Exception as e:
            logger.error(f"Error sending initial news: {e}")

        # 保持连接并等待消息
        while True:
            try:
                # 接收客户端消息（如果有）
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)

                # 处理客户端请求（如刷新、筛选等）
                try:
                    message = json.loads(data)
                    if message.get('action') == 'refresh':
                        temp_client = NewsWebSocketClient(
                            api_key="temp",
                            openai_api_key="temp",
                            db_path=DATABASE_PATH
                        )
                        latest_news = temp_client.get_latest_news(
                            message.get('limit', 10)
                        )
                        await websocket.send_json({
                            "type": "refresh_response",
                            "news": latest_news
                        })
                except json.JSONDecodeError:
                    pass

            except asyncio.TimeoutError:
                # 发送心跳保持连接
                try:
                    await websocket.send_json({
                        "type": "heartbeat",
                        "timestamp": asyncio.get_event_loop().time()
                    })
                except:
                    break

    except WebSocketDisconnect:
        logger.info("📡 News WebSocket client disconnected")
    except Exception as e:
        logger.error(f"❌ News WebSocket error: {e}")
    finally:
        if websocket in news_ws_clients:
            news_ws_clients.remove(websocket)
        logger.info(f"📡 News WebSocket client removed. Remaining: {len(news_ws_clients)}")


async def broadcast_news_to_clients(news_item: dict):
    """
    向所有连接的 WebSocket 客户端广播新闻

    由 NewsWebSocketClient 的回调函数调用
    """
    if not news_ws_clients:
        return

    disconnected = set()

    for client in news_ws_clients:
        try:
            await client.send_json({
                "type": "new_news",
                "news": news_item
            })
        except Exception as e:
            logger.error(f"Error broadcasting to client: {e}")
            disconnected.add(client)

    # 移除断开的客户端
    for client in disconnected:
        news_ws_clients.discard(client)


@router.get("/stats")
async def get_news_stats():
    """获取新闻统计信息"""
    try:
        from database import get_db_connection

        conn = get_db_connection()

        # 总新闻数
        cursor = conn.execute("SELECT COUNT(*) FROM financial_news")
        total_count = cursor.fetchone()[0]

        # 最新新闻时间
        cursor = conn.execute("""
            SELECT MAX(published_at) FROM financial_news
        """)
        latest_time = cursor.fetchone()[0]

        # 今天的新闻数
        cursor = conn.execute("""
            SELECT COUNT(*) FROM financial_news
            WHERE published_at >= strftime('%s', 'now', 'start of day')
        """)
        today_count = cursor.fetchone()[0]

        # 已总结的新闻数
        cursor = conn.execute("""
            SELECT COUNT(*) FROM financial_news
            WHERE summary IS NOT NULL AND summary != ''
        """)
        summarized_count = cursor.fetchone()[0]

        conn.close()

        return {
            "success": True,
            "stats": {
                "total_news": total_count,
                "today_news": today_count,
                "summarized_news": summarized_count,
                "latest_news_time": latest_time,
                "active_ws_connections": len(news_ws_clients)
            }
        }

    except Exception as e:
        logger.error(f"❌ Error fetching news stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
