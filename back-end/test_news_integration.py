#!/usr/bin/env python3
"""
测试金融新闻功能集成
"""

import asyncio
import sqlite3
import json
from datetime import datetime

def test_database_schema():
    """测试数据库表结构"""
    print("📋 测试数据库表结构...")

    try:
        conn = sqlite3.connect('shopback_data.db')
        cursor = conn.cursor()

        # 检查表是否存在
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='financial_news'
        """)

        if not cursor.fetchone():
            print("❌ financial_news 表不存在")
            return False

        # 检查表结构
        cursor.execute("PRAGMA table_info(financial_news)")
        columns = {row[1] for row in cursor.fetchall()}

        required_columns = {
            'id', 'news_id', 'title', 'content', 'summary', 'summary_cn',
            'source', 'url', 'published_at', 'received_at', 'symbols',
            'sentiment', 'impact_level', 'raw_data'
        }

        missing = required_columns - columns
        if missing:
            print(f"❌ 缺少字段: {missing}")
            return False

        # 检查索引
        cursor.execute("PRAGMA index_list(financial_news)")
        indexes = [row[1] for row in cursor.fetchall()]

        print(f"✅ 数据库表结构正确")
        print(f"   - 字段数: {len(columns)}")
        print(f"   - 索引数: {len(indexes)}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ 数据库测试失败: {e}")
        return False


def test_insert_mock_news():
    """插入模拟新闻数据"""
    print("\n📝 插入模拟新闻数据...")

    try:
        conn = sqlite3.connect('shopback_data.db')

        mock_news = {
            'news_id': 'test_001',
            'title': 'Gold Prices Surge to Record High',
            'content': 'Gold prices reached a new all-time high today...',
            'summary': 'Gold hits record high amid economic uncertainty.',
            'summary_cn': '黄金价格在经济不确定性中创历史新高。',
            'source': 'Test Source',
            'url': 'https://example.com/news/001',
            'published_at': int(datetime.now().timestamp()),
            'symbols': json.dumps(['COMEX:GC1!', 'XAUUSD']),
            'sentiment': 'positive',
            'impact_level': 'high',
            'raw_data': json.dumps({'test': True})
        }

        conn.execute("""
            INSERT OR REPLACE INTO financial_news
            (news_id, title, content, summary, summary_cn, source, url,
             published_at, symbols, sentiment, impact_level, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            mock_news['news_id'],
            mock_news['title'],
            mock_news['content'],
            mock_news['summary'],
            mock_news['summary_cn'],
            mock_news['source'],
            mock_news['url'],
            mock_news['published_at'],
            mock_news['symbols'],
            mock_news['sentiment'],
            mock_news['impact_level'],
            mock_news['raw_data']
        ))

        conn.commit()

        # 验证插入
        cursor = conn.execute("""
            SELECT news_id, title, summary, summary_cn
            FROM financial_news
            WHERE news_id = ?
        """, (mock_news['news_id'],))

        result = cursor.fetchone()
        conn.close()

        if result:
            print(f"✅ 模拟新闻插入成功")
            print(f"   - ID: {result[0]}")
            print(f"   - 标题: {result[1]}")
            print(f"   - 英文总结: {result[2]}")
            print(f"   - 中文总结: {result[3]}")
            return True
        else:
            print("❌ 新闻插入失败")
            return False

    except Exception as e:
        print(f"❌ 插入测试失败: {e}")
        return False


def test_news_client_import():
    """测试新闻客户端导入"""
    print("\n📦 测试模块导入...")

    try:
        from insightsentry_news import NewsWebSocketClient
        print("✅ NewsWebSocketClient 导入成功")

        # 测试初始化（不连接 WebSocket）
        client = NewsWebSocketClient(
            api_key="test_key",
            openai_api_key="test_openai_key",
            db_path="shopback_data.db"
        )
        print("✅ NewsWebSocketClient 初始化成功")

        # 测试获取新闻
        news = client.get_latest_news(5)
        print(f"✅ 获取最新新闻: {len(news)} 条")

        if news:
            print(f"   - 最新新闻: {news[0]['title'][:50]}...")

        return True

    except Exception as e:
        print(f"❌ 导入测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_news_router_import():
    """测试新闻路由导入"""
    print("\n🛣️  测试路由导入...")

    try:
        from routers.news_router import router, broadcast_news_to_clients
        print("✅ news_router 导入成功")
        print(f"   - 路由前缀: {router.prefix}")
        print(f"   - 路由数量: {len(router.routes)}")

        # 列出所有端点
        print("   - 端点列表:")
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(route.methods)
                print(f"     · {methods} {route.path}")

        return True

    except Exception as e:
        print(f"❌ 路由导入失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dependencies():
    """测试依赖库"""
    print("\n📚 测试依赖库...")

    dependencies = {
        'openai': 'OpenAI API',
        'websockets': 'WebSocket 客户端',
        'aiohttp': 'HTTP 客户端',
        'sqlite3': 'SQLite 数据库',
        'fastapi': 'FastAPI 框架'
    }

    all_ok = True
    for module, name in dependencies.items():
        try:
            __import__(module)
            print(f"✅ {name} ({module})")
        except ImportError:
            print(f"❌ {name} ({module}) - 未安装")
            all_ok = False

    return all_ok


def main():
    """运行所有测试"""
    print("=" * 60)
    print("🧪 金融新闻功能集成测试")
    print("=" * 60)

    results = []

    # 测试1: 依赖库
    results.append(("依赖库检查", test_dependencies()))

    # 测试2: 数据库表结构
    results.append(("数据库表结构", test_database_schema()))

    # 测试3: 插入模拟数据
    results.append(("模拟数据插入", test_insert_mock_news()))

    # 测试4: 客户端导入
    results.append(("新闻客户端导入", test_news_client_import()))

    # 测试5: 路由导入
    results.append(("新闻路由导入", test_news_router_import()))

    # 汇总结果
    print("\n" + "=" * 60)
    print("📊 测试结果汇总")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} - {name}")

    print("-" * 60)
    print(f"通过: {passed}/{total} ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 所有测试通过！新闻功能已准备就绪")
        print("\n📝 下一步:")
        print("   1. 在 .env 中设置 OPENAI_API_KEY")
        print("   2. 启动后端服务: python fapi.py")
        print("   3. 访问 http://localhost:8000/api/news/latest")
        print("   4. 查看 NEWS_SETUP.md 获取完整文档")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查错误信息")
        return 1


if __name__ == "__main__":
    exit(main())
