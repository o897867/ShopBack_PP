"""
Technical Indicators Validity Detection Module
Detects valid signals based on price bounces, reversions, and confirmations
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ValidityDetector:
    """Detect valid indicator signals based on effectiveness criteria"""

    @staticmethod
    def detect_ma_bounce_valid(prices: np.ndarray, ma_values: np.ndarray,
                               params: Dict = None) -> Dict:
        """
        Detect valid MA bounce signals

        Parameters:
        - tol: Touch tolerance (default 0.15%)
        - window: Confirmation window (default 8 candles)
        - threshold: Required bounce percentage (default 0.4%)
        """
        if params is None:
            params = {}

        tol = params.get('tol', 0.0015)  # 0.15% tolerance
        window = params.get('window', 8)  # 8 candles to confirm
        threshold = params.get('threshold', 0.004)  # 0.4% bounce required

        valid_indices = []
        events = []

        for i in range(window, min(len(prices), len(ma_values)) - window):
            try:
                if np.isnan(ma_values[i]):
                    continue

                # Check if price touches MA (within tolerance)
                deviation = abs(prices[i] - ma_values[i]) / ma_values[i]

                if deviation <= tol:
                    # Determine direction (above or below MA)
                    was_above = prices[i-1] > ma_values[i-1] if i > 0 else False

                    # Check for bounce in next window candles
                    max_bounce = 0
                    bounce_idx = -1

                    for j in range(1, min(window + 1, len(prices) - i)):
                        if was_above:
                            # Was above, touched, should bounce up
                            bounce = (prices[i+j] - prices[i]) / prices[i]
                        else:
                            # Was below, touched, should bounce down
                            bounce = (prices[i] - prices[i+j]) / prices[i]

                        if abs(bounce) > max_bounce:
                            max_bounce = abs(bounce)
                            bounce_idx = j

                    # Valid if bounce exceeds threshold
                    if max_bounce >= threshold:
                        valid_indices.append(i)
                        events.append({
                            'index': i,
                            'type': 'MA_BOUNCE',
                            'price': float(prices[i]),
                            'ma_value': float(ma_values[i]),
                            'deviation': float(deviation),
                            'max_bounce': float(max_bounce),
                            'bounce_candles': bounce_idx,
                            'direction': 'up' if not was_above else 'down'
                        })
            except Exception as e:
                logger.warning(f"Error processing MA bounce at index {i}: {e}")
                continue

        return {
            'valid_count': len(valid_indices),
            'valid_indices': valid_indices,
            'events': events
        }

    @staticmethod
    def detect_vwap_band_revert_valid(prices: np.ndarray, vwap: np.ndarray,
                                     bands: Dict, params: Dict = None) -> Dict:
        """
        Detect valid VWAP band reversion signals

        Parameters:
        - window: Reversion window (default 8 candles)
        - revert_tol: Reversion tolerance to VWAP (default 0.2%)
        - min_touch_deviation: Minimum deviation to trigger (default 0.3%)
        """
        if params is None:
            params = {}

        window = params.get('window', 8)
        revert_tol = params.get('revert_tol', 0.002)  # 0.2% from VWAP
        min_touch = params.get('min_touch_deviation', 0.003)  # 0.3% minimum

        upper_band = bands.get('upper', np.array([]))
        lower_band = bands.get('lower', np.array([]))

        if len(upper_band) == 0 or len(lower_band) == 0:
            return {'valid_count': 0, 'valid_indices': [], 'events': []}

        valid_indices = []
        events = []

        for i in range(window, min(len(prices), len(vwap)) - window):
            try:
                if np.isnan(vwap[i]) or np.isnan(upper_band[i]) or np.isnan(lower_band[i]):
                    continue

                vwap_deviation = (prices[i] - vwap[i]) / vwap[i]

                # Check upper band touch
                if prices[i] >= upper_band[i] and abs(vwap_deviation) >= min_touch:
                    # Look for reversion to VWAP
                    reverted = False
                    revert_idx = -1
                    min_deviation = abs(vwap_deviation)

                    for j in range(1, min(window + 1, len(prices) - i)):
                        new_deviation = abs((prices[i+j] - vwap[i+j]) / vwap[i+j])
                        if new_deviation < min_deviation:
                            min_deviation = new_deviation
                            revert_idx = j

                        if new_deviation <= revert_tol:
                            reverted = True
                            break

                    if reverted or min_deviation < abs(vwap_deviation) * 0.5:
                        valid_indices.append(i)
                        events.append({
                            'index': i,
                            'type': 'VWAP_UPPER_REVERT',
                            'price': float(prices[i]),
                            'vwap': float(vwap[i]),
                            'upper_band': float(upper_band[i]),
                            'initial_deviation': float(vwap_deviation),
                            'min_deviation': float(min_deviation),
                            'revert_candles': revert_idx,
                            'fully_reverted': reverted
                        })

                # Check lower band touch
                elif prices[i] <= lower_band[i] and abs(vwap_deviation) >= min_touch:
                    # Look for reversion to VWAP
                    reverted = False
                    revert_idx = -1
                    min_deviation = abs(vwap_deviation)

                    for j in range(1, min(window + 1, len(prices) - i)):
                        new_deviation = abs((prices[i+j] - vwap[i+j]) / vwap[i+j])
                        if new_deviation < min_deviation:
                            min_deviation = new_deviation
                            revert_idx = j

                        if new_deviation <= revert_tol:
                            reverted = True
                            break

                    if reverted or min_deviation < abs(vwap_deviation) * 0.5:
                        valid_indices.append(i)
                        events.append({
                            'index': i,
                            'type': 'VWAP_LOWER_REVERT',
                            'price': float(prices[i]),
                            'vwap': float(vwap[i]),
                            'lower_band': float(lower_band[i]),
                            'initial_deviation': float(vwap_deviation),
                            'min_deviation': float(min_deviation),
                            'revert_candles': revert_idx,
                            'fully_reverted': reverted
                        })
            except Exception as e:
                logger.warning(f"Error processing VWAP reversion at index {i}: {e}")
                continue

        return {
            'valid_count': len(valid_indices),
            'valid_indices': valid_indices,
            'events': events
        }

    @staticmethod
    def detect_macd_followthrough_valid(prices: np.ndarray, macd_data: Dict,
                                       params: Dict = None) -> Dict:
        """
        Detect valid MACD signals with price follow-through

        Parameters:
        - window: Confirmation window (default 8 candles)
        - threshold: Required price movement (default 0.5%)
        - hist_confirm: Required histogram confirmation candles (default 2)
        """
        if params is None:
            params = {}

        window = params.get('window', 8)
        threshold = params.get('threshold', 0.005)  # 0.5% price movement
        hist_confirm = params.get('hist_confirm', 2)  # 2 candles histogram confirmation

        macd_line = macd_data.get('macd', np.array([]))
        signal_line = macd_data.get('signal', np.array([]))
        histogram = macd_data.get('histogram', np.array([]))

        if len(macd_line) == 0 or len(signal_line) == 0:
            return {'valid_count': 0, 'valid_indices': [], 'events': []}

        valid_indices = []
        events = []

        for i in range(1, min(len(prices), len(macd_line)) - window):
            try:
                if np.isnan(macd_line[i]) or np.isnan(signal_line[i]):
                    continue

                # Check for crossover
                prev_diff = macd_line[i-1] - signal_line[i-1]
                curr_diff = macd_line[i] - signal_line[i]

                crossover_type = None
                if prev_diff <= 0 and curr_diff > 0:
                    crossover_type = 'BULLISH'
                elif prev_diff >= 0 and curr_diff < 0:
                    crossover_type = 'BEARISH'

                if crossover_type:
                    # Check price follow-through
                    max_movement = 0
                    movement_idx = -1
                    hist_confirmed = True

                    for j in range(1, min(window + 1, len(prices) - i)):
                        if crossover_type == 'BULLISH':
                            movement = (prices[i+j] - prices[i]) / prices[i]
                        else:
                            movement = (prices[i] - prices[i+j]) / prices[i]

                        if movement > max_movement:
                            max_movement = movement
                            movement_idx = j

                        # Check histogram confirmation
                        if j <= hist_confirm and i+j < len(histogram):
                            if not np.isnan(histogram[i+j]):
                                if crossover_type == 'BULLISH' and histogram[i+j] <= 0:
                                    hist_confirmed = False
                                elif crossover_type == 'BEARISH' and histogram[i+j] >= 0:
                                    hist_confirmed = False

                    # Valid if price moves enough in the right direction
                    if max_movement >= threshold:
                        valid_indices.append(i)
                        events.append({
                            'index': i,
                            'type': f'MACD_{crossover_type}',
                            'price': float(prices[i]),
                            'macd': float(macd_line[i]),
                            'signal': float(signal_line[i]),
                            'max_movement': float(max_movement),
                            'movement_candles': movement_idx,
                            'histogram_confirmed': hist_confirmed,
                            'crossover_strength': float(abs(curr_diff))
                        })
            except Exception as e:
                logger.warning(f"Error processing MACD signal at index {i}: {e}")
                continue

        return {
            'valid_count': len(valid_indices),
            'valid_indices': valid_indices,
            'events': events
        }


def analyze_validity(candles: List[Dict], indicators: Dict, params: Dict = None) -> Dict:
    """
    Analyze validity of all indicators

    Returns comprehensive validity analysis
    """
    if not candles or not indicators:
        return {}

    if params is None:
        params = {}

    # Extract price data
    prices = np.array([c['close'] for c in candles])

    detector = ValidityDetector()
    results = {}

    # MA validities (SMA14 and EMA20)
    if 'sma14' in indicators:
        sma_params = {
            'tol': params.get('ma_tol', 0.0015),
            'window': params.get('ma_win', 8),
            'threshold': params.get('ma_thr', 0.004)
        }
        results['SMA14'] = detector.detect_ma_bounce_valid(
            prices, indicators['sma14'], sma_params
        )

    if 'ema20' in indicators:
        ema_params = {
            'tol': params.get('ma_tol', 0.0015),
            'window': params.get('ma_win', 8),
            'threshold': params.get('ma_thr', 0.004)
        }
        results['EMA20'] = detector.detect_ma_bounce_valid(
            prices, indicators['ema20'], ema_params
        )

    # VWAP validity
    if 'vwap' in indicators and 'vwap_bands' in indicators:
        vwap_params = {
            'window': params.get('vwap_win', 8),
            'revert_tol': params.get('vwap_revert', 0.002),
            'min_touch_deviation': params.get('vwap_min_touch', 0.003)
        }
        results['VWAP'] = detector.detect_vwap_band_revert_valid(
            prices, indicators['vwap'], indicators['vwap_bands'], vwap_params
        )

    # MACD validity
    if 'macd' in indicators and isinstance(indicators['macd'], dict):
        macd_params = {
            'window': params.get('macd_win', 8),
            'threshold': params.get('macd_thr', 0.005),
            'hist_confirm': params.get('macd_hist', 2)
        }
        results['MACD'] = detector.detect_macd_followthrough_valid(
            prices, indicators['macd'], macd_params
        )

    return results


def filter_validity_by_period(validity_results: Dict, candles: List[Dict],
                             days: int = 7) -> Dict:
    """
    Filter validity results by time period
    """
    if not candles:
        return validity_results

    # Calculate cutoff timestamp
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(days=days)
    cutoff_timestamp = int(cutoff_time.timestamp() * 1000)

    # Find period start index
    period_start_idx = 0
    for i, candle in enumerate(candles):
        timestamp = candle.get('open_time', candle.get('timestamp', 0))
        if isinstance(timestamp, (int, float)) and timestamp >= cutoff_timestamp:
            period_start_idx = i
            break

    # Filter results
    filtered_results = {}
    for indicator, data in validity_results.items():
        filtered_indices = [idx for idx in data['valid_indices'] if idx >= period_start_idx]
        filtered_events = [evt for evt in data['events'] if evt['index'] >= period_start_idx]

        filtered_results[indicator] = {
            'valid_count': len(filtered_indices),
            'valid_indices': filtered_indices,
            'events': filtered_events
        }

    return {
        'period_days': days,
        'cutoff_timestamp': cutoff_timestamp,
        'period_start_idx': period_start_idx,
        'total_candles_in_period': len(candles) - period_start_idx,
        'indicators': filtered_results
    }