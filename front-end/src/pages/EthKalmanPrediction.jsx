import React, { useState, useEffect } from 'react';
import { useEthKalman } from '../hooks/useEthKalman';
import EthPriceChart from '../components/Eth/EthPriceChart';
import EthPredictionFan from '../components/Eth/EthPredictionFan';
import EthModelMetrics from '../components/Eth/EthModelMetrics';
import './EthKalmanPrediction.css';

const EthKalmanPrediction = () => {
  const {
    currentPrice,
    predictions,
    candles,
    modelMetrics,
    isConnected,
    isLoading,
    error,
    adjustHalfLife
  } = useEthKalman();

  const [selectedHorizon, setSelectedHorizon] = useState('15m');
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);
  const [halfLifeCandles, setHalfLifeCandles] = useState(5);

  const horizonOptions = [
    { value: '3m', label: '3 min' },
    { value: '6m', label: '6 min' },
    { value: '9m', label: '9 min' },
    { value: '15m', label: '15 min' },
    { value: '30m', label: '30 min' },
    { value: '60m', label: '1 hour' }
  ];

  const handleHalfLifeChange = async (newValue) => {
    setHalfLifeCandles(newValue);
    await adjustHalfLife(newValue);
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatPercentChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="eth-loading">
        <div className="spinner"></div>
        <p>Initializing ETH Kalman Filter Model...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eth-error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="eth-kalman-container">
      <div className="eth-header">
        <h1>Ethereum Price Prediction</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="eth-main-grid">
        {/* Current Price Card */}
        <div className="price-card">
          <h2>Current Price</h2>
          <div className="price-display">
            <span className="price-value">{formatPrice(currentPrice)}</span>
            {predictions?.next_candle && (
              <span className={`price-change ${predictions.next_candle.y_hat > currentPrice ? 'up' : 'down'}`}>
                {formatPercentChange(((predictions.next_candle.y_hat - currentPrice) / currentPrice) * 100)}
              </span>
            )}
          </div>
          <div className="price-meta">
            <span>ETH/USDT</span>
            <span>3-minute candles</span>
          </div>
        </div>

        {/* Model Metrics Card */}
        <div className="metrics-card">
          <EthModelMetrics metrics={modelMetrics} />
        </div>

        {/* Half-Life Control */}
        <div className="control-card">
          <h3>Half-Life Setting</h3>
          <div className="half-life-control">
            <label>
              Candles: {halfLifeCandles} ({halfLifeCandles * 3} minutes)
            </label>
            <input
              type="range"
              min="4"
              max="6"
              value={halfLifeCandles}
              onChange={(e) => handleHalfLifeChange(parseInt(e.target.value))}
              className="half-life-slider"
            />
            <div className="slider-labels">
              <span>12min</span>
              <span>15min</span>
              <span>18min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Section */}
      <div className="predictions-section">
        <div className="section-header">
          <h2>Price Predictions</h2>
          <div className="horizon-selector">
            {horizonOptions.map(option => (
              <button
                key={option.value}
                className={`horizon-btn ${selectedHorizon === option.value ? 'active' : ''}`}
                onClick={() => setSelectedHorizon(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {predictions?.horizons && (
          <div className="prediction-details">
            <div className="prediction-value">
              <h4>Predicted Price ({selectedHorizon})</h4>
              <p className="pred-price">
                {formatPrice(predictions.horizons[selectedHorizon]?.y_hat)}
              </p>
            </div>
            <div className="confidence-intervals">
              <h4>Confidence Intervals</h4>
              <div className="ci-row">
                <span className="ci-label">68% CI:</span>
                <span className="ci-range">
                  {formatPrice(predictions.horizons[selectedHorizon]?.pi68[0])} - 
                  {formatPrice(predictions.horizons[selectedHorizon]?.pi68[1])}
                </span>
              </div>
              <div className="ci-row">
                <span className="ci-label">95% CI:</span>
                <span className="ci-range">
                  {formatPrice(predictions.horizons[selectedHorizon]?.pi95[0])} - 
                  {formatPrice(predictions.horizons[selectedHorizon]?.pi95[1])}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Price Chart with Kalman Filter</h3>
            <label className="chart-toggle">
              <input
                type="checkbox"
                checked={showConfidenceBands}
                onChange={(e) => setShowConfidenceBands(e.target.checked)}
              />
              Show Confidence Bands
            </label>
          </div>
          <div className="chart-wrapper">
            <EthPriceChart
              candles={candles}
              predictions={predictions}
              showConfidenceBands={showConfidenceBands}
            />
          </div>
        </div>

        <div className="chart-container">
          <h3>Multi-Horizon Prediction Fan</h3>
          <div className="chart-wrapper">
            <EthPredictionFan
              currentPrice={currentPrice}
              predictions={predictions}
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h3>About the Model</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>Kalman Filter with Half-Life</h4>
            <p>
              This model uses a Local Linear Trend Kalman filter with exponential
              decay (half-life) weighting. Recent data has more influence on predictions.
            </p>
          </div>
          <div className="info-card">
            <h4>Adaptive Noise</h4>
            <p>
              The model adapts its process and measurement noise based on recent
              volatility and trading volume, providing more accurate predictions.
            </p>
          </div>
          <div className="info-card">
            <h4>Real-time Updates</h4>
            <p>
              Connected via WebSocket to Binance for real-time 3-minute candle updates.
              Predictions refresh automatically with each new candle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EthKalmanPrediction;