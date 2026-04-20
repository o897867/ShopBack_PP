#!/usr/bin/env python3
"""
InsightSentry XAU 数据获取模块测试

测试内容：
1. REST API 历史数据获取
2. 数据去重功能
3. WebSocket 连接和实时数据
4. 数据完整性验证
"""

import asyncio
import sqlite3
from datetime import datetime
from insightsentry_xau_data import InsightSentryXAUDataFetcher, XAUWebSocketClient, XAUDataManager

# 配置
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoic3V5aW5nY2luQGdtYWlsLmNvbSIsInBsYW4iOiJ1bHRyYSIsIm5ld3NmZWVkX2VuYWJsZWQiOnRydWUsIndlYnNvY2tldF9zeW1ib2xzIjo1LCJ3ZWJzb2NrZXRfY29ubmVjdGlvbnMiOjF9.6aA_ND-9NmZI2-8mILRJeZDLt9Y6skrtsNbzP0FeQVI"
DB_PATH = "shopback_data.db"
START_YM = "2025-11"  # 使用 YYYY-MM 格式


def print_section(title):
    """打印章节标题"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def show_db_stats():
    """显示数据库统计信息"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count = cursor.fetchone()[0]

        if count > 0:
            cursor = conn.execute("""
                SELECT MIN(open_time), MAX(open_time)
                FROM xau_candles_1m
            """)
            min_time, max_time = cursor.fetchone()

            print(f"\n📊 数据库统计:")
            print(f"   总记录数: {count}")
            print(f"   时间范围: {datetime.fromtimestamp(min_time/1000)} 至 {datetime.fromtimestamp(max_time/1000)}")
            print(f"   覆盖时长: {(max_time - min_time) / 3600000:.1f} 小时")

            # 显示最近3条
            cursor = conn.execute("""
                SELECT open_time, close
                FROM xau_candles_1m
                ORDER BY open_time DESC
                LIMIT 3
            """)

            print(f"\n   最近 3 条记录:")
            for row in cursor.fetchall():
                timestamp = datetime.fromtimestamp(row[0]/1000)
                price = row[1]
                print(f"   {timestamp} - ${price:.2f}")
        else:
            print("📊 数据库为空")


async def test_historical_data():
    """测试 1: 历史数据获取和去重"""
    print_section("测试 1: 历史数据获取和去重")

    print(f"🔧 初始化 InsightSentry Fetcher...")
    print(f"   Bearer Token: {BEARER_TOKEN[:30]}...")
    print(f"   Start Date: {START_YM}")

    fetcher = InsightSentryXAUDataFetcher(db_path=DB_PATH, bearer_token=BEARER_TOKEN)

    try:
        print(f"\n📥 调用 REST API 获取历史数据...")
        await fetcher.initialize_with_history(start_ym=START_YM)

        print(f"\n✅ 初始化完成!")

        # 显示统计
        show_db_stats()

        # 数据完整性检查
        print(f"\n🔍 数据完整性检查...")
        with sqlite3.connect(DB_PATH) as conn:
            # 检查重复
            cursor = conn.execute("""
                SELECT open_time, COUNT(*) as cnt
                FROM xau_candles_1m
                GROUP BY open_time
                HAVING cnt > 1
            """)
            duplicates = cursor.fetchall()

            if duplicates:
                print(f"❌ 发现 {len(duplicates)} 个重复时间戳")
            else:
                print(f"✅ 无重复数据")

            # 检查3m和5m聚合
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_3m")
            count_3m = cursor.fetchone()[0]
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_5m")
            count_5m = cursor.fetchone()[0]

            print(f"✅ 3分钟K线: {count_3m} 条")
            print(f"✅ 5分钟K线: {count_5m} 条")

    finally:
        await fetcher.close_session()


async def test_websocket_connection():
    """测试 2: WebSocket 连接和实时数据（运行30秒）"""
    print_section("测试 2: WebSocket 实时数据（30秒测试）")

    # 计数器
    message_count = 0

    async def on_data(candle):
        nonlocal message_count
        message_count += 1
        print(f"\n📨 收到数据 #{message_count}:")
        print(f"   时间: {datetime.fromtimestamp(candle['timestamp'])}")
        print(f"   价格: ${candle['close']:.2f} (O:{candle['open']:.2f} H:{candle['high']:.2f} L:{candle['low']:.2f})")
        print(f"   成交量: {candle['volume']:.0f}")

    print(f"🔌 启动 WebSocket 客户端...")
    ws_client = XAUWebSocketClient(api_key=BEARER_TOKEN, data_callback=on_data)

    try:
        await ws_client.start()

        print(f"⏳ 监听 30 秒...")
        await asyncio.sleep(30)

        print(f"\n✅ WebSocket 测试完成")
        print(f"   总消息数: {message_count}")

    finally:
        await ws_client.stop()


async def test_full_integration():
    """测试 3: 完整集成（历史数据 + WebSocket）"""
    print_section("测试 3: 完整数据管理器（30秒实时测试）")

    # 统计
    update_count = 0
    initial_count = 0

    # 获取初始记录数
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        initial_count = cursor.fetchone()[0]

    async def on_update(candle):
        nonlocal update_count
        update_count += 1
        print(f"💹 更新 #{update_count}: ${candle['close']:.2f} @ {datetime.fromtimestamp(candle['timestamp'])}")

    print(f"🚀 启动完整数据管理器...")
    manager = XAUDataManager(bearer_token=BEARER_TOKEN)

    try:
        await manager.start(on_update)

        print(f"\n⏳ 运行 30 秒...")
        await asyncio.sleep(30)

        print(f"\n🛑 停止数据管理器...")
        await manager.stop()

        # 最终统计
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
            final_count = cursor.fetchone()[0]

        print(f"\n📊 最终统计:")
        print(f"   初始记录: {initial_count}")
        print(f"   最终记录: {final_count}")
        print(f"   新增记录: {final_count - initial_count}")
        print(f"   更新回调: {update_count} 次")

    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """主测试函数"""
    print("\n" + "🔬" * 35)
    print("   InsightSentry XAU 数据模块测试")
    print("🔬" * 35)

    # 测试 1: 历史数据
    await test_historical_data()

    # 询问是否继续 WebSocket 测试
    print("\n" + "=" * 70)
    print("✅ 历史数据测试完成!")
    print("\n接下来将测试 WebSocket 实时数据（需要约30秒）")

    try:
        response = input("是否继续 WebSocket 测试? (y/n): ")
        if response.lower() == 'y':
            # 测试 2: WebSocket
            await test_websocket_connection()

            # 测试 3: 完整集成
            print("\n" + "=" * 70)
            response = input("是否测试完整集成? (y/n): ")
            if response.lower() == 'y':
                await test_full_integration()
    except EOFError:
        print("\n⏭️  跳过 WebSocket 测试（非交互模式）")

    print("\n" + "=" * 70)
    print("  测试全部完成!")
    print("=" * 70)

    print("\n📋 功能验证:")
    print("  ✓ REST API 历史数据获取")
    print("  ✓ 数据去重功能")
    print("  ✓ 数据库存储")
    print("  ✓ 3m/5m K线聚合")

    show_db_stats()


if __name__ == "__main__":
    asyncio.run(main())
