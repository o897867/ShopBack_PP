import React from 'react';
import './EthModelMetrics.css';

const EthModelMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="eth-metrics-container">
        <h3>Model Metrics</h3>
        <p className="no-data">Loading metrics...</p>
      </div>
    );
  }

  const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined) return '--';
    return num.toFixed(decimals);
  };

  const formatTrend = (trend) => {
    if (!trend) return '--';
    const hourlyTrend = trend; // Already converted to per-hour in backend
    const sign = hourlyTrend >= 0 ? '+' : '';
    return `${sign}${formatNumber(hourlyTrend, 2)}/hr`;
  };

  const getVolatilityLevel = (vol) => {
    if (vol < 0.01) return { level: 'Low', color: '#4caf50' };
    if (vol < 0.02) return { level: 'Medium', color: '#ff9800' };
    return { level: 'High', color: '#f44336' };
  };

  const volatilityInfo = getVolatilityLevel(metrics.volatility);

  return (
    <div className="eth-metrics-container">
      <h3>Model Metrics</h3>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Level</span>
          <span className="metric-value">
            ${formatNumber(Math.exp(metrics.level), 2)}
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Trend</span>
          <span className={`metric-value ${metrics.trend >= 0 ? 'positive' : 'negative'}`}>
            {formatTrend(metrics.trend)}
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Volatility</span>
          <span className="metric-value" style={{ color: volatilityInfo.color }}>
            {formatNumber(metrics.volatility * 100, 2)}%
            <span className="volatility-level">({volatilityInfo.level})</span>
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Half-Life</span>
          <span className="metric-value">
            {metrics.half_life_minutes} min
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">EWM Volume</span>
          <span className="metric-value">
            {formatNumber(metrics.ewm_volume, 0)} ETH
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Model Confidence</span>
          <span className="metric-value">
            {metrics.covariance_trace < 0.1 ? '🟢 High' : 
             metrics.covariance_trace < 1.0 ? '🟡 Medium' : '🔴 Low'}
          </span>
        </div>
      </div>

      <div className="metrics-explanation">
        <p>
          <strong>Level:</strong> Current filtered price estimate
        </p>
        <p>
          <strong>Trend:</strong> Rate of change per hour
        </p>
        <p>
          <strong>Volatility:</strong> Recent price variance (3-min returns)
        </p>
      </div>
    </div>
  );
};

export default EthModelMetrics;