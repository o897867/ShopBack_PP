#!/usr/bin/env python3
"""
Weight-KLine Matching Engine
体重K线匹配引擎 - 将体重变化曲线与金融K线进行相似度匹配
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
import json
from scipy import signal
from scipy.spatial.distance import cosine
from fastdtw import fastdtw
import yfinance as yf

logger = logging.getLogger(__name__)


class WeightKlineMatcher:
    """体重K线匹配引擎"""

    def __init__(self):
        self.symbols = {
            'BTC': 'BTC-USD',
            'ETH': 'ETH-USD',
            'GOLD': 'GC=F',
            'SPY': 'SPY',
            'NASDAQ': '^IXIC',
            'EUR': 'EURUSD=X'
        }
        self.timeframe_map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '60m',
            '1d': '1d'
        }
        self.cache = {}  # Cache for market data

    def find_best_match(
        self,
        weight_data: List[Dict],
        target_symbol: str = "AUTO",
        timeframe: str = "1h"
    ) -> Optional[Dict]:
        """
        Find best matching K-line pattern for weight data

        Args:
            weight_data: List of weight logs
            target_symbol: Symbol to match or "AUTO" for best match
            timeframe: Timeframe for K-line data

        Returns:
            Match result dictionary
        """
        try:
            # Convert weight data to percentage change series
            weight_series = self._prepare_weight_series(weight_data)

            if len(weight_series) < 7:
                logger.warning("Insufficient weight data for matching")
                return None

            # Determine symbols to check
            symbols_to_check = (
                list(self.symbols.keys()) if target_symbol == "AUTO"
                else [target_symbol]
            )

            best_match = None
            best_score = 0

            for symbol in symbols_to_check:
                # Get market data
                market_data = self._get_market_data(symbol, len(weight_series), timeframe)

                if market_data is None:
                    continue

                # Find best matching window
                match_result = self._find_best_window(
                    weight_series,
                    market_data,
                    symbol
                )

                if match_result and match_result['similarity_score'] > best_score:
                    best_score = match_result['similarity_score']
                    best_match = match_result

            return best_match

        except Exception as e:
            logger.error(f"Error in find_best_match: {e}")
            return self._get_mock_match()

    def _prepare_weight_series(self, weight_data: List[Dict]) -> np.ndarray:
        """Convert weight logs to percentage change series"""
        weights = [log['weight_kg'] for log in weight_data]

        # Calculate percentage changes
        pct_changes = []
        for i in range(1, len(weights)):
            if weights[i-1] > 0:
                pct_change = ((weights[i] - weights[i-1]) / weights[i-1]) * 100
                # Invert for weight loss (negative change is positive progress)
                pct_changes.append(-pct_change)
            else:
                pct_changes.append(0)

        # Normalize the series
        series = np.array(pct_changes)
        if len(series) > 0 and np.std(series) > 0:
            series = (series - np.mean(series)) / np.std(series)

        return series

    def _get_market_data(
        self,
        symbol: str,
        length: int,
        timeframe: str
    ) -> Optional[pd.DataFrame]:
        """Fetch or retrieve cached market data"""
        cache_key = f"{symbol}_{timeframe}_{length}"

        # Check cache
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if (datetime.now() - cached_time).seconds < 3600:  # 1 hour cache
                return cached_data

        try:
            # For minute timeframes, we need recent intraday data
            if timeframe in ['1m', '5m', '15m', '30m', '1h']:
                # Use a longer period to ensure we have enough data
                period = "1mo" if length < 30 else "3mo"
                interval = self.timeframe_map.get(timeframe, '1h')
            else:
                period = "1y"
                interval = "1d"

            # Fetch data using yfinance
            ticker = yf.Ticker(self.symbols.get(symbol, symbol))
            df = ticker.history(period=period, interval=interval)

            if df.empty:
                logger.warning(f"No data retrieved for {symbol}")
                return None

            # Cache the data
            self.cache[cache_key] = (df, datetime.now())

            return df

        except Exception as e:
            logger.error(f"Error fetching market data for {symbol}: {e}")
            return None

    def _find_best_window(
        self,
        weight_series: np.ndarray,
        market_data: pd.DataFrame,
        symbol: str
    ) -> Optional[Dict]:
        """Find best matching window in market data"""
        try:
            # Calculate market percentage changes
            closes = market_data['Close'].values
            market_changes = np.diff(closes) / closes[:-1] * 100

            # Normalize market data
            if len(market_changes) > 0 and np.std(market_changes) > 0:
                market_changes = (market_changes - np.mean(market_changes)) / np.std(market_changes)

            window_size = len(weight_series)
            best_similarity = 0
            best_window_start = 0
            best_method = ""

            # Sliding window search
            for i in range(len(market_changes) - window_size + 1):
                window = market_changes[i:i + window_size]

                # Method 1: Cosine similarity
                cos_sim = 1 - cosine(weight_series, window) if len(weight_series) == len(window) else 0
                cos_sim = max(0, cos_sim)  # Ensure non-negative

                # Method 2: Correlation coefficient
                if len(weight_series) > 1:
                    corr = np.corrcoef(weight_series, window)[0, 1]
                    corr_sim = (corr + 1) / 2  # Normalize to [0, 1]
                else:
                    corr_sim = 0

                # Method 3: DTW distance (expensive, use sparingly)
                if window_size <= 30:  # Only for small windows
                    try:
                        dtw_dist, _ = fastdtw(weight_series, window)
                        # Normalize DTW distance to similarity score
                        dtw_sim = 1 / (1 + dtw_dist / window_size)
                    except:
                        dtw_sim = 0
                else:
                    dtw_sim = 0

                # Combine similarities
                combined_sim = (cos_sim * 0.4 + corr_sim * 0.4 + dtw_sim * 0.2) * 100

                if combined_sim > best_similarity:
                    best_similarity = combined_sim
                    best_window_start = i
                    best_method = f"Cos:{cos_sim:.2f}, Corr:{corr_sim:.2f}, DTW:{dtw_sim:.2f}"

            if best_similarity < 30:  # Threshold for meaningful match
                return None

            # Calculate match details
            match_window = market_changes[best_window_start:best_window_start + window_size]
            market_return = ((closes[best_window_start + window_size] - closes[best_window_start]) /
                           closes[best_window_start] * 100)

            # Weight performance (already inverted in preparation)
            weight_perf = -sum(weight_series)  # Simplified calculation

            # Determine pattern type
            pattern = self._identify_pattern(match_window)

            # Get dates for the matched period
            dates = market_data.index[best_window_start:best_window_start + window_size + 1]
            start_date = dates[0].strftime('%Y-%m-%d')
            end_date = dates[-1].strftime('%Y-%m-%d')

            return {
                'symbol': symbol,
                'similarity_score': round(best_similarity, 1),
                'match_period_start': start_date,
                'match_period_end': end_date,
                'market_performance': round(market_return, 2),
                'weight_performance': round(weight_perf, 2),
                'matched_pattern': pattern,
                'match_method': best_method,
                'window_data': {
                    'weight': weight_series.tolist(),
                    'market': match_window.tolist()
                }
            }

        except Exception as e:
            logger.error(f"Error finding best window: {e}")
            return None

    def _identify_pattern(self, series: np.ndarray) -> str:
        """Identify the pattern type of the series"""
        if len(series) < 3:
            return "Unknown Pattern"

        # Calculate basic statistics
        mean_change = np.mean(series)
        std_change = np.std(series)
        total_change = np.sum(series)

        # Identify pattern
        if total_change > std_change * 2:
            if std_change < abs(mean_change) * 0.5:
                return "Strong Bull Run"
            else:
                return "Volatile Bull Market"
        elif total_change < -std_change * 2:
            if std_change < abs(mean_change) * 0.5:
                return "Bear Market Crash"
            else:
                return "Volatile Bear Market"
        elif std_change < 0.5:
            return "Consolidation Pattern"
        elif np.max(series) > std_change * 2 and np.min(series) < -std_change * 2:
            return "Pump and Dump Pattern"
        else:
            # Check for trend reversals
            first_half = series[:len(series)//2]
            second_half = series[len(series)//2:]

            if np.mean(first_half) < -0.5 and np.mean(second_half) > 0.5:
                return "V-Shape Recovery"
            elif np.mean(first_half) > 0.5 and np.mean(second_half) < -0.5:
                return "Inverse V Pattern"
            else:
                return "Sideways Choppy Market"

    def _get_mock_match(self) -> Dict:
        """Return mock match for testing"""
        patterns = [
            ("BTC", "2021 Bull Run", 92.3, 156.7, -4.2),
            ("ETH", "DeFi Summer Rally", 88.5, 89.3, -3.8),
            ("GOLD", "2020 Safe Haven Surge", 76.2, 23.4, -2.9),
            ("SPY", "Post-COVID Recovery", 81.7, 45.2, -3.5),
        ]

        import random
        pattern = random.choice(patterns)

        return {
            'symbol': pattern[0],
            'matched_pattern': pattern[1],
            'similarity_score': pattern[2],
            'market_performance': pattern[3],
            'weight_performance': pattern[4],
            'match_period_start': '2021-01-15',
            'match_period_end': '2021-02-15',
            'match_method': 'Mock Data',
            'window_data': {
                'weight': [random.uniform(-2, 2) for _ in range(30)],
                'market': [random.uniform(-3, 3) for _ in range(30)]
            }
        }

    def calculate_similarity_metrics(
        self,
        series1: np.ndarray,
        series2: np.ndarray
    ) -> Dict[str, float]:
        """Calculate multiple similarity metrics between two series"""
        metrics = {}

        try:
            # Ensure equal length
            min_len = min(len(series1), len(series2))
            s1 = series1[:min_len]
            s2 = series2[:min_len]

            # Correlation coefficient
            if len(s1) > 1:
                metrics['correlation'] = np.corrcoef(s1, s2)[0, 1]
            else:
                metrics['correlation'] = 0

            # Cosine similarity
            if np.linalg.norm(s1) > 0 and np.linalg.norm(s2) > 0:
                metrics['cosine'] = 1 - cosine(s1, s2)
            else:
                metrics['cosine'] = 0

            # Mean squared error
            metrics['mse'] = np.mean((s1 - s2) ** 2)

            # Dynamic time warping
            if len(s1) <= 50:  # Only for small series
                try:
                    dtw_dist, _ = fastdtw(s1, s2)
                    metrics['dtw_distance'] = dtw_dist
                except:
                    metrics['dtw_distance'] = float('inf')
            else:
                metrics['dtw_distance'] = float('inf')

        except Exception as e:
            logger.error(f"Error calculating similarity metrics: {e}")

        return metrics


class MarketDataCache:
    """Cache for market data to avoid repeated API calls"""

    def __init__(self, ttl_seconds: int = 3600):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[pd.DataFrame]:
        """Get cached data if not expired"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if (datetime.now() - timestamp).total_seconds() < self.ttl:
                return data
        return None

    def set(self, key: str, data: pd.DataFrame):
        """Store data in cache"""
        self.cache[key] = (data, datetime.now())

    def clear(self):
        """Clear all cached data"""
        self.cache.clear()


# Singleton instance
_matcher_instance = None


def get_matcher() -> WeightKlineMatcher:
    """Get singleton instance of matcher"""
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = WeightKlineMatcher()
    return _matcher_instance