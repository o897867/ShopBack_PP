import asyncio
import aiohttp
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Callable
import logging
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APINinjasXAUDataFetcher:
    """
    XAU/USD (Gold) data fetcher using API Ninjas API.

    Key features:
    - Uses API Ninjas to fetch gold price data with intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d
    - Stores data in SQLite with open_time as PRIMARY KEY
    - Automatic gap-filling for missing data
    - Support for multiple time intervals
    """

    # API Configuration
    API_KEY = os.getenv('API_NINJAS_KEY', '')  # Load from environment variable
    BASE_URL = "https://api.api-ninjas.com/v1"

    # Endpoints
    CURRENT_PRICE_URL = f"{BASE_URL}/goldprice"
    HISTORICAL_PRICE_URL = f"{BASE_URL}/goldpricehistorical"
    COMMODITY_PRICE_URL = f"{BASE_URL}/commodityprice"
    COMMODITY_HISTORICAL_URL = f"{BASE_URL}/commoditypricehistorical"

    # Time intervals in milliseconds
    INTERVAL_1M_MS = 60000
    INTERVAL_3M_MS = 180000
    INTERVAL_5M_MS = 300000
    INTERVAL_15M_MS = 900000
    INTERVAL_30M_MS = 1800000
    INTERVAL_1H_MS = 3600000

    def __init__(self, db_path: str = "shopback_data.db", api_key: Optional[str] = None):
        self.db_path = db_path
        self.api_key = api_key or self.API_KEY

        if not self.api_key:
            raise ValueError("API Ninjas API key is required. Set API_NINJAS_KEY in .env file")

        self.session = None
        self.last_fetch_time = None
        self.init_database()

    def init_database(self):
        """Initialize database table for XAU candles"""
        with sqlite3.connect(self.db_path) as conn:
            # Create table for 1-minute candles
            conn.execute("""
                CREATE TABLE IF NOT EXISTS xau_candles_1m (
                    open_time INTEGER PRIMARY KEY,
                    open REAL,
                    high REAL,
                    low REAL,
                    close REAL,
                    volume REAL
                )
            """)

            # Create table for 3-minute candles (aggregated)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS xau_candles_3m (
                    open_time INTEGER PRIMARY KEY,
                    open REAL,
                    high REAL,
                    low REAL,
                    close REAL,
                    volume REAL
                )
            """)

            # Create table for 5-minute candles
            conn.execute("""
                CREATE TABLE IF NOT EXISTS xau_candles_5m (
                    open_time INTEGER PRIMARY KEY,
                    open REAL,
                    high REAL,
                    low REAL,
                    close REAL,
                    volume REAL
                )
            """)

            # Create indexes for faster queries
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_xau_candles_1m_open_time
                ON xau_candles_1m(open_time DESC)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_xau_candles_3m_open_time
                ON xau_candles_3m(open_time DESC)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_xau_candles_5m_open_time
                ON xau_candles_5m(open_time DESC)
            """)

            logger.info("XAU candles tables initialized (1m, 3m, and 5m)")

    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close_session(self):
        """Close aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()

    def floor_to_interval(self, timestamp_ms: int, interval_ms: int) -> int:
        """Floor timestamp to nearest interval"""
        return (timestamp_ms // interval_ms) * interval_ms

    def floor_to_1m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 1-minute interval"""
        return self.floor_to_interval(timestamp_ms, self.INTERVAL_1M_MS)

    def floor_to_3m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 3-minute interval"""
        return self.floor_to_interval(timestamp_ms, self.INTERVAL_3M_MS)

    def floor_to_5m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 5-minute interval"""
        return self.floor_to_interval(timestamp_ms, self.INTERVAL_5M_MS)

    def get_latest_candle_time(self, table: str = "xau_candles_1m") -> Optional[int]:
        """Get the latest open_time from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(f"""
                SELECT MAX(open_time) FROM {table}
            """)
            result = cursor.fetchone()
            return result[0] if result and result[0] else None

    def get_candle_count(self, table: str = "xau_candles_1m") -> int:
        """Get total number of candles in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
            return cursor.fetchone()[0]

    def upsert_candles_batch(self, candles: List[Dict], table: str = "xau_candles_1m"):
        """Batch UPSERT for efficiency"""
        if not candles:
            return

        with sqlite3.connect(self.db_path) as conn:
            conn.executemany(f"""
                INSERT OR REPLACE INTO {table}
                (open_time, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [(
                c['open_time'],
                c['open'],
                c['high'],
                c['low'],
                c['close'],
                c.get('volume', 0)  # Default to 0 if volume not provided
            ) for c in candles])

    async def fetch_current_price(self) -> Optional[Dict]:
        """
        Fetch current gold price from API Ninjas

        Returns:
            Dictionary with price and timestamp
        """
        try:
            session = await self.get_session()
            headers = {"X-Api-Key": self.api_key}

            async with session.get(self.CURRENT_PRICE_URL, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()

                    # Convert to our format
                    timestamp_ms = data.get('timestamp', int(time.time())) * 1000
                    price = data.get('price', 0)

                    return {
                        "open_time": self.floor_to_1m(timestamp_ms),
                        "timestamp": timestamp_ms // 1000,
                        "open": price,
                        "high": price,
                        "low": price,
                        "close": price,
                        "volume": 0
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"Error fetching current price: {response.status} - {error_text}")
                    return None

        except Exception as e:
            logger.error(f"Error fetching current gold price: {e}")
            return None

    async def fetch_historical_data(self,
                                   period: str = "1m",
                                   start_time: Optional[int] = None,
                                   end_time: Optional[int] = None) -> List[Dict]:
        """
        Fetch historical gold price data from API Ninjas

        Args:
            period: Time interval (1m, 5m, 15m, 30m, 1h, 4h, 1d)
            start_time: Unix timestamp for start (seconds)
            end_time: Unix timestamp for end (seconds)

        Returns:
            List of candle dictionaries
        """
        try:
            session = await self.get_session()
            headers = {"X-Api-Key": self.api_key}

            # Default to last 24 hours if not specified
            if end_time is None:
                end_time = int(time.time())
            if start_time is None:
                start_time = end_time - 86400  # 24 hours ago

            params = {
                "period": period,
                "start": start_time,
                "end": end_time
            }

            # 如果没有指定 start/end，使用无参数版本（获取24小时数据）
            if start_time == end_time - 86400:
                # 默认24小时，使用简化接口
                params = {"period": period}
                logger.info(f"Fetching 24h historical data (period={period})...")
            else:
                logger.info(f"Fetching historical data: period={period}, start={datetime.fromtimestamp(start_time)}, end={datetime.fromtimestamp(end_time)}")

            async with session.get(self.HISTORICAL_PRICE_URL, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Received {len(data) if isinstance(data, list) else 'non-list'} items from API")

                    # Convert to our format
                    candles = []
                    for item in data:
                        timestamp_ms = item.get('time', 0) * 1000

                        # Floor to appropriate interval based on period
                        if period == "1m":
                            open_time_floored = self.floor_to_1m(timestamp_ms)
                        elif period == "5m":
                            open_time_floored = self.floor_to_5m(timestamp_ms)
                        else:
                            open_time_floored = timestamp_ms

                        candles.append({
                            "open_time": open_time_floored,
                            "timestamp": timestamp_ms // 1000,
                            "open": float(item.get('open', 0)),
                            "high": float(item.get('high', 0)),
                            "low": float(item.get('low', 0)),
                            "close": float(item.get('close', 0)),
                            "volume": float(item.get('volume', 0))
                        })

                    logger.info(f"Fetched {len(candles)} candles from API Ninjas")
                    return candles
                else:
                    error_text = await response.text()
                    logger.error(f"Error fetching historical data: {response.status} - {error_text}")
                    return []

        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return []

    async def fetch_commodity_price(self) -> Optional[Dict]:
        """
        Alternative: Fetch gold price using commodity API

        Returns:
            Dictionary with price and timestamp
        """
        try:
            session = await self.get_session()
            headers = {"X-Api-Key": self.api_key}
            params = {"name": "gold"}

            async with session.get(self.COMMODITY_PRICE_URL, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    # Extract gold price
                    timestamp_ms = data.get('updated', int(time.time())) * 1000
                    price = data.get('price', 0)

                    return {
                        "open_time": self.floor_to_1m(timestamp_ms),
                        "timestamp": timestamp_ms // 1000,
                        "open": price,
                        "high": price,
                        "low": price,
                        "close": price,
                        "volume": 0
                    }
                else:
                    logger.error(f"Error fetching commodity price: {response.status}")
                    return None

        except Exception as e:
            logger.error(f"Error fetching commodity price: {e}")
            return None

    async def initialize_with_history(self, hours_back: int = 24):
        """
        启动时初始化：获取过去24小时的历史数据

        流程：
        1. 调用 goldpricehistorical?period=1m 获取24小时数据
        2. 与数据库对比，去除重复数据
        3. 将新数据插入数据库
        4. 聚合3分钟数据

        Args:
            hours_back: 保留参数（固定使用24小时）
        """
        logger.info(f"🔄 初始化 XAU 数据 - 获取过去 24 小时历史数据...")

        # 获取数据库中已有数据的时间范围
        latest_db_time = self.get_latest_candle_time()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
            existing_count = cursor.fetchone()[0]

        if latest_db_time:
            logger.info(f"📊 数据库现有: {existing_count} 条记录，最新: {datetime.fromtimestamp(latest_db_time/1000)}")
        else:
            logger.info("📊 数据库为空，首次初始化")

        # 调用 API 获取24小时历史数据（不带 start/end 参数）
        logger.info("📥 正在获取 API Ninjas 24小时历史数据...")
        candles_from_api = await self.fetch_historical_data(period="1m")

        if not candles_from_api:
            logger.warning("⚠️  未能获取历史数据，尝试使用当前价格...")
            # 如果历史数据不可用，至少获取当前价格
            current = await self.fetch_current_price()
            if current:
                logger.info(f"✅ 获取当前价格: ${current['close']:.2f}")
                self.upsert_candles_batch([current], "xau_candles_1m")
            else:
                logger.error("❌ 无法获取任何数据")
            return

        logger.info(f"✅ API 返回 {len(candles_from_api)} 条数据")

        # 数据去重：获取数据库中已存在的时间戳
        existing_timestamps = set()
        if existing_count > 0:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT open_time FROM xau_candles_1m")
                existing_timestamps = {row[0] for row in cursor.fetchall()}

        # 过滤出新数据
        new_candles = [
            candle for candle in candles_from_api
            if candle['open_time'] not in existing_timestamps
        ]

        duplicate_count = len(candles_from_api) - len(new_candles)

        if duplicate_count > 0:
            logger.info(f"🔍 去重: 跳过 {duplicate_count} 条重复数据")

        # 插入新数据
        if new_candles:
            logger.info(f"💾 存储 {len(new_candles)} 条新数据到数据库...")
            self.upsert_candles_batch(new_candles, "xau_candles_1m")
            logger.info(f"✅ 数据已保存")
        else:
            logger.info("ℹ️  没有新数据需要保存")

        # 聚合 3 分钟数据
        logger.info("🔄 聚合 3 分钟K线...")
        await self.aggregate_1m_to_3m()

        # 最终统计
        final_count = self.get_candle_count('xau_candles_1m')
        logger.info(f"✅ 初始化完成! 数据库共 {final_count} 条记录 (新增 {final_count - existing_count} 条)")

    async def aggregate_1m_to_3m(self):
        """Aggregate 1-minute candles to 3-minute candles"""
        with sqlite3.connect(self.db_path) as conn:
            # Get all 1-minute candles
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_1m
                ORDER BY open_time ASC
            """)

            rows = cursor.fetchall()
            if not rows:
                return

            # Group by 3-minute intervals
            candles_3m = {}
            for row in rows:
                open_time_ms = row[0]
                open_time_3m = self.floor_to_3m(open_time_ms)

                if open_time_3m not in candles_3m:
                    candles_3m[open_time_3m] = {
                        'open_time': open_time_3m,
                        'open': row[1],
                        'high': row[2],
                        'low': row[3],
                        'close': row[4],
                        'volume': row[5]
                    }
                else:
                    # Update high, low, close, and volume
                    candles_3m[open_time_3m]['high'] = max(candles_3m[open_time_3m]['high'], row[2])
                    candles_3m[open_time_3m]['low'] = min(candles_3m[open_time_3m]['low'], row[3])
                    candles_3m[open_time_3m]['close'] = row[4]  # Use latest close
                    candles_3m[open_time_3m]['volume'] += row[5]

            # Store aggregated candles
            if candles_3m:
                self.upsert_candles_batch(list(candles_3m.values()), "xau_candles_3m")
                logger.info(f"Aggregated {len(candles_3m)} 3-minute candles")

    async def fill_gaps(self):
        """Fill missing candles from latest DB time to now"""
        latest_db_time = self.get_latest_candle_time()

        if latest_db_time is None:
            logger.info("No data in DB, skipping gap fill")
            return

        current_time = int(time.time())
        latest_time_seconds = latest_db_time // 1000

        # Calculate time difference
        time_diff_hours = (current_time - latest_time_seconds) / 3600

        if time_diff_hours < 0.02:  # Less than ~1 minute
            logger.info("No gaps to fill")
            return

        logger.info(f"Gap detected: {time_diff_hours:.1f} hours. Fetching missing data...")

        # Fetch missing 1-minute data
        candles_1m = await self.fetch_historical_data(
            period="1m",
            start_time=latest_time_seconds,
            end_time=current_time
        )

        if candles_1m:
            new_candles = [c for c in candles_1m if c['open_time'] > latest_db_time]
            if new_candles:
                logger.info(f"Filling {len(new_candles)} missing 1m candles")
                self.upsert_candles_batch(new_candles, "xau_candles_1m")

        # Update 3m aggregates
        await self.aggregate_1m_to_3m()

    def get_recent_candles(self, table: str = "xau_candles_1m", limit: int = 100) -> List[Dict]:
        """Get recent candles from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(f"""
                SELECT open_time, open, high, low, close, volume
                FROM {table}
                ORDER BY open_time DESC
                LIMIT ?
            """, (limit,))

            candles = []
            for row in cursor.fetchall():
                candles.append({
                    "timestamp": row[0] // 1000,  # Convert to seconds
                    "open_time": row[0],
                    "open": row[1],
                    "high": row[2],
                    "low": row[3],
                    "close": row[4],
                    "volume": row[5]
                })

            return list(reversed(candles))  # Return in chronological order

    def get_current_price(self) -> Optional[float]:
        """Get current XAU price from latest candle"""
        candles = self.get_recent_candles("xau_candles_1m", 1)
        if candles:
            return candles[0]["close"]
        return None

    def __del__(self):
        """Cleanup on deletion"""
        if hasattr(self, 'session') and self.session:
            asyncio.create_task(self.close_session())


class XAUDataManager:
    """Manages XAU data fetching and WebSocket broadcasting"""

    def __init__(self, api_key: Optional[str] = None):
        self.fetcher = APINinjasXAUDataFetcher(api_key=api_key)
        self.is_running = False
        self.update_callback = None
        self._task = None
        self._poll_interval = 60  # Poll every 60 seconds

    async def initialize(self, hours_back: int = 24):
        """Initialize with historical data"""
        logger.info("Initializing XAU Data Manager with API Ninjas...")
        await self.fetcher.initialize_with_history(hours_back)

        candles = self.fetcher.get_recent_candles(limit=100)
        logger.info(f"Loaded {len(candles)} recent candles")

        return candles

    async def start_polling(self, update_callback: Callable):
        """Start polling for new data every 60 seconds"""
        self.update_callback = update_callback
        self.is_running = True

        logger.info(f"Starting XAU data polling ({self._poll_interval}s interval)...")

        while self.is_running:
            try:
                # Try to fetch current price first
                latest_candle = await self.fetcher.fetch_current_price()

                # If current price fails, try commodity API
                if not latest_candle:
                    latest_candle = await self.fetcher.fetch_commodity_price()

                if latest_candle:
                    # Store in database
                    self.fetcher.upsert_candles_batch([latest_candle], "xau_candles_1m")

                    # Notify callback
                    if self.update_callback:
                        try:
                            await self.update_callback(latest_candle)
                        except Exception as e:
                            logger.error(f"Error in update callback: {e}")

                    logger.info(f"Updated XAU price: ${latest_candle['close']:.2f}")
                else:
                    # If real-time price fails, try to fill gaps with historical data
                    await self.fetcher.fill_gaps()

                # Wait before next fetch
                await asyncio.sleep(self._poll_interval)

            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(self._poll_interval)  # Continue polling despite errors

    async def start(self, update_callback: Callable):
        """Start data manager"""
        # Initialize first
        await self.initialize()

        # Start polling task in background
        self._task = asyncio.create_task(self.start_polling(update_callback))

    async def stop(self):
        """Stop data manager"""
        self.is_running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        # Close session
        await self.fetcher.close_session()

        logger.info("XAU Data Manager stopped")

    def get_recent_candles(self, interval: str = "1m", limit: int = 100) -> List[Dict]:
        """Get recent candles for specified interval"""
        table_map = {
            "1m": "xau_candles_1m",
            "3m": "xau_candles_3m",
            "5m": "xau_candles_5m"
        }

        table = table_map.get(interval, "xau_candles_1m")
        return self.fetcher.get_recent_candles(table, limit)

    def get_current_price(self) -> Optional[float]:
        """Get current price"""
        return self.fetcher.get_current_price()


# Testing function
async def test_api_ninjas_fetch():
    """Test function to verify API Ninjas data fetching"""
    # You need to set your API key here or in .env file
    api_key = os.getenv('API_NINJAS_KEY')

    if not api_key:
        print("Please set API_NINJAS_KEY environment variable")
        return

    fetcher = APINinjasXAUDataFetcher(api_key=api_key)

    print("=" * 60)
    print("Testing API Ninjas XAU Data Fetcher")
    print("=" * 60)

    # Test 1: Fetch current price
    print("\n1. Fetching current gold price...")
    current = await fetcher.fetch_current_price()
    if current:
        print(f"   Current price: ${current['close']:.2f}")
        print(f"   Timestamp: {datetime.fromtimestamp(current['timestamp'])}")

    # Test 2: Fetch historical data
    print("\n2. Fetching 1-hour historical data...")
    end_time = int(time.time())
    start_time = end_time - 3600  # 1 hour ago

    candles = await fetcher.fetch_historical_data(
        period="1m",
        start_time=start_time,
        end_time=end_time
    )
    print(f"   Fetched {len(candles)} candles")

    if candles:
        latest = candles[-1]
        print(f"   Latest: {datetime.fromtimestamp(latest['timestamp'])} - ${latest['close']:.2f}")

    # Test 3: Initialize database
    print("\n3. Initializing database with 2 hours of history...")
    await fetcher.initialize_with_history(hours_back=2)

    # Test 4: Get statistics
    print("\n4. Database statistics:")
    total_1m = fetcher.get_candle_count("xau_candles_1m")
    total_3m = fetcher.get_candle_count("xau_candles_3m")
    total_5m = fetcher.get_candle_count("xau_candles_5m")

    print(f"   1m candles: {total_1m}")
    print(f"   3m candles: {total_3m}")
    print(f"   5m candles: {total_5m}")

    latest_time = fetcher.get_latest_candle_time()
    if latest_time:
        print(f"   Latest candle: {datetime.fromtimestamp(latest_time/1000)}")
        print(f"   Current price in DB: ${fetcher.get_current_price():.2f}")

    # Cleanup
    await fetcher.close_session()

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    # Run test
    asyncio.run(test_api_ninjas_fetch())