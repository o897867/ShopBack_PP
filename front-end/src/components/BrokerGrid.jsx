import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { useBrokerComparisonContext } from '../hooks/useBrokerComparison.jsx';

const BrokerGrid = ({ brokers }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const renderRegulatorBadges = (items) => {
    if (!items || items.length === 0) {
      return (
        <span className="bh-badge bh-badge--regulation bh-regulator-badge">
          {translate('brokerHub.sections.brokers.metrics.noData')}
        </span>
      );
    }

    return (
      <div className="bh-regulator-list">
        {items.map((regulator) => {
          const titleParts = [regulator.name];
          if (regulator.license) {
            titleParts.push(translate('brokerHub.sections.brokers.regulatorTooltipLicense', { value: regulator.license }));
          }
          if (regulator.note) {
            titleParts.push(translate('brokerHub.sections.brokers.regulatorTooltipNote', { value: regulator.note }));
          }
          if (regulator.url) titleParts.push(regulator.url);
          const title = titleParts.filter(Boolean).join(' • ');
          const commonProps = {
            className: 'bh-badge bh-badge--regulation bh-regulator-badge',
            title,
            key: `${regulator.code}-${regulator.license || 'nl'}`,
            'data-license': regulator.license || undefined
          };

          if (regulator.url) {
            return (
              <a
                {...commonProps}
                href={regulator.url}
                target="_blank"
                rel="noreferrer"
              >
                {regulator.code}
              </a>
            );
          }

          return (
            <span {...commonProps}>
              {regulator.code}
            </span>
          );
        })}
      </div>
    );
  };

  const {
    selectedBrokers,
    toggleBroker,
    isBrokerSelected,
    selectionStats,
    startComparison,
    isLoading,
    error
  } = useBrokerComparisonContext();

  if (!brokers || brokers.length === 0) {
    return (
      <section className="bh-section">
        <div className="bh-section-heading">
          <h2>{translate('brokerHub.sections.brokers.title')}</h2>
          <p className="muted">{translate('brokerHub.sections.brokers.subtitle')}</p>
        </div>
        <div className="bh-card" style={{ textAlign: 'center' }}>
          <div className="muted">{translate('brokerHub.sections.brokers.empty')}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bh-section">
      <div className="bh-section-heading">
        <div>
          <h2>{translate('brokerHub.sections.brokers.title')}</h2>
          <p className="muted">{translate('brokerHub.sections.brokers.subtitle')}</p>
        </div>
        {selectionStats.count > 0 && (
          <div className="bh-selection-indicator">
            <span className="bh-selection-count">
              已选择 {selectionStats.count}/5
            </span>
          </div>
        )}
      </div>

      <div className="bh-grid">
        {brokers.map((broker) => {
          const isSelected = isBrokerSelected(broker.id);
          const isMaxReached = selectionStats.maxReached && !isSelected;

          return (
            <article
              key={broker.id || broker.name}
              className={`bh-card bh-broker-card ${isSelected ? 'bh-card--selected' : ''} ${isMaxReached ? 'bh-card--disabled' : ''}`}
            >
              {/* 选择复选框 */}
              <div className="bh-card-selector">
                <label className="bh-checkbox-container">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isMaxReached}
                    onChange={() => toggleBroker(broker)}
                    className="bh-checkbox"
                  />
                  <span className="bh-checkmark"></span>
                </label>
              </div>

              <header className="bh-broker-card__header">
                <div className="bh-broker-meta">
                  <div className="bh-broker-identity">
                    {broker.logo_url ? (
                      <img
                        src={broker.logo_url}
                        alt={`${broker.name} logo`}
                        className="bh-broker-logo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    <div>
                      <h3 className="bh-broker-name">{broker.name}</h3>
                      {renderRegulatorBadges(broker.regulatorDetails)}
                    </div>
                  </div>
                </div>
                <div className="bh-rating">
                  <span className="bh-rating__score">{broker.rating || '—'}</span>
                  <span className="bh-rating__label">{translate('brokerHub.sections.brokers.ratingLabel')}</span>
                </div>
              </header>

              <dl className="bh-broker-metrics">
                {broker.metrics && broker.metrics.length > 0 ? (
                  broker.metrics.map((metric) => (
                    <div key={`${broker.name}-${metric.label}`}>
                      <dt>{metric.label}</dt>
                      <dd>
                        {metric.value && typeof metric.value === 'object' && metric.value.type === 'regulators'
                          ? renderRegulatorBadges(metric.value.items)
                          : metric.value}
                      </dd>
                    </div>
                  ))
                ) : (
                  <div>
                    <dt>{translate('brokerHub.sections.brokers.metrics.noData')}</dt>
                    <dd>—</dd>
                  </div>
                )}
              </dl>

            {broker.features && broker.features.length > 0 && (
              <ul className="bh-feature-pills">
                {broker.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}

              <div className="bh-card-footer">
                {broker.website ? (
                  <a
                    className="btn btn-ghost"
                    href={broker.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {translate('brokerHub.sections.brokers.actions.visitSite')}
                  </a>
                ) : (
                  <button className="btn btn-ghost" disabled>
                    {translate('brokerHub.sections.brokers.actions.visitSite')}
                  </button>
                )}
                <button
                  className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => toggleBroker(broker)}
                  disabled={isMaxReached}
                >
                  {isSelected ? translate('brokerDetail.removeFromCompare') : translate('brokerDetail.addToCompare')}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 浮动对比按钮 */}
      {selectionStats.canCompare && (
        <div className="bh-floating-compare">
          <div className="bh-floating-compare__content">
            <div className="bh-floating-compare__info">
              <span className="bh-floating-compare__title">
                {translate('common.selected', { count: selectionStats.count })}
              </span>
              <span className="bh-floating-compare__subtitle">
                {selectionStats.count === 5
                  ? translate('brokerDetail.maxReached')
                  : translate('brokerDetail.canSelectMore', { count: 5 - selectionStats.count })}
              </span>
            </div>
            <div className="bh-floating-compare__actions">
              <button
                className="btn btn-ghost btn-small"
                onClick={() => {
                  selectedBrokers.forEach(broker => toggleBroker(broker));
                }}
              >
                {translate('common.clear')}
              </button>
              <button
                className="btn btn-primary"
                onClick={startComparison}
                disabled={isLoading}
              >
                {isLoading
                  ? translate('brokerDetail.loading')
                  : translate('brokerDetail.startComparison', { count: selectionStats.count })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bh-error-toast">
          <span className="bh-error-message">{error}</span>
        </div>
      )}
    </section>
  );
};

export default BrokerGrid;
