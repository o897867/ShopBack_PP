"""
Simplified Technical Indicators Signal Detection Module
"""

import numpy as np
from typing import Dict, List
from datetime import datetime, timedelta

class SignalDetectorV2:
    """Simplified signal detection without complex comparisons"""

    @staticmethod
    def count_macd_crossovers(macd_data: Dict) -> Dict:
        """Count MACD crossovers"""
        macd_line = macd_data.get('macd', [])
        signal_line = macd_data.get('signal', [])

        buy_count = 0
        sell_count = 0
        buy_indices = []
        sell_indices = []

        for i in range(1, min(len(macd_line), len(signal_line))):
            try:
                curr_macd = float(macd_line[i]) if macd_line[i] is not None else None
                prev_macd = float(macd_line[i-1]) if macd_line[i-1] is not None else None
                curr_signal = float(signal_line[i]) if signal_line[i] is not None else None
                prev_signal = float(signal_line[i-1]) if signal_line[i-1] is not None else None

                if None in [curr_macd, prev_macd, curr_signal, prev_signal]:
                    continue
                if np.isnan(curr_macd) or np.isnan(prev_macd) or np.isnan(curr_signal) or np.isnan(prev_signal):
                    continue

                # Crossover detection
                if prev_macd <= prev_signal and curr_macd > curr_signal:
                    buy_count += 1
                    buy_indices.append(i)
                elif prev_macd >= prev_signal and curr_macd < curr_signal:
                    sell_count += 1
                    sell_indices.append(i)
            except (TypeError, ValueError):
                continue

        return {
            'buy_count': buy_count,
            'sell_count': sell_count,
            'buy_indices': buy_indices,
            'sell_indices': sell_indices
        }

    @staticmethod
    def count_price_ma_crossovers(prices: List, ma_values: List) -> Dict:
        """Count price/MA crossovers"""
        buy_count = 0
        sell_count = 0
        buy_indices = []
        sell_indices = []

        for i in range(1, min(len(prices), len(ma_values))):
            try:
                curr_price = float(prices[i]) if prices[i] is not None else None
                prev_price = float(prices[i-1]) if prices[i-1] is not None else None
                curr_ma = float(ma_values[i]) if ma_values[i] is not None else None
                prev_ma = float(ma_values[i-1]) if ma_values[i-1] is not None else None

                if None in [curr_price, prev_price, curr_ma, prev_ma]:
                    continue
                if np.isnan(curr_ma) or np.isnan(prev_ma):
                    continue

                # Crossover detection
                if prev_price <= prev_ma and curr_price > curr_ma:
                    buy_count += 1
                    buy_indices.append(i)
                elif prev_price >= prev_ma and curr_price < curr_ma:
                    sell_count += 1
                    sell_indices.append(i)
            except (TypeError, ValueError):
                continue

        return {
            'buy_count': buy_count,
            'sell_count': sell_count,
            'buy_indices': buy_indices,
            'sell_indices': sell_indices
        }

    @staticmethod
    def count_vwap_reversals(prices: List, vwap_values: List, threshold: float = 0.003) -> Dict:
        """Count VWAP reversal signals"""
        buy_count = 0
        sell_count = 0
        buy_indices = []
        sell_indices = []

        for i in range(1, min(len(prices), len(vwap_values))):
            try:
                curr_price = float(prices[i]) if prices[i] is not None else None
                prev_price = float(prices[i-1]) if prices[i-1] is not None else None
                curr_vwap = float(vwap_values[i]) if vwap_values[i] is not None else None
                prev_vwap = float(vwap_values[i-1]) if vwap_values[i-1] is not None else None

                if None in [curr_price, prev_price, curr_vwap, prev_vwap]:
                    continue
                if np.isnan(curr_vwap) or np.isnan(prev_vwap):
                    continue

                curr_deviation = (curr_price - curr_vwap) / curr_vwap
                prev_deviation = (prev_price - prev_vwap) / prev_vwap

                # Reversal detection
                if curr_deviation < -threshold and curr_deviation > prev_deviation:
                    buy_count += 1
                    buy_indices.append(i)
                elif curr_deviation > threshold and curr_deviation < prev_deviation:
                    sell_count += 1
                    sell_indices.append(i)
            except (TypeError, ValueError, ZeroDivisionError):
                continue

        return {
            'buy_count': buy_count,
            'sell_count': sell_count,
            'buy_indices': buy_indices,
            'sell_indices': sell_indices
        }

    @staticmethod
    def count_rsi_signals(rsi_values: List, oversold: float = 30, overbought: float = 70) -> Dict:
        """Count RSI overbought/oversold signals"""
        buy_count = 0
        sell_count = 0
        buy_indices = []
        sell_indices = []

        for i in range(1, len(rsi_values)):
            try:
                curr_rsi = float(rsi_values[i]) if rsi_values[i] is not None else None
                prev_rsi = float(rsi_values[i-1]) if rsi_values[i-1] is not None else None

                if None in [curr_rsi, prev_rsi]:
                    continue
                if np.isnan(curr_rsi) or np.isnan(prev_rsi):
                    continue

                # Signal detection
                if prev_rsi <= oversold and curr_rsi > oversold:
                    buy_count += 1
                    buy_indices.append(i)
                elif prev_rsi >= overbought and curr_rsi < overbought:
                    sell_count += 1
                    sell_indices.append(i)
            except (TypeError, ValueError):
                continue

        return {
            'buy_count': buy_count,
            'sell_count': sell_count,
            'buy_indices': buy_indices,
            'sell_indices': sell_indices
        }


def analyze_signals_simple(candles: List[Dict], indicators: Dict, days: int = 7) -> Dict:
    """
    Simplified signal analysis for the specified period
    """
    if not candles:
        return {}

    # Filter candles by time period
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(days=days)
    cutoff_timestamp = int(cutoff_time.timestamp() * 1000)

    # Find indices within period
    period_start_idx = 0
    for i, candle in enumerate(candles):
        timestamp = candle.get('open_time', candle.get('timestamp', 0) * 1000)
        if timestamp >= cutoff_timestamp:
            period_start_idx = i
            break

    # Extract data
    prices = [c['close'] for c in candles]

    detector = SignalDetectorV2()
    results = {}

    # MACD signals
    if 'macd' in indicators and indicators['macd']:
        macd_signals = detector.count_macd_crossovers(indicators['macd'])
        # Filter by period
        macd_signals['buy_indices'] = [i for i in macd_signals['buy_indices'] if i >= period_start_idx]
        macd_signals['sell_indices'] = [i for i in macd_signals['sell_indices'] if i >= period_start_idx]
        macd_signals['buy_count'] = len(macd_signals['buy_indices'])
        macd_signals['sell_count'] = len(macd_signals['sell_indices'])
        results['MACD'] = macd_signals

    # SMA14 signals
    if 'sma14' in indicators:
        sma_signals = detector.count_price_ma_crossovers(prices, indicators['sma14'])
        sma_signals['buy_indices'] = [i for i in sma_signals['buy_indices'] if i >= period_start_idx]
        sma_signals['sell_indices'] = [i for i in sma_signals['sell_indices'] if i >= period_start_idx]
        sma_signals['buy_count'] = len(sma_signals['buy_indices'])
        sma_signals['sell_count'] = len(sma_signals['sell_indices'])
        results['SMA14'] = sma_signals

    # EMA20 signals
    if 'ema20' in indicators:
        ema_signals = detector.count_price_ma_crossovers(prices, indicators['ema20'])
        ema_signals['buy_indices'] = [i for i in ema_signals['buy_indices'] if i >= period_start_idx]
        ema_signals['sell_indices'] = [i for i in ema_signals['sell_indices'] if i >= period_start_idx]
        ema_signals['buy_count'] = len(ema_signals['buy_indices'])
        ema_signals['sell_count'] = len(ema_signals['sell_indices'])
        results['EMA20'] = ema_signals

    # VWAP signals
    if 'vwap' in indicators:
        vwap_signals = detector.count_vwap_reversals(prices, indicators['vwap'])
        vwap_signals['buy_indices'] = [i for i in vwap_signals['buy_indices'] if i >= period_start_idx]
        vwap_signals['sell_indices'] = [i for i in vwap_signals['sell_indices'] if i >= period_start_idx]
        vwap_signals['buy_count'] = len(vwap_signals['buy_indices'])
        vwap_signals['sell_count'] = len(vwap_signals['sell_indices'])
        results['VWAP'] = vwap_signals

    # RSI signals
    if 'rsi' in indicators:
        rsi_signals = detector.count_rsi_signals(indicators['rsi'])
        rsi_signals['buy_indices'] = [i for i in rsi_signals['buy_indices'] if i >= period_start_idx]
        rsi_signals['sell_indices'] = [i for i in rsi_signals['sell_indices'] if i >= period_start_idx]
        rsi_signals['buy_count'] = len(rsi_signals['buy_indices'])
        rsi_signals['sell_count'] = len(rsi_signals['sell_indices'])
        results['RSI'] = rsi_signals

    # Create summary
    summary = {
        'period_days': days,
        'cutoff_timestamp': cutoff_timestamp,
        'total_candles_in_period': len(candles) - period_start_idx,
        'indicators': {}
    }

    for indicator, signals in results.items():
        summary['indicators'][indicator] = {
            'buy_count': signals['buy_count'],
            'sell_count': signals['sell_count'],
            'total_signals': signals['buy_count'] + signals['sell_count'],
            'buy_indices': signals['buy_indices'],
            'sell_indices': signals['sell_indices']
        }

    return summary