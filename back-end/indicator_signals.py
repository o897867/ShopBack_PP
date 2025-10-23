"""
Technical Indicators Signal Detection Module
Counts signal occurrences without backtesting
"""

import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SignalDetector:
    """Detect and count trading signals from indicators"""

    @staticmethod
    def detect_macd_signals(macd_data: Dict, timestamps: List[int]) -> Dict:
        """
        Detect MACD crossover signals
        Returns: dictionary with buy/sell signal positions and timestamps
        """
        macd_line = macd_data.get('macd', [])
        signal_line = macd_data.get('signal', [])

        if not macd_line or not signal_line:
            return {'buy_signals': [], 'sell_signals': [], 'total_buy': 0, 'total_sell': 0}

        buy_signals = []
        sell_signals = []

        for i in range(1, len(macd_line)):
            if isinstance(macd_line[i], (list, np.ndarray)) or isinstance(signal_line[i], (list, np.ndarray)):
                continue
            if macd_line[i] is None or signal_line[i] is None or np.isnan(macd_line[i]) or np.isnan(signal_line[i]):
                continue
            if macd_line[i-1] is None or signal_line[i-1] is None or np.isnan(macd_line[i-1]) or np.isnan(signal_line[i-1]):
                continue

            # Buy signal: MACD crosses above signal
            if macd_line[i-1] <= signal_line[i-1] and macd_line[i] > signal_line[i]:
                buy_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'macd_value': macd_line[i],
                    'signal_value': signal_line[i]
                })

            # Sell signal: MACD crosses below signal
            elif macd_line[i-1] >= signal_line[i-1] and macd_line[i] < signal_line[i]:
                sell_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'macd_value': macd_line[i],
                    'signal_value': signal_line[i]
                })

        return {
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'total_buy': len(buy_signals),
            'total_sell': len(sell_signals)
        }

    @staticmethod
    def detect_sma_signals(prices: List[float], sma_values: List[float], timestamps: List[int]) -> Dict:
        """
        Detect price/SMA crossover signals
        """
        if not prices or not sma_values:
            return {'buy_signals': [], 'sell_signals': [], 'total_buy': 0, 'total_sell': 0}

        buy_signals = []
        sell_signals = []

        for i in range(1, min(len(prices), len(sma_values))):
            if sma_values[i] is None or sma_values[i-1] is None or np.isnan(sma_values[i]) or np.isnan(sma_values[i-1]):
                continue

            # Buy signal: Price crosses above SMA
            if prices[i-1] <= sma_values[i-1] and prices[i] > sma_values[i]:
                buy_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'price': prices[i],
                    'sma': sma_values[i]
                })

            # Sell signal: Price crosses below SMA
            elif prices[i-1] >= sma_values[i-1] and prices[i] < sma_values[i]:
                sell_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'price': prices[i],
                    'sma': sma_values[i]
                })

        return {
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'total_buy': len(buy_signals),
            'total_sell': len(sell_signals)
        }

    @staticmethod
    def detect_ema_signals(prices: List[float], ema_values: List[float], timestamps: List[int]) -> Dict:
        """
        Detect price/EMA crossover signals
        """
        # Same logic as SMA
        return SignalDetector.detect_sma_signals(prices, ema_values, timestamps)

    @staticmethod
    def detect_vwap_signals(prices: List[float], vwap_values: List[float],
                           volumes: List[float], timestamps: List[int]) -> Dict:
        """
        Detect VWAP reversal signals
        Price far from VWAP suggests reversal opportunity
        """
        if not prices or not vwap_values:
            return {'buy_signals': [], 'sell_signals': [], 'total_buy': 0, 'total_sell': 0}

        buy_signals = []
        sell_signals = []

        for i in range(1, min(len(prices), len(vwap_values))):
            if vwap_values[i] is None or np.isnan(vwap_values[i]):
                continue
            if vwap_values[i-1] is None or np.isnan(vwap_values[i-1]):
                continue

            deviation = (prices[i] - vwap_values[i]) / vwap_values[i]
            prev_deviation = (prices[i-1] - vwap_values[i-1]) / vwap_values[i-1] if vwap_values[i-1] else 0

            # Buy signal: Price bounces from below VWAP (oversold)
            if deviation < -0.003 and deviation > prev_deviation:  # 0.3% below and reversing
                buy_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'price': prices[i],
                    'vwap': vwap_values[i],
                    'deviation': deviation * 100  # percentage
                })

            # Sell signal: Price reverses from above VWAP (overbought)
            elif deviation > 0.003 and deviation < prev_deviation:  # 0.3% above and reversing
                sell_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'price': prices[i],
                    'vwap': vwap_values[i],
                    'deviation': deviation * 100
                })

        return {
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'total_buy': len(buy_signals),
            'total_sell': len(sell_signals)
        }

    @staticmethod
    def detect_rsi_signals(rsi_values: List[float], timestamps: List[int],
                          oversold: float = 30, overbought: float = 70) -> Dict:
        """
        Detect RSI overbought/oversold signals
        """
        if not rsi_values:
            return {'buy_signals': [], 'sell_signals': [], 'total_buy': 0, 'total_sell': 0}

        buy_signals = []
        sell_signals = []

        for i in range(1, len(rsi_values)):
            if rsi_values[i] is None or rsi_values[i-1] is None or np.isnan(rsi_values[i]) or np.isnan(rsi_values[i-1]):
                continue

            # Buy signal: RSI rises above oversold
            if rsi_values[i-1] <= oversold and rsi_values[i] > oversold:
                buy_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'rsi': rsi_values[i]
                })

            # Sell signal: RSI falls below overbought
            elif rsi_values[i-1] >= overbought and rsi_values[i] < overbought:
                sell_signals.append({
                    'index': i,
                    'timestamp': timestamps[i] if i < len(timestamps) else None,
                    'rsi': rsi_values[i]
                })

        return {
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'total_buy': len(buy_signals),
            'total_sell': len(sell_signals)
        }


def count_signals_in_period(candles: List[Dict], indicators: Dict, days: int = 7) -> Dict:
    """
    Count all indicator signals in the specified period

    Returns:
        Dictionary with signal counts for each indicator
    """
    if not candles:
        return {}

    # Calculate cutoff timestamp (days ago)
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(days=days)
    cutoff_timestamp = int(cutoff_time.timestamp() * 1000)

    # Extract data
    timestamps = [c.get('open_time', c.get('timestamp', 0) * 1000) for c in candles]
    prices = [c['close'] for c in candles]
    volumes = [c['volume'] for c in candles]

    detector = SignalDetector()
    results = {}

    # Detect MACD signals
    if 'macd' in indicators:
        macd_signals = detector.detect_macd_signals(indicators['macd'], timestamps)
        # Filter by time period
        macd_signals['buy_signals'] = [s for s in macd_signals['buy_signals']
                                       if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        macd_signals['sell_signals'] = [s for s in macd_signals['sell_signals']
                                        if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        macd_signals['total_buy'] = len(macd_signals['buy_signals'])
        macd_signals['total_sell'] = len(macd_signals['sell_signals'])
        results['MACD'] = macd_signals

    # Detect SMA14 signals
    if 'sma14' in indicators:
        sma_signals = detector.detect_sma_signals(prices, indicators['sma14'], timestamps)
        sma_signals['buy_signals'] = [s for s in sma_signals['buy_signals']
                                      if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        sma_signals['sell_signals'] = [s for s in sma_signals['sell_signals']
                                       if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        sma_signals['total_buy'] = len(sma_signals['buy_signals'])
        sma_signals['total_sell'] = len(sma_signals['sell_signals'])
        results['SMA14'] = sma_signals

    # Detect EMA20 signals
    if 'ema20' in indicators:
        ema_signals = detector.detect_ema_signals(prices, indicators['ema20'], timestamps)
        ema_signals['buy_signals'] = [s for s in ema_signals['buy_signals']
                                      if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        ema_signals['sell_signals'] = [s for s in ema_signals['sell_signals']
                                       if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        ema_signals['total_buy'] = len(ema_signals['buy_signals'])
        ema_signals['total_sell'] = len(ema_signals['sell_signals'])
        results['EMA20'] = ema_signals

    # Detect VWAP signals
    if 'vwap' in indicators:
        vwap_signals = detector.detect_vwap_signals(prices, indicators['vwap'], volumes, timestamps)
        vwap_signals['buy_signals'] = [s for s in vwap_signals['buy_signals']
                                       if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        vwap_signals['sell_signals'] = [s for s in vwap_signals['sell_signals']
                                        if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        vwap_signals['total_buy'] = len(vwap_signals['buy_signals'])
        vwap_signals['total_sell'] = len(vwap_signals['sell_signals'])
        results['VWAP'] = vwap_signals

    # Detect RSI signals
    if 'rsi' in indicators:
        rsi_signals = detector.detect_rsi_signals(indicators['rsi'], timestamps)
        rsi_signals['buy_signals'] = [s for s in rsi_signals['buy_signals']
                                      if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        rsi_signals['sell_signals'] = [s for s in rsi_signals['sell_signals']
                                       if s['timestamp'] and s['timestamp'] >= cutoff_timestamp]
        rsi_signals['total_buy'] = len(rsi_signals['buy_signals'])
        rsi_signals['total_sell'] = len(rsi_signals['sell_signals'])
        results['RSI'] = rsi_signals

    # Calculate summary
    summary = {
        'period_days': days,
        'cutoff_timestamp': cutoff_timestamp,
        'total_candles': len([t for t in timestamps if t >= cutoff_timestamp]),
        'indicators': {}
    }

    for indicator, signals in results.items():
        summary['indicators'][indicator] = {
            'buy_count': signals['total_buy'],
            'sell_count': signals['total_sell'],
            'total_signals': signals['total_buy'] + signals['total_sell']
        }

    return {
        'summary': summary,
        'details': results
    }