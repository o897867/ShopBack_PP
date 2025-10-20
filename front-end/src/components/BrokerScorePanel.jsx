import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './BrokerScorePanel.css';

const BrokerScorePanel = ({ brokers = [], onBrokerClick }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [activeBroker, setActiveBroker] = useState(0);

  // Quick signup URLs for each broker
  const signupUrls = {
    'TMGM': 'https://portal.tmgmroadmaps.com/register?node=MjE4MzQw&language=zh-Hans',
    'Exness': '',
    'IC Markets': '',
    'FXCM': '',
    'AvaTrade': '',
    'EBC': '',
    'ECMarket': '',
    'Pepperstone': ''
  };

  // Real trading data for Gold (XAUUSD)
  const tradingData = useMemo(() => ({
    'TMGM': {
      spreadRange: '9-32 pips',
      spreadDetail: 'STD: 32 / ECN: 9',
      rebate: 'Up to $20/lot',
      rebateDetail: 'STD: $20 / ECN: $2'
    },
    'IC Markets': {
      spreadRange: '5-15 pips',
      spreadDetail: 'STD: 15 / ECN: 5',
      rebate: 'Up to $4/lot',
      rebateDetail: 'STD: $4 / ECN: $2'
    },
    'Exness': {
      spreadRange: '3.7-16 pips',
      spreadDetail: 'STD: 16 / ECN: 3.7',
      rebate: 'Up to $6.4/lot',
      rebateDetail: 'STD: $6.4 / ECN: $2'
    }
  }), []);

  const getScoreColor = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  };

  // Get the currently active broker
  const currentBroker = brokers[activeBroker] || brokers[0];

  return (
    <div className="broker-score-panel">
      <div className="score-panel-header">
        <div>
          <h2 className="score-panel-title">{translate('scorePanel.title')}</h2>
          <p className="score-panel-subtitle">{translate('scorePanel.subtitle')}</p>
        </div>
      </div>

      {/* Broker Navigation Tabs */}
      <div className="broker-tabs">
        {brokers.map((broker, index) => (
          <button
            key={broker.id}
            className={`broker-tab ${activeBroker === index ? 'broker-tab--active' : ''}`}
            onClick={() => setActiveBroker(index)}
            title={broker.name}
          >
            {/* Show logo on mobile, text on desktop */}
            {broker.logo_url ? (
              <>
                <img
                  src={broker.logo_url}
                  alt={broker.name}
                  className="broker-tab-logo broker-tab-logo--mobile"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="broker-tab-text">{broker.name}</span>
              </>
            ) : (
              <div>{broker.name}</div>
            )}
          </button>
        ))}
      </div>

      {/* Bento Box Layout */}
      {currentBroker && (
        <div className="bento-grid">
          {/* Large Card - Main Broker Info */}
          <div className="bento-card bento-card--large">
            <div className="bento-card-left">
              {currentBroker.logo_url && (
                <img
                  src={currentBroker.logo_url}
                  alt={currentBroker.name}
                  className="bento-broker-logo"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <h3 className="bento-broker-name">{currentBroker.name}</h3>
              <p className="bento-broker-description">
                {translate(`scorePanel.brokerDescriptions.${currentBroker.name}`) ||
                 translate('scorePanel.mainDescription', {
                   broker: currentBroker.name,
                   score: (currentBroker.ratingScore || currentBroker.score || 0).toFixed(0)
                 })}
              </p>
              <div className="bento-actions">
                {signupUrls[currentBroker.name] ? (
                  <a
                    href={signupUrls[currentBroker.name]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bento-btn bento-btn--primary"
                  >
                    {translate('scorePanel.quickSignup') || '快速开户'}
                  </a>
                ) : (
                  <button
                    className="bento-btn bento-btn--primary"
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    {translate('scorePanel.comingSoon') || '敬请期待'}
                  </button>
                )}
                <button
                  className="bento-btn bento-btn--secondary"
                  onClick={() => onBrokerClick && onBrokerClick(currentBroker)}
                >
                  {translate('scorePanel.viewDetails') || '查看详情'}
                </button>
              </div>
            </div>
            <div className="bento-card-right">
              <div className={`bento-score-badge bento-score-badge--${getScoreColor(currentBroker.ratingScore || currentBroker.score || 0)}`}>
                <span className="bento-score-value">{(currentBroker.ratingScore || currentBroker.score || 0).toFixed(0)}</span>
                <span className="bento-score-max">/100</span>
              </div>

              {/* Score Breakdown */}
              {currentBroker.breakdown && currentBroker.breakdown.length > 0 && (
                <div className="bento-breakdown">
                  {currentBroker.breakdown.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="bento-breakdown-item">
                      <div className="bento-breakdown-header">
                        <span className="bento-breakdown-label">{item.label}</span>
                        <span className={`bento-breakdown-score bento-breakdown-score--${getScoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      </div>
                      <div className="bento-breakdown-bar">
                        <div
                          className={`bento-breakdown-bar-fill bento-breakdown-bar-fill--${getScoreColor(item.score)}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Small Card 1 - Regulators */}
          <div className="bento-card bento-card--small">
            {currentBroker.regulatorDetails && currentBroker.regulatorDetails.length > 0 && (
              <>
                <div className="bento-stat-value">{currentBroker.regulatorDetails.length}</div>
                <div className="bento-stat-label">
                  {translate('scorePanel.regulators', { count: currentBroker.regulatorDetails.length })}
                </div>
                <div className="bento-regulator-list">
                  {currentBroker.regulatorDetails.slice(0, 3).map((reg, idx) => {
                    const tooltipContent = [];
                    if (reg.name) tooltipContent.push(reg.name);
                    if (reg.license) tooltipContent.push(`${translate('scorePanel.licenseNumber')}: ${reg.license}`);
                    if (reg.note) tooltipContent.push(reg.note);

                    return (
                      <div
                        key={idx}
                        className="bento-regulator-badge"
                        title={tooltipContent.join('\n')}
                      >
                        {reg.code || reg.name || reg}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Small Card 2 - Spread & Rebate Info */}
          <div className="bento-card bento-card--small bento-card--info">
            <h4 className="bento-card-subtitle">{translate('scorePanel.tradingConditions') || 'Trading Conditions'}</h4>
            {tradingData[currentBroker.name] ? (
              <div className="bento-info-list">
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('rebateComparison.spread') || 'Spread'} (XAUUSD)</span>
                  <span className="bento-info-value" title={tradingData[currentBroker.name].spreadDetail}>
                    {tradingData[currentBroker.name].spreadRange}
                  </span>
                </div>
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('scorePanel.rebate') || 'Rebate'}</span>
                  <span className="bento-info-value highlight" title={tradingData[currentBroker.name].rebateDetail}>
                    {tradingData[currentBroker.name].rebate}
                  </span>
                </div>
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('scorePanel.hoverMetrics.liquidity') || 'Liquidity'}</span>
                  <span className="bento-info-value">{translate('scorePanel.hoverMetrics.high') || 'High'}</span>
                </div>
              </div>
            ) : (
              <div className="bento-info-list">
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('rebateComparison.spread') || 'Spread'}</span>
                  <span className="bento-info-value muted">{translate('scorePanel.comingSoon') || 'Coming Soon'}</span>
                </div>
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('scorePanel.rebate') || 'Rebate'}</span>
                  <span className="bento-info-value muted">{translate('scorePanel.comingSoon') || 'Coming Soon'}</span>
                </div>
                <div className="bento-info-item">
                  <span className="bento-info-label">{translate('scorePanel.hoverMetrics.liquidity') || 'Liquidity'}</span>
                  <span className="bento-info-value">{translate('scorePanel.hoverMetrics.high') || 'High'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show message when waiting for other brokers */}
      {brokers.length > 4 && (
        <div className="brokers-notice">
          <p className="muted">{translate('scorePanel.limitedDisplay', { count: 4, total: brokers.length })}</p>
        </div>
      )}
    </div>
  );
};

export default BrokerScorePanel;
