import asyncio
import aiohttp
import websockets
import json
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Callable, Tuple
import logging
import time
import os
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BinanceETHDataFetcher:
    """
    Robust ETH/USDT data fetcher with gap-filling and continuity guarantees.
    
    Key features:
    - Only stores closed candles (no incomplete data)
    - Uses open_time as PRIMARY KEY for idempotency
    - Automatic gap-filling on startup and reconnection
    - Strict time sequence enforcement
    """
    
    BASE_URL = "https://api.binance.com"
    WS_URL = "wss://stream.binance.com:9443/ws"
    INTERVAL_MS = 180000  # 3 minutes in milliseconds
    
    def __init__(self, db_path: str = "shopback_data.db"):
        self.db_path = db_path
        self.ws_connection = None
        self.candle_callback = None
        self.last_open_time = None
        
        # Load API credentials (optional)
        load_dotenv()
        self.api_key = os.getenv('BINANCE_API_KEY')
        self.secret_key = os.getenv('BINANCE_SECRET_KEY')
        
        if self.api_key:
            logger.info("✓ Binance API key loaded - higher rate limits available")
        else:
            logger.info("ℹ No API key - using public endpoints (lower rate limits)")
            
        self.init_database()
        
    def init_database(self):
        """Initialize database tables with open_time as PRIMARY KEY"""
        with sqlite3.connect(self.db_path) as conn:
            # Drop old table if exists (migration)
            conn.execute("DROP TABLE IF EXISTS eth_candles_3m_old")
            
            # Rename existing table if needed
            cursor = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='eth_candles_3m'
            """)
            if cursor.fetchone():
                # Check if we need to migrate
                cursor = conn.execute("PRAGMA table_info(eth_candles_3m)")
                columns = [col[1] for col in cursor.fetchall()]
                if 'open_time' not in columns:
                    logger.info("Migrating eth_candles_3m table to new schema...")
                    conn.execute("ALTER TABLE eth_candles_3m RENAME TO eth_candles_3m_old")
            
            # Create new table with open_time as PRIMARY KEY
            conn.execute("""
                CREATE TABLE IF NOT EXISTS eth_candles_3m (
                    open_time INTEGER PRIMARY KEY,
                    open REAL,
                    high REAL,
                    low REAL,
                    close REAL,
                    volume REAL,
                    trades_count INTEGER,
                    quote_volume REAL,
                    is_final INTEGER DEFAULT 1
                )
            """)
            
            # Create index for faster queries
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_eth_candles_open_time 
                ON eth_candles_3m(open_time DESC)
            """)
            
            # Migrate data if old table exists
            cursor = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='eth_candles_3m_old'
            """)
            if cursor.fetchone():
                logger.info("Migrating data from old table...")
                conn.execute("""
                    INSERT OR IGNORE INTO eth_candles_3m 
                    (open_time, open, high, low, close, volume, trades_count, quote_volume)
                    SELECT 
                        timestamp * 1000 as open_time,  -- Convert to milliseconds
                        open, high, low, close, volume, trades_count, quote_volume
                    FROM eth_candles_3m_old
                """)
                conn.execute("DROP TABLE eth_candles_3m_old")
                logger.info("Migration completed")
            
            # Keep predictions table as is
            conn.execute("""
                CREATE TABLE IF NOT EXISTS eth_predictions (
                    timestamp INTEGER,
                    horizon_minutes INTEGER,
                    y_hat REAL,
                    pi68_lo REAL,
                    pi68_hi REAL,
                    pi95_lo REAL,
                    pi95_hi REAL,
                    PRIMARY KEY (timestamp, horizon_minutes)
                )
            """)
    
    def floor_to_3m(self, timestamp_ms: int) -> int:
        """Floor timestamp to nearest 3-minute interval"""
        return (timestamp_ms // self.INTERVAL_MS) * self.INTERVAL_MS
    
    def get_api_headers(self) -> Dict[str, str]:
        """Get API headers (includes API key if available)"""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ETH-Kalman-Predictor/1.0'
        }
        
        # Add API key if available (for higher rate limits)
        if self.api_key:
            headers['X-MBX-APIKEY'] = self.api_key
            
        return headers
    
    def get_rate_limit_info(self) -> Dict[str, int]:
        """Get current rate limits based on API key availability"""
        if self.api_key:
            return {
                "requests_per_minute": 6000,
                "orders_per_second": 100,
                "orders_per_day": 200000,
                "type": "authenticated"
            }
        else:
            return {
                "requests_per_minute": 1200,
                "requests_per_second": 20,
                "type": "public"
            }
    
    def get_latest_candle_time(self) -> Optional[int]:
        """Get the latest open_time from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT MAX(open_time) FROM eth_candles_3m
            """)
            result = cursor.fetchone()
            return result[0] if result and result[0] else None
    
    def get_candle_count(self) -> int:
        """Get total number of candles in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM eth_candles_3m")
            return cursor.fetchone()[0]
    
    def calculate_missing_intervals(self, start_ms: int, end_ms: int) -> List[int]:
        """Calculate all missing 3-minute intervals between start and end"""
        missing = []
        current = self.floor_to_3m(start_ms)
        end_floored = self.floor_to_3m(end_ms)
        
        while current < end_floored:
            missing.append(current)
            current += self.INTERVAL_MS
            
        return missing
    
    def upsert_candle(self, candle: Dict):
        """UPSERT candle using open_time as key (idempotent operation)"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO eth_candles_3m 
                (open_time, open, high, low, close, volume, trades_count, quote_volume, is_final)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                candle['open_time'],
                candle['open'],
                candle['high'],
                candle['low'],
                candle['close'],
                candle['volume'],
                candle.get('trades_count', 0),
                candle.get('quote_volume', 0),
                1  # Always 1 since we only store closed candles
            ))
    
    def upsert_candles_batch(self, candles: List[Dict]):
        """Batch UPSERT for efficiency"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executemany("""
                INSERT OR REPLACE INTO eth_candles_3m 
                (open_time, open, high, low, close, volume, trades_count, quote_volume, is_final)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [(
                c['open_time'],
                c['open'],
                c['high'],
                c['low'],
                c['close'],
                c['volume'],
                c.get('trades_count', 0),
                c.get('quote_volume', 0),
                1
            ) for c in candles])
    
    async def fetch_candles_range(self, start_time: int, end_time: int) -> List[Dict]:
        """Fetch candles for a specific time range from Binance REST API"""
        candles = []
        
        async with aiohttp.ClientSession() as session:
            current_start = start_time
            
            while current_start < end_time:
                params = {
                    "symbol": "ETHUSDT",
                    "interval": "3m",
                    "startTime": current_start,
                    "endTime": end_time,
                    "limit": 1000  # Max limit per request
                }
                
                url = f"{self.BASE_URL}/api/v3/klines"
                
                try:
                    async with session.get(url, params=params, headers=self.get_api_headers()) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            for candle_data in data:
                                # Only add if it's a closed candle (not the current incomplete one)
                                candle_open_time = candle_data[0]
                                current_time_ms = int(time.time() * 1000)
                                
                                # Check if this candle is complete (at least 3 minutes old)
                                if candle_open_time + self.INTERVAL_MS <= current_time_ms:
                                    candles.append({
                                        "open_time": candle_open_time,
                                        "open": float(candle_data[1]),
                                        "high": float(candle_data[2]),
                                        "low": float(candle_data[3]),
                                        "close": float(candle_data[4]),
                                        "volume": float(candle_data[5]),
                                        "close_time": candle_data[6],
                                        "quote_volume": float(candle_data[7]),
                                        "trades_count": int(candle_data[8])
                                    })
                            
                            if len(data) < 1000:
                                break  # No more data
                                
                            # Update start time for next batch
                            if data:
                                current_start = data[-1][0] + self.INTERVAL_MS
                            else:
                                break
                            
                            # Small delay to avoid rate limiting
                            await asyncio.sleep(0.1)
                        else:
                            logger.error(f"Failed to fetch candles: {response.status}")
                            break
                            
                except Exception as e:
                    logger.error(f"Error fetching candles: {e}")
                    break
                    
        return candles
    
    async def fill_gaps(self, start_open_time: Optional[int] = None, end_open_time: Optional[int] = None):
        """Fill missing candles between start and end times"""
        
        # If no start time, get from database
        if start_open_time is None:
            latest_db_time = self.get_latest_candle_time()
            if latest_db_time is None:
                logger.info("No existing data, skipping gap fill")
                return
            start_open_time = latest_db_time + self.INTERVAL_MS
        
        # If no end time, use current time (floored to last complete candle)
        if end_open_time is None:
            current_ms = int(time.time() * 1000)
            end_open_time = self.floor_to_3m(current_ms)
        
        # Make sure we're not trying to fill future candles
        current_ms = int(time.time() * 1000)
        max_allowed = self.floor_to_3m(current_ms)
        end_open_time = min(end_open_time, max_allowed)
        
        if start_open_time >= end_open_time:
            logger.info("No gaps to fill")
            return
        
        # Calculate missing intervals
        missing_intervals = self.calculate_missing_intervals(start_open_time, end_open_time)
        
        if not missing_intervals:
            logger.info("No missing intervals found")
            return
        
        logger.info(f"Filling {len(missing_intervals)} missing candles from {datetime.fromtimestamp(start_open_time/1000)} to {datetime.fromtimestamp(end_open_time/1000)}")
        
        # Fetch missing candles
        candles = await self.fetch_candles_range(start_open_time, end_open_time)
        
        if candles:
            logger.info(f"Fetched {len(candles)} candles to fill gaps")
            self.upsert_candles_batch(candles)
            
            # Update last_open_time
            if candles:
                self.last_open_time = max(c['open_time'] for c in candles)
        else:
            logger.warning("No candles fetched for gap filling")
    
    async def initialize_with_gap_fill(self, days_back: int = 7):
        """Initialize database with historical data and fill any gaps"""
        
        logger.info("Starting initialization with gap fill...")
        
        # Get latest candle time from database
        latest_db_time = self.get_latest_candle_time()
        current_ms = int(time.time() * 1000)
        current_floored = self.floor_to_3m(current_ms)
        
        if latest_db_time is None:
            # First run: fetch initial history
            logger.info(f"No existing data. Fetching {days_back} days of history...")
            start_time = current_ms - (days_back * 24 * 60 * 60 * 1000)
            candles = await self.fetch_candles_range(start_time, current_floored)
            
            if candles:
                logger.info(f"Storing {len(candles)} initial candles")
                self.upsert_candles_batch(candles)
                self.last_open_time = max(c['open_time'] for c in candles)
            
        else:
            # Existing data: check for gaps
            logger.info(f"Latest candle in DB: {datetime.fromtimestamp(latest_db_time/1000)}")
            
            # Fill any gaps from latest to current
            await self.fill_gaps(latest_db_time + self.INTERVAL_MS, current_floored)
            self.last_open_time = self.get_latest_candle_time()
        
        logger.info(f"Initialization complete. Total candles: {self.get_candle_count()}")
    
    async def start_websocket_stream(self, on_candle_callback: Callable):
        """Start WebSocket stream for real-time 3-minute candles"""
        self.candle_callback = on_candle_callback
        stream_url = f"{self.WS_URL}/ethusdt@kline_3m"
        max_retries = 5
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"Connecting to Binance WebSocket (attempt {retry_count + 1}/{max_retries})...")
                async with websockets.connect(stream_url, ping_interval=20, ping_timeout=10) as ws:
                    self.ws_connection = ws
                    logger.info("Connected to Binance WebSocket")
                    retry_count = 0  # Reset retry count on successful connection
                    
                    # On connection, fill any gaps
                    try:
                        await self.fill_gaps()
                    except Exception as e:
                        logger.error(f"Error filling gaps on connection: {e}")
                    
                    async for message in ws:
                        try:
                            data = json.loads(message)
                            
                            if "k" in data:
                                kline = data["k"]
                                
                                # IMPORTANT: Only process closed candles
                                if kline["x"]:  # Candle is closed
                                    open_time = kline["t"]
                                    
                                    # Check for sequence gaps
                                    if self.last_open_time and open_time != self.last_open_time + self.INTERVAL_MS:
                                        logger.warning(f"Gap detected! Expected {self.last_open_time + self.INTERVAL_MS}, got {open_time}")
                                        # Fill the gap asynchronously without blocking
                                        asyncio.create_task(self.fill_gaps(self.last_open_time + self.INTERVAL_MS, open_time))
                                    
                                    candle = {
                                        "open_time": open_time,
                                        "open": float(kline["o"]),
                                        "high": float(kline["h"]),
                                        "low": float(kline["l"]),
                                        "close": float(kline["c"]),
                                        "volume": float(kline["v"]),
                                        "trades_count": int(kline["n"]),
                                        "quote_volume": float(kline["q"])
                                    }
                                    
                                    # Store in database (idempotent)
                                    self.upsert_candle(candle)
                                    self.last_open_time = open_time
                                    
                                    # Callback for model update
                                    if self.candle_callback:
                                        try:
                                            # Convert to format expected by model (timestamp in seconds)
                                            candle_for_model = candle.copy()
                                            candle_for_model["timestamp"] = open_time // 1000
                                            await self.candle_callback(candle_for_model)
                                        except Exception as cb_error:
                                            logger.error(f"Error in candle callback: {cb_error}")
                                        
                                    logger.info(f"Stored closed 3m candle: {datetime.fromtimestamp(open_time/1000)} - Close: ${candle['close']:.2f}")
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse WebSocket message: {e}")
                        except Exception as e:
                            logger.error(f"Error processing WebSocket message: {e}")
                                
            except websockets.exceptions.ConnectionClosed:
                logger.warning("WebSocket connection closed")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = min(5 * retry_count, 30)  # Exponential backoff, max 30 seconds
                    logger.info(f"Reconnecting in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    # Try to fill gaps after connection closed
                    try:
                        await self.fill_gaps()
                    except Exception as e:
                        logger.error(f"Error filling gaps after disconnect: {e}")
                else:
                    logger.error("Max reconnection attempts reached. Stopping WebSocket stream.")
                    break
                    
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = min(5 * retry_count, 30)
                    logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("Max retry attempts reached. Stopping WebSocket stream.")
                    break
        
        logger.error("WebSocket stream stopped due to repeated failures")
    
    async def stop_websocket_stream(self):
        """Stop WebSocket stream"""
        if self.ws_connection:
            await self.ws_connection.close()
            self.ws_connection = None
    
    def get_recent_candles(self, limit: int = 100) -> List[Dict]:
        """Get recent candles from database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT open_time, open, high, low, close, volume, trades_count
                FROM eth_candles_3m
                ORDER BY open_time DESC
                LIMIT ?
            """, (limit,))
            
            candles = []
            for row in cursor.fetchall():
                candles.append({
                    "timestamp": row[0] // 1000,  # Convert to seconds for model compatibility
                    "open_time": row[0],
                    "open": row[1],
                    "high": row[2],
                    "low": row[3],
                    "close": row[4],
                    "volume": row[5],
                    "trades_count": row[6]
                })
                
            return list(reversed(candles))  # Return in chronological order
    
    def get_current_price(self) -> Optional[float]:
        """Get current ETH price from latest candle"""
        candles = self.get_recent_candles(1)
        if candles:
            return candles[0]["close"]
        return None
    
    def check_data_continuity(self) -> Tuple[bool, List[Tuple[int, int]]]:
        """
        Check for gaps in the data.
        Returns: (is_continuous, list_of_gaps)
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT open_time FROM eth_candles_3m
                ORDER BY open_time ASC
            """)
            
            times = [row[0] for row in cursor.fetchall()]
            
            if len(times) < 2:
                return True, []
            
            gaps = []
            for i in range(1, len(times)):
                expected = times[i-1] + self.INTERVAL_MS
                if times[i] != expected:
                    gaps.append((times[i-1], times[i]))
            
            return len(gaps) == 0, gaps
    
    async def test_api_connection(self) -> Dict[str, any]:
        """Test API connection and return status"""
        try:
            # Test with a simple server time request
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/api/v3/time"
                async with session.get(url, headers=self.get_api_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        rate_limits = self.get_rate_limit_info()
                        return {
                            "status": "success",
                            "server_time": data.get("serverTime"),
                            "api_key_used": bool(self.api_key),
                            "rate_limits": rate_limits,
                            "response_headers": dict(response.headers)
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"HTTP {response.status}",
                            "api_key_used": bool(self.api_key)
                        }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "api_key_used": bool(self.api_key)
            }
    

class BinanceDataManager:
    """Manages Binance data fetching and model updates with robust continuity"""
    
    def __init__(self, model_manager=None):
        self.fetcher = BinanceETHDataFetcher()
        self.model_manager = model_manager
        self.is_running = False
        
    async def initialize(self, days_back: int = 7):
        """Initialize with historical data and gap filling"""
        logger.info("Initializing Binance Data Manager...")
        
        # Initialize with gap fill
        await self.fetcher.initialize_with_gap_fill(days_back)
        
        # Get all candles for model initialization
        candles = self.fetcher.get_recent_candles(limit=3360)  # 7 days worth
        
        if self.model_manager and candles:
            logger.info(f"Initializing model with {len(candles)} candles")
            self.model_manager.initialize_from_candles(candles)
            
        # Check data continuity
        is_continuous, gaps = self.fetcher.check_data_continuity()
        if is_continuous:
            logger.info("Data continuity check: ✓ No gaps found")
        else:
            logger.warning(f"Data continuity check: ✗ Found {len(gaps)} gaps")
            for gap_start, gap_end in gaps[:5]:  # Show first 5 gaps
                logger.warning(f"  Gap: {datetime.fromtimestamp(gap_start/1000)} to {datetime.fromtimestamp(gap_end/1000)}")
            
        return candles
        
    async def on_new_candle(self, candle: Dict):
        """Handle new candle from WebSocket"""
        if self.model_manager:
            predictions = self.model_manager.update_with_new_candle(candle)
            
            # Store predictions in database
            if predictions and "horizons" in predictions:
                self.store_predictions(candle["timestamp"], predictions["horizons"])
                
            return predictions
            
    def store_predictions(self, timestamp: int, horizons: Dict):
        """Store predictions in database"""
        with sqlite3.connect(self.fetcher.db_path) as conn:
            for horizon_str, pred in horizons.items():
                horizon_minutes = int(horizon_str.replace("m", ""))
                conn.execute("""
                    INSERT OR REPLACE INTO eth_predictions
                    (timestamp, horizon_minutes, y_hat, pi68_lo, pi68_hi, pi95_lo, pi95_hi)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    timestamp,
                    horizon_minutes,
                    pred["y_hat"],
                    pred["pi68"][0],
                    pred["pi68"][1],
                    pred["pi95"][0],
                    pred["pi95"][1]
                ))
                
    async def start(self):
        """Start data manager with WebSocket stream"""
        self.is_running = True
        
        # Initialize with historical data and gap fill
        await self.initialize()
        
        # Start WebSocket stream
        await self.fetcher.start_websocket_stream(self.on_new_candle)
        
    async def stop(self):
        """Stop data manager"""
        self.is_running = False
        await self.fetcher.stop_websocket_stream()
        

# Testing function
async def test_robust_data_continuity():
    """Test function to verify robust data fetching and gap filling"""
    fetcher = BinanceETHDataFetcher()
    
    print("=" * 60)
    print("Testing Robust Data Continuity System")
    print("=" * 60)
    
    # Test API connection first
    print("\n0. Testing API connection...")
    api_status = await fetcher.test_api_connection()
    if api_status["status"] == "success":
        api_type = "🔑 Authenticated" if api_status["api_key_used"] else "🌐 Public"
        print(f"✓ API connection successful - {api_type}")
        print(f"  Rate limits: {api_status['rate_limits']['requests_per_minute']}/min")
        
        # Check for rate limit headers
        headers = api_status.get("response_headers", {})
        if 'X-MBX-USED-WEIGHT-1M' in headers:
            print(f"  Current usage: {headers['X-MBX-USED-WEIGHT-1M']}/min")
    else:
        print(f"✗ API connection failed: {api_status['error']}")
        return  # Don't continue if API is not working
    
    # Test 1: Initialize with gap fill
    print("\n1. Initializing with gap fill...")
    await fetcher.initialize_with_gap_fill(days_back=1)  # Just 1 day for testing
    
    # Test 2: Check data continuity
    print("\n2. Checking data continuity...")
    is_continuous, gaps = fetcher.check_data_continuity()
    if is_continuous:
        print("✓ Data is continuous, no gaps found")
    else:
        print(f"✗ Found {len(gaps)} gaps:")
        for gap_start, gap_end in gaps[:5]:
            print(f"  Gap: {datetime.fromtimestamp(gap_start/1000)} to {datetime.fromtimestamp(gap_end/1000)}")
    
    # Test 3: Get statistics
    print("\n3. Database statistics:")
    total_candles = fetcher.get_candle_count()
    latest_time = fetcher.get_latest_candle_time()
    print(f"  Total candles: {total_candles}")
    if latest_time:
        print(f"  Latest candle: {datetime.fromtimestamp(latest_time/1000)}")
        print(f"  Latest price: ${fetcher.get_current_price():.2f}")
    
    # Test 4: Simulate gap and recovery
    print("\n4. Simulating gap and recovery...")
    if latest_time:
        # Simulate a 30-minute gap (10 candles)
        simulated_gap_start = latest_time + fetcher.INTERVAL_MS
        simulated_gap_end = latest_time + (11 * fetcher.INTERVAL_MS)
        
        print(f"  Simulating gap from {datetime.fromtimestamp(simulated_gap_start/1000)}")
        print(f"  Filling gap...")
        await fetcher.fill_gaps(simulated_gap_start, simulated_gap_end)
        
        new_count = fetcher.get_candle_count()
        print(f"  Candles after gap fill: {new_count} (added {new_count - total_candles})")
    
    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    # Run test
    asyncio.run(test_robust_data_continuity())