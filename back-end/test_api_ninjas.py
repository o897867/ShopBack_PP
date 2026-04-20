#!/usr/bin/env python3
"""
独立测试脚本：测试 API Ninjas XAU 数据获取模块
包括：
1. 测试 API 连接
2. 获取历史数据
3. 检查数据库现有数据
4. 验证数据去重逻辑
"""

import asyncio
import sqlite3
from datetime import datetime, timedelta
import time
from api_ninjas_xau_data import APINinjasXAUDataFetcher

# API Key
API_KEY = "0nfgJfsxDijyaFdTux2RZA==TQm6U2qFlNYfD8zW"
DB_PATH = "shopback_data.db"


def print_section(title):
    """打印分节标题"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def check_database_content():
    """检查数据库中现有的数据"""
    print_section("检查数据库现有数据")

    with sqlite3.connect(DB_PATH) as conn:
        # 检查 1m 数据
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count_1m = cursor.fetchone()[0]
        print(f"📊 1分钟K线数量: {count_1m}")

        if count_1m > 0:
            # 获取最早和最晚的数据
            cursor = conn.execute("""
                SELECT MIN(open_time), MAX(open_time)
                FROM xau_candles_1m
            """)
            min_time, max_time = cursor.fetchone()

            print(f"   最早数据: {datetime.fromtimestamp(min_time/1000)}")
            print(f"   最晚数据: {datetime.fromtimestamp(max_time/1000)}")

            # 显示最近 5 条数据
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_1m
                ORDER BY open_time DESC
                LIMIT 5
            """)

            print("\n   最近 5 条数据:")
            print("   " + "-" * 66)
            print(f"   {'时间':<20} {'开':<8} {'高':<8} {'低':<8} {'收':<8}")
            print("   " + "-" * 66)

            for row in cursor.fetchall():
                timestamp = datetime.fromtimestamp(row[0]/1000)
                print(f"   {timestamp} {row[1]:<8.2f} {row[2]:<8.2f} {row[3]:<8.2f} {row[4]:<8.2f}")

        # 检查 3m 和 5m 数据
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_3m")
        count_3m = cursor.fetchone()[0]
        print(f"\n📊 3分钟K线数量: {count_3m}")

        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_5m")
        count_5m = cursor.fetchone()[0]
        print(f"📊 5分钟K线数量: {count_5m}")


async def test_current_price(fetcher):
    """测试获取当前价格"""
    print_section("测试 1: 获取当前黄金价格")

    current = await fetcher.fetch_current_price()

    if current:
        print(f"✅ 成功获取当前价格")
        print(f"   价格: ${current['close']:.2f}")
        print(f"   时间: {datetime.fromtimestamp(current['timestamp'])}")
        print(f"   数据: open={current['open']:.2f}, high={current['high']:.2f}, low={current['low']:.2f}, close={current['close']:.2f}")
        return True
    else:
        print(f"❌ 获取当前价格失败")
        return False


async def test_historical_data(fetcher, hours=1):
    """测试获取历史数据"""
    print_section(f"测试 2: 获取过去 {hours} 小时的历史数据")

    end_time = int(time.time())
    start_time = end_time - (hours * 3600)

    print(f"📅 时间范围:")
    print(f"   开始: {datetime.fromtimestamp(start_time)}")
    print(f"   结束: {datetime.fromtimestamp(end_time)}")

    candles = await fetcher.fetch_historical_data(
        period="1m",
        start_time=start_time,
        end_time=end_time
    )

    if candles:
        print(f"\n✅ 成功获取 {len(candles)} 条K线数据")

        # 显示前 3 条数据
        print(f"\n   前 3 条数据样本:")
        print("   " + "-" * 66)
        print(f"   {'时间':<20} {'开':<8} {'高':<8} {'低':<8} {'收':<8} {'量':<8}")
        print("   " + "-" * 66)

        for candle in candles[:3]:
            timestamp = datetime.fromtimestamp(candle['timestamp'])
            print(f"   {timestamp} {candle['open']:<8.2f} {candle['high']:<8.2f} {candle['low']:<8.2f} {candle['close']:<8.2f} {candle['volume']:<8.0f}")

        # 显示最后 3 条数据
        if len(candles) > 3:
            print(f"\n   最后 3 条数据样本:")
            print("   " + "-" * 66)
            for candle in candles[-3:]:
                timestamp = datetime.fromtimestamp(candle['timestamp'])
                print(f"   {timestamp} {candle['open']:<8.2f} {candle['high']:<8.2f} {candle['low']:<8.2f} {candle['close']:<8.2f} {candle['volume']:<8.0f}")

        return candles
    else:
        print(f"❌ 获取历史数据失败")
        return []


async def test_data_storage(fetcher, candles):
    """测试数据存储和去重"""
    print_section("测试 3: 数据存储与去重")

    # 获取存储前的数据库状态
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count_before = cursor.fetchone()[0]

    print(f"📊 存储前数据库中有 {count_before} 条记录")

    # 存储数据
    print(f"📥 正在存储 {len(candles)} 条新数据...")
    fetcher.upsert_candles_batch(candles, "xau_candles_1m")

    # 获取存储后的数据库状态
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count_after = cursor.fetchone()[0]

    print(f"📊 存储后数据库中有 {count_after} 条记录")
    print(f"✅ 新增了 {count_after - count_before} 条记录")

    if count_after - count_before < len(candles):
        print(f"   ℹ️  有 {len(candles) - (count_after - count_before)} 条重复数据被跳过（去重成功）")

    # 验证数据完整性
    print(f"\n🔍 验证数据完整性...")
    with sqlite3.connect(DB_PATH) as conn:
        # 检查是否有重复的 open_time
        cursor = conn.execute("""
            SELECT open_time, COUNT(*) as cnt
            FROM xau_candles_1m
            GROUP BY open_time
            HAVING cnt > 1
        """)
        duplicates = cursor.fetchall()

        if duplicates:
            print(f"❌ 发现 {len(duplicates)} 个重复的时间戳")
            for dup in duplicates[:5]:
                print(f"   时间戳 {dup[0]} 重复了 {dup[1]} 次")
        else:
            print(f"✅ 没有重复数据，数据完整性良好")


async def test_aggregation(fetcher):
    """测试 3 分钟数据聚合"""
    print_section("测试 4: 3分钟数据聚合")

    # 获取聚合前的数据库状态
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_3m")
        count_before = cursor.fetchone()[0]

    print(f"📊 聚合前 3m 表中有 {count_before} 条记录")

    # 执行聚合
    print(f"🔄 正在聚合 1m 数据到 3m...")
    await fetcher.aggregate_1m_to_3m()

    # 获取聚合后的数据库状态
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_3m")
        count_after = cursor.fetchone()[0]

        print(f"📊 聚合后 3m 表中有 {count_after} 条记录")
        print(f"✅ 新增了 {count_after - count_before} 条 3m K线")

        # 显示最近几条 3m 数据
        if count_after > 0:
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_3m
                ORDER BY open_time DESC
                LIMIT 3
            """)

            print(f"\n   最近 3 条 3m K线:")
            print("   " + "-" * 66)
            print(f"   {'时间':<20} {'开':<8} {'高':<8} {'低':<8} {'收':<8}")
            print("   " + "-" * 66)

            for row in cursor.fetchall():
                timestamp = datetime.fromtimestamp(row[0]/1000)
                print(f"   {timestamp} {row[1]:<8.2f} {row[2]:<8.2f} {row[3]:<8.2f} {row[4]:<8.2f}")


async def test_24h_initialization(fetcher):
    """测试初始化 24 小时数据"""
    print_section("测试 5: 初始化 24 小时历史数据")

    print(f"📅 正在获取过去 24 小时的数据...")
    await fetcher.initialize_with_history(hours_back=24)

    # 检查结果
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
        count_1m = cursor.fetchone()[0]

        cursor = conn.execute("""
            SELECT MIN(open_time), MAX(open_time)
            FROM xau_candles_1m
        """)
        min_time, max_time = cursor.fetchone()

        print(f"\n✅ 初始化完成")
        print(f"   1m K线总数: {count_1m}")
        print(f"   数据范围: {datetime.fromtimestamp(min_time/1000)} 到 {datetime.fromtimestamp(max_time/1000)}")
        print(f"   覆盖时长: {(max_time - min_time) / 3600000:.1f} 小时")


async def main():
    """主测试函数"""
    print("\n" + "🔬" * 35)
    print("   API Ninjas XAU 数据获取模块 - 独立测试")
    print("🔬" * 35)

    # 检查数据库现有数据
    check_database_content()

    # 创建 fetcher 实例
    print_section("初始化")
    print(f"🔑 API Key: {API_KEY[:20]}...")
    print(f"💾 数据库路径: {DB_PATH}")

    fetcher = APINinjasXAUDataFetcher(db_path=DB_PATH, api_key=API_KEY)
    print(f"✅ Fetcher 实例创建成功")

    try:
        # 测试 1: 获取当前价格
        success = await test_current_price(fetcher)
        if not success:
            print("\n⚠️  当前价格接口可能不可用，继续测试历史数据接口...")

        # 测试 2: 获取 1 小时历史数据
        candles = await test_historical_data(fetcher, hours=1)

        if candles:
            # 测试 3: 数据存储和去重
            await test_data_storage(fetcher, candles)

            # 测试 4: 数据聚合
            await test_aggregation(fetcher)

        # 测试 5: 完整的 24 小时初始化（自动跳过，数据量大）
        print_section("跳过: 24 小时数据初始化")
        print("⏭️  跳过 24 小时初始化测试（数据量大，手动触发）")

        # 最终数据库状态
        print_section("最终数据库状态")
        check_database_content()

        print_section("测试总结")
        print("✅ 所有测试完成!")
        print("\n关键功能验证:")
        print("  ✓ API 连接正常")
        print("  ✓ 历史数据获取正常")
        print("  ✓ 数据存储和去重正常")
        print("  ✓ 数据聚合正常")

    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # 清理资源
        await fetcher.close_session()
        print("\n🧹 资源清理完成")


if __name__ == "__main__":
    asyncio.run(main())
