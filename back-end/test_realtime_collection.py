#!/usr/bin/env python3
"""
测试实时数据收集：每分钟获取一次 XAU 当前价格并存储
"""

import asyncio
import sqlite3
from datetime import datetime
from api_ninjas_xau_data import XAUDataManager

API_KEY = "0nfgJfsxDijyaFdTux2RZA==TQm6U2qFlNYfD8zW"
DB_PATH = "shopback_data.db"

def show_recent_data(limit=5):
    """显示最近的数据"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("""
            SELECT open_time, close, volume
            FROM xau_candles_1m
            ORDER BY open_time DESC
            LIMIT ?
        """, (limit,))

        print(f"\n最近 {limit} 条数据:")
        print("-" * 60)
        print(f"{'时间':<22} {'价格':<10} {'数据源'}")
        print("-" * 60)

        for row in cursor.fetchall():
            timestamp = datetime.fromtimestamp(row[0]/1000)
            price = row[1]
            volume = row[2]
            source = "实时采集" if volume == 0 else "历史数据"
            print(f"{timestamp} ${price:<9.2f} {source}")

async def test_realtime_collection(duration_minutes=3):
    """
    测试实时数据收集

    Args:
        duration_minutes: 测试持续时间（分钟）
    """
    print("=" * 70)
    print("  实时数据收集测试")
    print("=" * 70)
    print(f"\n⏰ 测试持续时间: {duration_minutes} 分钟")
    print(f"📊 每 60 秒收集一次数据\n")

    # 显示测试前的数据
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count_before = cursor.fetchone()[0]

    print(f"测试前数据库记录数: {count_before}")
    show_recent_data(3)

    # 创建数据管理器
    manager = XAUDataManager(api_key=API_KEY)

    # 收集的数据计数器
    collected_count = 0

    # 回调函数：每次收集到新数据时调用
    async def on_data_update(candle):
        nonlocal collected_count
        collected_count += 1
        print(f"\n✅ [{datetime.now().strftime('%H:%M:%S')}] 收集到新数据 #{collected_count}")
        print(f"   价格: ${candle['close']:.2f}")
        print(f"   时间: {datetime.fromtimestamp(candle['timestamp'])}")

    try:
        # 初始化
        print(f"\n🚀 启动数据收集...")
        await manager.initialize(hours_back=24)

        # 设置轮询间隔为 60 秒
        manager._poll_interval = 60

        # 启动数据收集
        await manager.start(on_data_update)

        # 运行指定时间
        print(f"\n⏳ 数据收集进行中... (将运行 {duration_minutes} 分钟)")
        print("   (按 Ctrl+C 可以提前停止)")

        # 等待指定时间
        await asyncio.sleep(duration_minutes * 60)

    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断测试")
    finally:
        # 停止数据收集
        await manager.stop()
        print(f"\n🛑 数据收集已停止")

        # 显示测试后的数据
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
            count_after = cursor.fetchone()[0]

        print(f"\n测试后数据库记录数: {count_after}")
        print(f"新增记录数: {count_after - count_before}")
        print(f"收集回调触发次数: {collected_count}")

        show_recent_data(5)

        print("\n" + "=" * 70)
        print("  测试完成")
        print("=" * 70)

if __name__ == "__main__":
    # 运行 3 分钟的测试
    asyncio.run(test_realtime_collection(duration_minutes=3))
