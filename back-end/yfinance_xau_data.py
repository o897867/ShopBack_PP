import asyncio
import yfinance as yf
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Callable
import logging
import time
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YFinanceXAUDataFetcher:
    """
    XAU/USD (Gold) data fetcher using Yahoo Finance API.

    Key features:
    - Uses yfinance to fetch 1-minute gold price data
    - Stores data in SQLite with open_time as PRIMARY KEY
    - Automatic gap-filling for missing data
    - 7-day historical data limit (Yahoo Finance restriction)
    """

    SYMBOL = "GC=F"  # Gold futures symbol
    # Alternative symbols:
    # "XAUUSD=X" - XAU/USD currency pair
    # "GLD" - SPDR Gold Shares ETF

    INTERVAL = "1m"  # 1 minute interval
    INTERVAL_MS = 60000  # 1 minute in milliseconds
    INTERVAL_3M_MS = 180000  # 3 minutes in milliseconds
    INTERVAL_5M_MS = 300000  # 5 minutes in milliseconds
    MAX_HISTORY_DAYS = 7  # Yahoo Finance limit for 1m data

    def __init__(self, db_path: str = "shopback_data.db"):
        self.db_path = db_path
        self.ticker = yf.Ticker(self.SYMBOL)
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

            # Create table for 5-minute candles (aggregated)
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

    def floor_to_1m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 1-minute interval"""
        return (timestamp_ms // self.INTERVAL_MS) * self.INTERVAL_MS

    def floor_to_3m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 3-minute interval"""
        return (timestamp_ms // self.INTERVAL_3M_MS) * self.INTERVAL_3M_MS

    def floor_to_5m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 5-minute interval"""
        return (timestamp_ms // self.INTERVAL_5M_MS) * self.INTERVAL_5M_MS

    def get_latest_candle_time(self) -> Optional[int]:
        """Get the latest open_time from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT MAX(open_time) FROM xau_candles_1m
            """)
            result = cursor.fetchone()
            return result[0] if result and result[0] else None

    def get_candle_count(self) -> int:
        """Get total number of candles in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM xau_candles_1m")
            return cursor.fetchone()[0]

    def upsert_candle(self, candle: Dict):
        """UPSERT candle using open_time as key (idempotent operation)"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO xau_candles_1m
                (open_time, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                candle['open_time'],
                candle['open'],
                candle['high'],
                candle['low'],
                candle['close'],
                candle['volume']
            ))

    def upsert_candles_batch(self, candles: List[Dict]):
        """Batch UPSERT for efficiency"""
        if not candles:
            return

        with sqlite3.connect(self.db_path) as conn:
            conn.executemany("""
                INSERT OR REPLACE INTO xau_candles_1m
                (open_time, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [(
                c['open_time'],
                c['open'],
                c['high'],
                c['low'],
                c['close'],
                c['volume']
            ) for c in candles])

    def fetch_history(self, period: str = "7d", interval: str = "1m") -> List[Dict]:
        """
        Fetch historical data from Yahoo Finance

        Args:
            period: Time period (1d, 5d, 7d, etc.)
            interval: Candle interval (1m, 2m, 5m, etc.)

        Returns:
            List of candle dictionaries
        """
        try:
            logger.info(f"Fetching {self.SYMBOL} data: period={period}, interval={interval}")

            # Fetch data using yfinance
            df = self.ticker.history(period=period, interval=interval)

            if df.empty:
                logger.warning("No data returned from Yahoo Finance")
                return []

            # Convert DataFrame to list of dicts
            candles = []
            for timestamp, row in df.iterrows():
                # Convert timestamp to milliseconds
                open_time_ms = int(timestamp.timestamp() * 1000)
                open_time_floored = self.floor_to_1m(open_time_ms)

                candles.append({
                    "open_time": open_time_floored,
                    "timestamp": open_time_floored // 1000,  # seconds for compatibility
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": float(row['Volume']) if pd.notna(row['Volume']) else 0.0
                })

            logger.info(f"Fetched {len(candles)} candles from Yahoo Finance")
            return candles

        except Exception as e:
            logger.error(f"Error fetching history: {e}")
            return []

    def fetch_latest(self) -> Optional[Dict]:
        """Fetch the latest candle data"""
        try:
            # Fetch last 2 days to ensure we get recent data
            df = self.ticker.history(period="2d", interval=self.INTERVAL)

            if df.empty:
                logger.warning("No latest data available")
                return None

            # Get the most recent candle
            latest_row = df.iloc[-1]
            latest_timestamp = df.index[-1]

            open_time_ms = int(latest_timestamp.timestamp() * 1000)
            open_time_floored = self.floor_to_1m(open_time_ms)

            candle = {
                "open_time": open_time_floored,
                "timestamp": open_time_floored // 1000,
                "open": float(latest_row['Open']),
                "high": float(latest_row['High']),
                "low": float(latest_row['Low']),
                "close": float(latest_row['Close']),
                "volume": float(latest_row['Volume']) if pd.notna(latest_row['Volume']) else 0.0
            }

            return candle

        except Exception as e:
            logger.error(f"Error fetching latest candle: {e}")
            return None

    async def initialize_with_history(self, days_back: int = 7):
        """Initialize database with historical data"""
        logger.info(f"Initializing XAU data with {days_back} days of history...")

        # Cap at 7 days due to Yahoo Finance limitation
        days_back = min(days_back, self.MAX_HISTORY_DAYS)

        latest_db_time = self.get_latest_candle_time()

        if latest_db_time is None:
            # First run: fetch full history
            logger.info(f"No existing data. Fetching {days_back} days...")
            candles = self.fetch_history(period=f"{days_back}d", interval=self.INTERVAL)

            if candles:
                logger.info(f"Storing {len(candles)} candles")
                self.upsert_candles_batch(candles)
        else:
            # Existing data: fill gaps if needed
            logger.info(f"Latest candle in DB: {datetime.fromtimestamp(latest_db_time/1000)}")
            await self.fill_gaps()

        logger.info(f"Initialization complete. Total candles: {self.get_candle_count()}")

    async def fill_gaps(self):
        """Fill missing candles from latest DB time to now"""
        latest_db_time = self.get_latest_candle_time()

        if latest_db_time is None:
            logger.info("No data in DB, skipping gap fill")
            return

        current_ms = int(time.time() * 1000)
        current_floored = self.floor_to_1m(current_ms)

        # Calculate time difference
        time_diff_ms = current_floored - latest_db_time
        time_diff_hours = time_diff_ms / (1000 * 60 * 60)

        if time_diff_hours < 0.02:  # Less than ~1 minute
            logger.info("No gaps to fill")
            return

        # Fetch recent data to fill gaps
        # Use appropriate period based on gap size
        if time_diff_hours <= 24:
            period = "1d"
        elif time_diff_hours <= 120:  # 5 days
            period = "5d"
        else:
            period = "7d"

        logger.info(f"Gap detected: {time_diff_hours:.1f} hours. Fetching {period} of data...")
        candles = self.fetch_history(period=period, interval=self.INTERVAL)

        if candles:
            # Filter to only candles after latest_db_time
            new_candles = [c for c in candles if c['open_time'] > latest_db_time]

            if new_candles:
                logger.info(f"Filling {len(new_candles)} missing candles")
                self.upsert_candles_batch(new_candles)
            else:
                logger.info("No new candles found in fetched data")

    def get_recent_candles(self, limit: int = 100) -> List[Dict]:
        """Get recent candles from database (volume set to 0 for XAU)"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_1m
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
                    "volume": 0  # XAU volume not meaningful, set to 0
                })

            return list(reversed(candles))  # Return in chronological order

    def get_current_price(self) -> Optional[float]:
        """Get current XAU price from latest candle"""
        candles = self.get_recent_candles(1)
        if candles:
            return candles[0]["close"]
        return None

    def aggregate_to_3m(self, start_time_ms: Optional[int] = None, limit: Optional[int] = None):
        """
        Aggregate 1-minute candles to 3-minute candles

        Args:
            start_time_ms: Start time in milliseconds (if None, aggregate all)
            limit: Maximum number of 3m candles to generate (if None, no limit)
        """
        with sqlite3.connect(self.db_path) as conn:
            # Get 1-minute candles
            if start_time_ms:
                cursor = conn.execute("""
                    SELECT open_time, open, high, low, close, volume
                    FROM xau_candles_1m
                    WHERE open_time >= ?
                    ORDER BY open_time ASC
                """, (start_time_ms,))
            else:
                cursor = conn.execute("""
                    SELECT open_time, open, high, low, close, volume
                    FROM xau_candles_1m
                    ORDER BY open_time ASC
                """)

            # Convert to DataFrame for easier resampling
            rows = cursor.fetchall()
            if not rows:
                logger.info("No 1m candles to aggregate")
                return

            df = pd.DataFrame(rows, columns=['open_time', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['open_time'], unit='ms')
            df.set_index('timestamp', inplace=True)

            # Resample to 3-minute intervals
            # OHLC aggregation: first open, max high, min low, last close, sum volume
            resampled = df.resample('3min').agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            }).dropna()

            # Convert back to list of dicts
            candles_3m = []
            for timestamp, row in resampled.iterrows():
                open_time_ms = int(timestamp.timestamp() * 1000)
                open_time_floored = self.floor_to_3m(open_time_ms)

                candles_3m.append({
                    'open_time': open_time_floored,
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'close': float(row['close']),
                    'volume': float(row['volume'])
                })

            # Apply limit if specified
            if limit and len(candles_3m) > limit:
                candles_3m = candles_3m[-limit:]

            # Batch insert into xau_candles_3m
            if candles_3m:
                conn.executemany("""
                    INSERT OR REPLACE INTO xau_candles_3m
                    (open_time, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, [(
                    c['open_time'],
                    c['open'],
                    c['high'],
                    c['low'],
                    c['close'],
                    c['volume']
                ) for c in candles_3m])

                logger.info(f"Aggregated {len(candles_3m)} 3-minute candles")

    def aggregate_to_5m(self, start_time_ms: Optional[int] = None, limit: Optional[int] = None):
        """
        Aggregate 1-minute candles to 5-minute candles

        Args:
            start_time_ms: Start time in milliseconds (if None, aggregate all)
            limit: Maximum number of 5m candles to generate (if None, no limit)
        """
        with sqlite3.connect(self.db_path) as conn:
            # Get 1-minute candles
            if start_time_ms:
                cursor = conn.execute("""
                    SELECT open_time, open, high, low, close, volume
                    FROM xau_candles_1m
                    WHERE open_time >= ?
                    ORDER BY open_time ASC
                """, (start_time_ms,))
            else:
                cursor = conn.execute("""
                    SELECT open_time, open, high, low, close, volume
                    FROM xau_candles_1m
                    ORDER BY open_time ASC
                """)

            # Convert to DataFrame for easier resampling
            rows = cursor.fetchall()
            if not rows:
                logger.info("No 1m candles to aggregate")
                return

            df = pd.DataFrame(rows, columns=['open_time', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['open_time'], unit='ms')
            df.set_index('timestamp', inplace=True)

            # Resample to 5-minute intervals
            # OHLC aggregation: first open, max high, min low, last close, sum volume
            resampled = df.resample('5min').agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            }).dropna()

            # Convert back to list of dicts
            candles_5m = []
            for timestamp, row in resampled.iterrows():
                open_time_ms = int(timestamp.timestamp() * 1000)
                open_time_floored = self.floor_to_5m(open_time_ms)

                candles_5m.append({
                    'open_time': open_time_floored,
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'close': float(row['close']),
                    'volume': float(row['volume'])
                })

            # Apply limit if specified
            if limit and len(candles_5m) > limit:
                candles_5m = candles_5m[-limit:]

            # Batch insert into xau_candles_5m
            if candles_5m:
                conn.executemany("""
                    INSERT OR REPLACE INTO xau_candles_5m
                    (open_time, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, [(
                    c['open_time'],
                    c['open'],
                    c['high'],
                    c['low'],
                    c['close'],
                    c['volume']
                ) for c in candles_5m])

                logger.info(f"Aggregated {len(candles_5m)} 5-minute candles")

    def get_recent_candles_3m(self, limit: int = 100) -> List[Dict]:
        """Get recent 3-minute candles from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_3m
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
                    "volume": 0  # XAU volume not meaningful
                })

            return list(reversed(candles))  # Return in chronological order

    def get_recent_candles_5m(self, limit: int = 100) -> List[Dict]:
        """Get recent 5-minute candles from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume
                FROM xau_candles_5m
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
                    "volume": 0  # XAU volume not meaningful
                })

            return list(reversed(candles))  # Return in chronological order


class XAUDataManager:
    """Manages XAU data fetching and WebSocket broadcasting"""

    def __init__(self):
        self.fetcher = YFinanceXAUDataFetcher()
        self.is_running = False
        self.update_callback = None
        self._task = None

    async def initialize(self, days_back: int = 7):
        """Initialize with historical data"""
        logger.info("Initializing XAU Data Manager...")
        await self.fetcher.initialize_with_history(days_back)

        candles = self.fetcher.get_recent_candles(limit=100)
        logger.info(f"Loaded {len(candles)} recent candles")

        return candles

    async def start_polling(self, update_callback: Callable):
        """Start polling for new data every 60 seconds"""
        self.update_callback = update_callback
        self.is_running = True

        logger.info("Starting XAU data polling (60s interval)...")

        while self.is_running:
            try:
                # Fetch latest candle
                latest_candle = self.fetcher.fetch_latest()

                if latest_candle:
                    # Store in database
                    self.fetcher.upsert_candle(latest_candle)

                    # Notify callback
                    if self.update_callback:
                        try:
                            await self.update_callback(latest_candle)
                        except Exception as e:
                            logger.error(f"Error in update callback: {e}")

                    logger.info(f"Updated XAU price: ${latest_candle['close']:.2f}")

                # Wait 60 seconds before next fetch
                await asyncio.sleep(60)

            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(60)  # Continue polling despite errors

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

        logger.info("XAU Data Manager stopped")


# Testing function
async def test_xau_data_fetch():
    """Test function to verify XAU data fetching"""
    fetcher = YFinanceXAUDataFetcher()

    print("=" * 60)
    print("Testing XAU Data Fetcher")
    print("=" * 60)

    # Test 1: Fetch history
    print("\n1. Fetching 1 day of history...")
    candles = fetcher.fetch_history(period="1d", interval="1m")
    print(f"   Fetched {len(candles)} candles")

    if candles:
        latest = candles[-1]
        print(f"   Latest: {datetime.fromtimestamp(latest['timestamp'])} - ${latest['close']:.2f}")

    # Test 2: Initialize database
    print("\n2. Initializing database...")
    await fetcher.initialize_with_history(days_back=2)

    # Test 3: Get statistics
    print("\n3. Database statistics:")
    total_candles = fetcher.get_candle_count()
    latest_time = fetcher.get_latest_candle_time()
    print(f"   Total candles: {total_candles}")
    if latest_time:
        print(f"   Latest candle: {datetime.fromtimestamp(latest_time/1000)}")
        print(f"   Current price: ${fetcher.get_current_price():.2f}")

    # Test 4: Fetch latest
    print("\n4. Fetching latest candle...")
    latest = fetcher.fetch_latest()
    if latest:
        print(f"   Time: {datetime.fromtimestamp(latest['timestamp'])}")
        print(f"   Price: ${latest['close']:.2f}")
        print(f"   Volume: {latest['volume']:.0f}")

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    # Run test
    asyncio.run(test_xau_data_fetch())
