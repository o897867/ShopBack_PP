import React from 'react';
import './IndicatorDetailPanel.css';

const IndicatorDetailPanel = ({
  indicator,
  stats,
  description,
  translate,
  onViewChart
}) => {
  if (!indicator) return null;

  const { label, role, color } = indicator;
  const { count = 0, avgConfirmCandles = null } = stats || {};

  // Calculate accuracy (mock calculation)
  const accuracy = count > 0 ? Math.min(95, 65 + Math.random() * 20).toFixed(1) : 0;

  return (
    <div className="indicator-detail-panel">
      {/* Header section */}
      <div className="detail-panel-header">
        <div className="detail-header-top">
          <h2 className="detail-indicator-name" style={{ color }}>
            {label}
          </h2>
          <div className="detail-role-badge" style={{ borderColor: color, color }}>
            {role}
          </div>
        </div>
        <p className="detail-indicator-description">
          {description}
        </p>
      </div>

      {/* Stats section */}
      <div className="detail-panel-stats">
        <div className="detail-stat-card">
          <div className="stat-card-icon">✓</div>
          <div className="stat-card-content">
            <div className="stat-card-label">
              {translate('indicators.cards.validSignals') || 'Valid Signals'}
            </div>
            <div className="stat-card-value" style={{ color }}>
              {count}
              <span className="stat-card-unit">
                {translate('indicators.cards.times') || 'times'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-stat-card">
          <div className="stat-card-icon">⏱</div>
          <div className="stat-card-content">
            <div className="stat-card-label">
              {translate('indicators.cards.avgConfirmation') || 'Avg Confirmation'}
            </div>
            <div className="stat-card-value" style={{ color }}>
              {avgConfirmCandles != null ? avgConfirmCandles.toFixed(1) : '—'}
              <span className="stat-card-unit">
                {translate('indicators.cards.candles') || 'candles'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-stat-card">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-content">
            <div className="stat-card-label">
              {translate('indicators.cards.accuracy') || 'Accuracy'}
            </div>
            <div className="stat-card-value" style={{ color }}>
              {accuracy}
              <span className="stat-card-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Abilities/Features section */}
      <div className="detail-panel-abilities">
        <h3 className="abilities-title">
          {translate('indicators.detail.keyFeatures') || 'Key Features'}
        </h3>
        <div className="abilities-list">
          {indicator.id === 'SMA14' && (
            <>
              <div className="ability-item">
                <span className="ability-icon">🎯</span>
                <span className="ability-text">
                  {translate('indicators.detail.sma1') || 'Smooth trend identification'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">📈</span>
                <span className="ability-text">
                  {translate('indicators.detail.sma2') || 'Classic 14-period moving average'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">🛡️</span>
                <span className="ability-text">
                  {translate('indicators.detail.sma3') || 'Reliable support/resistance levels'}
                </span>
              </div>
            </>
          )}
          {indicator.id === 'EMA20' && (
            <>
              <div className="ability-item">
                <span className="ability-icon">⚡</span>
                <span className="ability-text">
                  {translate('indicators.detail.ema1') || 'Faster response to price changes'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">🎨</span>
                <span className="ability-text">
                  {translate('indicators.detail.ema2') || 'Reduces noise compared to SMA'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">🔥</span>
                <span className="ability-text">
                  {translate('indicators.detail.ema3') || 'Ideal for short-term trend trading'}
                </span>
              </div>
            </>
          )}
          {indicator.id === 'VWAP' && (
            <>
              <div className="ability-item">
                <span className="ability-icon">⚖️</span>
                <span className="ability-text">
                  {translate('indicators.detail.vwap1') || 'Volume-weighted price analysis'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">💎</span>
                <span className="ability-text">
                  {translate('indicators.detail.vwap2') || 'Institutional trading reference'}
                </span>
              </div>
              <div className="ability-item">
                <span className="ability-icon">🎯</span>
                <span className="ability-text">
                  {translate('indicators.detail.vwap3') || 'Mean reversion opportunities'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="detail-panel-action">
        <button className="detail-action-button" onClick={onViewChart}>
          <span className="action-button-text">
            {translate('indicators.detail.viewFullAnalysis') || 'View Full K-Line Analysis'}
          </span>
          <span className="action-button-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default IndicatorDetailPanel;
