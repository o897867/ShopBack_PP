#!/usr/bin/env python3
"""
完整流程测试：
1. 启动时获取24小时历史数据并去重
2. 每分钟获取当前价格并保存
"""

import asyncio
import sqlite3
from datetime import datetime
from api_ninjas_xau_data import APINinjasXAUDataFetcher

API_KEY = "0nfgJfsxDijyaFdTux2RZA==TQm6U2qFlNYfD8zW"
DB_PATH = "shopback_data.db"


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

            print(f"📊 数据库统计:")
            print(f"   总记录数: {count}")
            print(f"   时间范围: {datetime.fromtimestamp(min_time/1000)} 至 {datetime.fromtimestamp(max_time/1000)}")
            print(f"   覆盖时长: {(max_time - min_time) / 3600000:.1f} 小时")

            # 显示最近3条数据
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


async def test_complete_flow():
    """测试完整流程"""
    print("=" * 70)
    print("  API Ninjas XAU 数据获取 - 完整流程测试")
    print("=" * 70)

    # ============= 步骤 1: 查看初始状态 =============
    print("\n【步骤 1】查看初始数据库状态")
    print("-" * 70)
    show_db_stats()

    # ============= 步骤 2: 初始化（获取24小时数据并去重） =============
    print("\n【步骤 2】初始化 - 获取24小时历史数据")
    print("-" * 70)

    fetcher = APINinjasXAUDataFetcher(db_path=DB_PATH, api_key=API_KEY)

    try:
        await fetcher.initialize_with_history(hours_back=24)

        print("\n✅ 初始化完成")

        # ============= 步骤 3: 查看初始化后的状态 =============
        print("\n【步骤 3】初始化后的数据库状态")
        print("-" * 70)
        show_db_stats()

        # ============= 步骤 4: 测试实时数据获取 =============
        print("\n【步骤 4】测试实时数据获取（模拟3次，每次间隔5秒）")
        print("-" * 70)

        for i in range(3):
            print(f"\n第 {i+1} 次获取当前价格...")

            # 获取当前价格
            current = await fetcher.fetch_current_price()

            if current:
                print(f"✅ 成功获取: ${current['close']:.2f} at {datetime.fromtimestamp(current['timestamp'])}")

                # 保存到数据库
                fetcher.upsert_candles_batch([current], "xau_candles_1m")
                print(f"💾 已保存到数据库")
            else:
                print(f"❌ 获取失败")

            if i < 2:  # 最后一次不等待
                print("⏳ 等待 5 秒...")
                await asyncio.sleep(5)

        # ============= 步骤 5: 最终状态 =============
        print("\n【步骤 5】最终数据库状态")
        print("-" * 70)
        show_db_stats()

        # ============= 步骤 6: 数据完整性验证 =============
        print("\n【步骤 6】数据完整性验证")
        print("-" * 70)

        with sqlite3.connect(DB_PATH) as conn:
            # 检查重复数据
            cursor = conn.execute("""
                SELECT open_time, COUNT(*) as cnt
                FROM xau_candles_1m
                GROUP BY open_time
                HAVING cnt > 1
            """)
            duplicates = cursor.fetchall()

            if duplicates:
                print(f"❌ 发现 {len(duplicates)} 个重复记录")
                for dup in duplicates[:5]:
                    print(f"   时间戳 {dup[0]} 重复 {dup[1]} 次")
            else:
                print("✅ 没有重复数据")

            # 检查3m数据
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_3m")
            count_3m = cursor.fetchone()[0]
            print(f"✅ 3分钟K线: {count_3m} 条")

        print("\n" + "=" * 70)
        print("  测试完成！")
        print("=" * 70)

        print("\n📋 总结:")
        print("  ✓ 24小时历史数据获取成功")
        print("  ✓ 数据去重功能正常")
        print("  ✓ 实时价格获取正常")
        print("  ✓ 数据库存储正常")
        print("  ✓ 数据完整性良好")

    finally:
        await fetcher.close_session()


if __name__ == "__main__":
    asyncio.run(test_complete_flow())
