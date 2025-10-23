"""
Technical Indicators Module for ShopBack Trading Platform
Implements MACD, VWAP, SMA, EMA and effectiveness evaluation
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TechnicalIndicators:
    """Calculate various technical indicators for trading analysis"""

    @staticmethod
    def calculate_sma(prices: np.ndarray, period: int) -> np.ndarray:
        """Simple Moving Average"""
        if len(prices) < period:
            return np.array([])

        sma = np.convolve(prices, np.ones(period)/period, mode='valid')
        # Pad with NaN for consistency
        return np.concatenate([np.full(period-1, np.nan), sma])

    @staticmethod
    def calculate_ema(prices: np.ndarray, period: int) -> np.ndarray:
        """Exponential Moving Average"""
        if len(prices) < period:
            return np.array([])

        alpha = 2.0 / (period + 1)
        ema = np.zeros(len(prices))
        ema[:period] = np.nan

        # Initialize with SMA
        ema[period-1] = np.mean(prices[:period])

        # Calculate EMA
        for i in range(period, len(prices)):
            ema[i] = alpha * prices[i] + (1 - alpha) * ema[i-1]

        return ema

    @staticmethod
    def calculate_macd(prices: np.ndarray, fast_period: int = 12,
                       slow_period: int = 26, signal_period: int = 9) -> Dict[str, np.ndarray]:
        """
        MACD (Moving Average Convergence Divergence)
        Returns: macd_line, signal_line, histogram
        """
        # Need at least slow_period to calculate MACD line
        if len(prices) < slow_period:
            return {
                'macd': np.array([]),
                'signal': np.array([]),
                'histogram': np.array([])
            }

        ema_fast = TechnicalIndicators.calculate_ema(prices, fast_period)
        ema_slow = TechnicalIndicators.calculate_ema(prices, slow_period)

        macd_line = ema_fast - ema_slow

        # Signal line is EMA of MACD
        valid_macd = macd_line[~np.isnan(macd_line)]
        if len(valid_macd) >= signal_period:
            signal_ema = TechnicalIndicators.calculate_ema(valid_macd, signal_period)

            # Align signal with macd
            signal_line = np.full(len(prices), np.nan)
            signal_line[slow_period-1:] = signal_ema

            histogram = macd_line - signal_line
        else:
            signal_line = np.full(len(prices), np.nan)
            histogram = np.full(len(prices), np.nan)

        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }

    @staticmethod
    def calculate_vwap(prices: np.ndarray, volumes: np.ndarray,
                       highs: np.ndarray, lows: np.ndarray) -> np.ndarray:
        """
        Volume Weighted Average Price
        VWAP = Σ(Typical Price × Volume) / Σ(Volume)
        Resets daily or per session
        """
        if len(prices) != len(volumes):
            raise ValueError("Prices and volumes must have same length")

        # Calculate typical price (High + Low + Close) / 3
        typical_price = (highs + lows + prices) / 3

        # Calculate cumulative values
        cumulative_pv = np.cumsum(typical_price * volumes)
        cumulative_volume = np.cumsum(volumes)

        # Avoid division by zero
        vwap = np.where(cumulative_volume != 0,
                        cumulative_pv / cumulative_volume,
                        typical_price)

        return vwap

    @staticmethod
    def calculate_rsi(prices: np.ndarray, period: int = 14) -> np.ndarray:
        """Relative Strength Index"""
        if len(prices) < period + 1:
            return np.array([])

        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        avg_gains = np.zeros(len(deltas))
        avg_losses = np.zeros(len(deltas))

        # Initial averages
        avg_gains[period-1] = np.mean(gains[:period])
        avg_losses[period-1] = np.mean(losses[:period])

        # Calculate running averages
        for i in range(period, len(deltas)):
            avg_gains[i] = (avg_gains[i-1] * (period-1) + gains[i]) / period
            avg_losses[i] = (avg_losses[i-1] * (period-1) + losses[i]) / period

        # Calculate RSI
        rs = np.where(avg_losses != 0, avg_gains / avg_losses, 100)
        rsi = 100 - (100 / (1 + rs))

        # Add NaN at the beginning for alignment
        return np.concatenate([np.full(1, np.nan), rsi])

    @staticmethod
    def calculate_rolling_std(prices: np.ndarray, window: int = 50) -> np.ndarray:
        """Calculate rolling standard deviation"""
        if len(prices) < window:
            return np.array([])

        std = np.zeros(len(prices))
        std[:window] = np.nan

        for i in range(window, len(prices) + 1):
            std[i-1] = np.std(prices[i-window:i])

        return std

    @staticmethod
    def calculate_vwap_bands(vwap: np.ndarray, prices: np.ndarray,
                            window: int = 50, k: float = 2.0) -> Dict[str, np.ndarray]:
        """
        Calculate VWAP Bands using rolling standard deviation
        Returns upper and lower bands
        """
        if len(vwap) != len(prices):
            raise ValueError("VWAP and prices must have same length")

        # Calculate rolling standard deviation
        rolling_std = TechnicalIndicators.calculate_rolling_std(prices, window)

        # Calculate bands
        upper_band = vwap + k * rolling_std
        lower_band = vwap - k * rolling_std

        return {
            'upper': upper_band,
            'lower': lower_band,
            'std': rolling_std
        }

    @staticmethod
    def calculate_atr(highs: np.ndarray, lows: np.ndarray,
                      closes: np.ndarray, period: int = 14) -> np.ndarray:
        """
        Calculate Average True Range (ATR)
        Used for volatility measurement and threshold calculation
        """
        if len(highs) < period + 1:
            return np.array([])

        # Calculate True Range
        tr = np.zeros(len(highs))
        tr[0] = highs[0] - lows[0]

        for i in range(1, len(highs)):
            hl = highs[i] - lows[i]
            hc = abs(highs[i] - closes[i-1])
            lc = abs(lows[i] - closes[i-1])
            tr[i] = max(hl, hc, lc)

        # Calculate ATR using EMA approach
        atr = np.zeros(len(tr))
        atr[:period] = np.nan
        atr[period-1] = np.mean(tr[:period])

        # Smooth using EMA
        alpha = 1.0 / period
        for i in range(period, len(tr)):
            atr[i] = alpha * tr[i] + (1 - alpha) * atr[i-1]

        return atr


class IndicatorEffectiveness:
    """Evaluate the effectiveness of technical indicators"""

    @staticmethod
    def generate_signals(indicator_data: Dict, indicator_type: str) -> np.ndarray:
        """
        Generate buy/sell signals based on indicator
        Returns: array of signals (1: buy, -1: sell, 0: hold)
        """
        signals = np.zeros(len(indicator_data['prices']))

        if indicator_type == 'MACD':
            macd = indicator_data.get('macd', {})
            if 'macd' in macd and 'signal' in macd:
                macd_line = macd['macd']
                signal_line = macd['signal']

                # Generate signals at crossovers
                for i in range(1, len(macd_line)):
                    if not np.isnan(macd_line[i]) and not np.isnan(signal_line[i]):
                        if macd_line[i] > signal_line[i] and macd_line[i-1] <= signal_line[i-1]:
                            signals[i] = 1  # Buy signal
                        elif macd_line[i] < signal_line[i] and macd_line[i-1] >= signal_line[i-1]:
                            signals[i] = -1  # Sell signal

        elif indicator_type == 'SMA14':
            sma = indicator_data.get('sma14', np.array([]))
            prices = indicator_data['prices']

            # Price crosses above/below SMA
            for i in range(1, len(prices)):
                if not np.isnan(sma[i]):
                    if prices[i] > sma[i] and prices[i-1] <= sma[i-1]:
                        signals[i] = 1
                    elif prices[i] < sma[i] and prices[i-1] >= sma[i-1]:
                        signals[i] = -1

        elif indicator_type == 'EMA20':
            ema = indicator_data.get('ema20', np.array([]))
            prices = indicator_data['prices']

            # Similar to SMA strategy
            for i in range(1, len(prices)):
                if not np.isnan(ema[i]):
                    if prices[i] > ema[i] and prices[i-1] <= ema[i-1]:
                        signals[i] = 1
                    elif prices[i] < ema[i] and prices[i-1] >= ema[i-1]:
                        signals[i] = -1

        elif indicator_type == 'VWAP':
            vwap = indicator_data.get('vwap', np.array([]))
            prices = indicator_data['prices']

            # Buy below VWAP, sell above VWAP (mean reversion)
            for i in range(1, len(prices)):
                if not np.isnan(vwap[i]):
                    deviation = (prices[i] - vwap[i]) / vwap[i]
                    if deviation < -0.002 and prices[i] > prices[i-1]:  # 0.2% below VWAP
                        signals[i] = 1
                    elif deviation > 0.002 and prices[i] < prices[i-1]:  # 0.2% above VWAP
                        signals[i] = -1

        return signals

    @staticmethod
    def backtest_signals(prices: np.ndarray, signals: np.ndarray,
                         initial_capital: float = 10000,
                         commission: float = 0.001) -> Dict:
        """
        Backtest trading signals and calculate performance metrics
        """
        if len(prices) != len(signals):
            raise ValueError("Prices and signals must have same length")

        capital = initial_capital
        position = 0
        trades = []
        equity_curve = []

        for i in range(len(signals)):
            equity_curve.append(capital + position * prices[i])

            if signals[i] == 1 and position == 0:  # Buy signal
                position = capital / prices[i] * (1 - commission)
                capital = 0
                trades.append({
                    'type': 'buy',
                    'price': prices[i],
                    'index': i
                })

            elif signals[i] == -1 and position > 0:  # Sell signal
                capital = position * prices[i] * (1 - commission)
                position = 0
                trades.append({
                    'type': 'sell',
                    'price': prices[i],
                    'index': i
                })

        # Close any open position at the end
        if position > 0:
            capital = position * prices[-1] * (1 - commission)
            position = 0

        final_equity = capital

        # Calculate metrics
        returns = np.diff(equity_curve) / equity_curve[:-1]

        # Handle edge cases
        total_return = (final_equity - initial_capital) / initial_capital

        if len(returns) > 0:
            sharpe_ratio = np.mean(returns) / (np.std(returns) + 1e-10) * np.sqrt(252)
        else:
            sharpe_ratio = 0

        # Maximum drawdown
        peak = np.maximum.accumulate(equity_curve)
        drawdown = (equity_curve - peak) / peak
        max_drawdown = np.min(drawdown)

        # Win rate
        winning_trades = 0
        losing_trades = 0

        for i in range(0, len(trades) - 1, 2):
            if i + 1 < len(trades):
                buy_price = trades[i]['price']
                sell_price = trades[i + 1]['price']
                if sell_price > buy_price:
                    winning_trades += 1
                else:
                    losing_trades += 1

        total_trades = winning_trades + losing_trades
        win_rate = winning_trades / total_trades if total_trades > 0 else 0

        return {
            'total_return': total_return * 100,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown * 100,
            'win_rate': win_rate * 100,
            'total_trades': len(trades),
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'final_equity': final_equity,
            'equity_curve': equity_curve
        }

    @staticmethod
    def calculate_effectiveness_score(metrics: Dict) -> float:
        """
        Calculate overall effectiveness score (0-100)
        Based on multiple factors with weights
        """
        # Weights for different metrics
        weights = {
            'return': 0.3,
            'sharpe': 0.25,
            'drawdown': 0.2,
            'win_rate': 0.15,
            'activity': 0.1
        }

        score = 0

        # Return component (0-30 points)
        # Normalize: 20% annual return = 30 points
        return_score = min(30, max(0, metrics['total_return'] / 20 * 30))
        score += return_score * weights['return']

        # Sharpe ratio component (0-25 points)
        # Normalize: Sharpe of 2 = 25 points
        sharpe_score = min(25, max(0, metrics['sharpe_ratio'] / 2 * 25))
        score += sharpe_score * weights['sharpe']

        # Drawdown component (0-20 points)
        # Less drawdown is better: -10% drawdown = 20 points
        drawdown_score = max(0, 20 - abs(metrics['max_drawdown']) * 2)
        score += drawdown_score * weights['drawdown']

        # Win rate component (0-15 points)
        # 60% win rate = 15 points
        win_rate_score = min(15, metrics['win_rate'] / 60 * 15)
        score += win_rate_score * weights['win_rate']

        # Trading activity component (0-10 points)
        # At least 10 trades = 10 points
        activity_score = min(10, metrics['total_trades'] / 10 * 10)
        score += activity_score * weights['activity']

        return min(100, max(0, score))


def calculate_all_indicators(candle_data: List[Dict]) -> Dict:
    """
    Calculate all indicators from candle data

    Args:
        candle_data: List of candles with keys: open, high, low, close, volume

    Returns:
        Dictionary with all calculated indicators
    """
    if not candle_data:
        return {}

    # Extract arrays from candle data
    prices = np.array([c['close'] for c in candle_data])
    opens = np.array([c['open'] for c in candle_data])
    highs = np.array([c['high'] for c in candle_data])
    lows = np.array([c['low'] for c in candle_data])
    volumes = np.array([c['volume'] for c in candle_data])

    indicators = TechnicalIndicators()

    # Calculate base indicators
    vwap = indicators.calculate_vwap(prices, volumes, highs, lows)

    # Calculate all indicators
    result = {
        'prices': prices,
        'highs': highs,
        'lows': lows,
        'opens': opens,
        'volumes': volumes,
        'sma14': indicators.calculate_sma(prices, 14),
        'ema20': indicators.calculate_ema(prices, 20),
        'macd': indicators.calculate_macd(prices),
        'vwap': vwap,
        'vwap_bands': indicators.calculate_vwap_bands(vwap, prices),
        'rsi': indicators.calculate_rsi(prices),
        'atr': indicators.calculate_atr(highs, lows, prices)
    }

    return result


def evaluate_indicator_effectiveness(candle_data: List[Dict],
                                    indicator_type: str) -> Dict:
    """
    Evaluate the effectiveness of a specific indicator

    Returns:
        Dictionary with effectiveness metrics and score
    """
    # Calculate indicators
    indicator_data = calculate_all_indicators(candle_data)

    if not indicator_data:
        return {'error': 'Insufficient data'}

    # Generate signals
    evaluator = IndicatorEffectiveness()
    signals = evaluator.generate_signals(indicator_data, indicator_type)

    # Backtest
    metrics = evaluator.backtest_signals(indicator_data['prices'], signals)

    # Calculate effectiveness score
    effectiveness_score = evaluator.calculate_effectiveness_score(metrics)

    return {
        'indicator': indicator_type,
        'metrics': metrics,
        'effectiveness_score': effectiveness_score,
        'signals_count': np.sum(np.abs(signals)),
        'recommendation': get_recommendation(effectiveness_score)
    }


def get_recommendation(score: float) -> str:
    """Get recommendation based on effectiveness score"""
    if score >= 80:
        return "Highly Effective - Strong buy/sell signals"
    elif score >= 60:
        return "Effective - Reliable for most market conditions"
    elif score >= 40:
        return "Moderately Effective - Use with other indicators"
    elif score >= 20:
        return "Limited Effectiveness - Caution advised"
    else:
        return "Not Effective - Not recommended for this market"


def compare_indicators(candle_data: List[Dict]) -> Dict:
    """
    Compare effectiveness of all indicators

    Returns:
        Comparison results with rankings
    """
    indicators_to_test = ['MACD', 'VWAP', 'SMA14', 'EMA20']
    results = []

    for indicator in indicators_to_test:
        effectiveness = evaluate_indicator_effectiveness(candle_data, indicator)
        results.append(effectiveness)

    # Sort by effectiveness score
    results.sort(key=lambda x: x.get('effectiveness_score', 0), reverse=True)

    return {
        'rankings': results,
        'best_indicator': results[0]['indicator'] if results else None,
        'timestamp': datetime.now().isoformat()
    }