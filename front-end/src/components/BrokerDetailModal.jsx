import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './BrokerDetailModal.css';

const BrokerDetailModal = ({ broker, onClose }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  if (!broker) return null;

  // 计算综合加权分数
  const calculateWeightedScore = (breakdown) => {
    if (!breakdown || typeof breakdown !== 'object') return null;
    let total = 0;
    let hasWeights = false;

    for (const data of Object.values(breakdown)) {
      if (typeof data === 'object' && 'score' in data && 'weight' in data) {
        total += data.score * data.weight;
        hasWeights = true;
      }
    }

    return hasWeights ? total.toFixed(2) : null;
  };

  const weightedScore = broker.breakdown ? calculateWeightedScore(
    broker.breakdown.reduce((acc, item) => {
      // 从 breakdown entries 重建原始结构
      const breakdownData = broker.breakdown;
      if (breakdownData && breakdownData.length > 0) {
        // 这里需要原始的 rating_breakdown 数据，暂时从 ratingScore 显示
        return acc;
      }
      return acc;
    }, {})
  ) : null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="broker-detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="broker-detail-modal">
        <div className="broker-detail-modal__header">
          <div className="broker-detail-modal__identity">
            {broker.logo_url && (
              <img
                src={broker.logo_url}
                alt={`${broker.name} logo`}
                className="broker-detail-modal__logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div>
              <h2 className="broker-detail-modal__name">{broker.name}</h2>
              <div className="broker-detail-modal__rating">
                <span className="broker-detail-modal__rating-badge">{broker.rating || '—'}</span>
                {broker.ratingScore && (
                  <span className="broker-detail-modal__rating-score">
                    {translate('brokerDetail.compositeScore')}: {broker.ratingScore}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="broker-detail-modal__close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="broker-detail-modal__content">
          {/* Basic Information */}
          <section className="broker-detail-section">
            <h3 className="broker-detail-section__title">{translate('brokerDetail.basicInfo')}</h3>
            <dl className="broker-detail-list">
              <div className="broker-detail-list__item">
                <dt>{translate('brokerDetail.brokerName')}</dt>
                <dd>{broker.name}</dd>
              </div>
              <div className="broker-detail-list__item">
                <dt>{translate('brokerDetail.overallRating')}</dt>
                <dd>
                  <span className="broker-detail-badge broker-detail-badge--rating">
                    {broker.rating || translate('brokerDetail.unrated')}
                  </span>
                </dd>
              </div>
              {broker.website && (
                <div className="broker-detail-list__item">
                  <dt>{translate('brokerDetail.website')}</dt>
                  <dd>
                    <a href={broker.website} target="_blank" rel="noreferrer" className="broker-detail-link">
                      {broker.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Regulatory Information */}
          <section className="broker-detail-section">
            <h3 className="broker-detail-section__title">{translate('brokerDetail.regulatoryInfo')}</h3>
            {broker.regulatorDetails && broker.regulatorDetails.length > 0 ? (
              <div className="broker-detail-regulators">
                {broker.regulatorDetails.map((reg, idx) => (
                  <div key={`${reg.code}-${idx}`} className="broker-detail-regulator-card">
                    <div className="broker-detail-regulator-card__header">
                      <span className="broker-detail-regulator-badge">{reg.code}</span>
                      {reg.url && (
                        <a href={reg.url} target="_blank" rel="noreferrer" className="broker-detail-regulator-link">
                          {translate('brokerHub.sections.brokers.actions.visitSite')} →
                        </a>
                      )}
                    </div>
                    <div className="broker-detail-regulator-card__body">
                      <p className="broker-detail-regulator-name">{reg.name}</p>
                      {reg.license && (
                        <p className="broker-detail-regulator-license">
                          <strong>{translate('brokerHub.sections.brokers.regulatorTooltipLicense', { value: reg.license })}</strong>
                        </p>
                      )}
                      {reg.note && (
                        <p className="broker-detail-regulator-note">{reg.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="broker-detail-empty">{translate('brokerHub.sections.brokers.metrics.noData')}</p>
            )}
          </section>

          {/* Rating Breakdown */}
          {broker.breakdown && broker.breakdown.length > 0 && (
            <section className="broker-detail-section">
              <h3 className="broker-detail-section__title">{translate('brokerDetail.ratingBreakdown')}</h3>
              <div className="broker-detail-scores">
                {broker.breakdown.map((item, idx) => (
                  <div key={idx} className="broker-detail-score-item">
                    <div className="broker-detail-score-header">
                      <span className="broker-detail-score-label">{item.label}</span>
                      <span className="broker-detail-score-value">{item.score}</span>
                    </div>
                    <div className="broker-detail-score-bar">
                      <div
                        className="broker-detail-score-bar-fill"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Features */}
          {broker.features && broker.features.length > 0 && (
            <section className="broker-detail-section">
              <h3 className="broker-detail-section__title">{translate('brokerHub.sections.brokers.metrics.rating')}</h3>
              <ul className="broker-detail-features">
                {broker.features.map((feature, idx) => (
                  <li key={idx} className="broker-detail-feature-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="broker-detail-modal__footer">
          <button className="btn btn-ghost" onClick={onClose}>
            {translate('brokerDetail.close')}
          </button>
          {broker.website && (
            <a
              className="btn btn-primary"
              href={broker.website}
              target="_blank"
              rel="noreferrer"
            >
              {translate('brokerHub.sections.brokers.actions.visitSite')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerDetailModal;
