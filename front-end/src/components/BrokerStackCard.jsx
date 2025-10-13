import React, { useState, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { useBrokerComparisonContext } from '../hooks/useBrokerComparison.jsx';

const BrokerStackCard = ({ brokerGroup }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    selectedBrokers,
    toggleBroker,
    isBrokerSelected,
    selectionStats
  } = useBrokerComparisonContext();

  const mainBroker = brokerGroup.brokers[0];
  const additionalCount = brokerGroup.brokers.length - 1;

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
        {items.slice(0, 3).map((regulator) => {
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
        {items.length > 3 && (
          <span className="bh-badge bh-badge--regulation bh-regulator-badge bh-regulator-more">
            +{items.length - 3}
          </span>
        )}
      </div>
    );
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleBrokerSelect = (broker, event) => {
    event.stopPropagation();
    toggleBroker(broker);
  };

  const selectedCount = brokerGroup.brokers.filter(broker => isBrokerSelected(broker.id)).length;
  const hasSelected = selectedCount > 0;

  return (
    <div
      className={`bh-stack-card ${isExpanded ? 'bh-stack-card--expanded' : ''} ${isHovered ? 'bh-stack-card--hovered' : ''} ${hasSelected ? 'bh-stack-card--has-selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 堆叠卡片背景 */}
      {!isExpanded && additionalCount > 0 && (
        <>
          <div className="bh-stack-card__background bh-stack-card__background--2"></div>
          {additionalCount > 1 && (
            <div className="bh-stack-card__background bh-stack-card__background--3"></div>
          )}
        </>
      )}

      {/* 主卡片内容 */}
      <div className="bh-stack-card__main">
        {/* 堆叠指示器 */}
        {!isExpanded && additionalCount > 0 && (
          <div className="bh-stack-indicator">
            <span className="bh-stack-count">+{additionalCount}</span>
            <span className="bh-stack-label">{translate('brokerDetail.entities')}</span>
          </div>
        )}

        {/* 选择统计 */}
        {hasSelected && (
          <div className="bh-selection-badge">
            {translate('brokerHub.sections.brokers.selected', { count: selectedCount })}
          </div>
        )}

        <article className="bh-card bh-broker-card">
          <header className="bh-broker-card__header">
            <div className="bh-broker-meta">
              <div className="bh-broker-identity">
                {mainBroker.logo_url ? (
                  <img
                    src={mainBroker.logo_url}
                    alt={`${brokerGroup.groupName} logo`}
                    className="bh-broker-logo"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}
                <div>
                  <h3 className="bh-broker-name">{brokerGroup.groupName}</h3>
                  <div className="bh-broker-entities">
                    {translate('brokerHub.sections.brokers.entityCount', { count: brokerGroup.brokers.length })}
                  </div>
                  {renderRegulatorBadges(brokerGroup.allRegulators)}
                </div>
              </div>
            </div>
            <div className="bh-rating">
              <span className="bh-rating__score">{mainBroker.rating || '—'}</span>
              <span className="bh-rating__label">{translate('brokerHub.sections.brokers.ratingLabel')}</span>
            </div>
          </header>

          {/* 展开后显示所有实体 */}
          {isExpanded ? (
            <div className="bh-stack-card__entities">
              {brokerGroup.brokers.map((broker, index) => {
                const isSelected = isBrokerSelected(broker.id);
                const isMaxReached = selectionStats.maxReached && !isSelected;

                return (
                  <div key={broker.id} className={`bh-entity-item ${isSelected ? 'bh-entity-item--selected' : ''}`}>
                    <div className="bh-entity-header">
                      <div className="bh-entity-info">
                        <h4 className="bh-entity-name">{broker.name}</h4>
                        {renderRegulatorBadges(broker.regulatorDetails)}
                      </div>
                      <div className="bh-entity-actions">
                        <label className="bh-checkbox-container">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMaxReached}
                            onChange={(e) => handleBrokerSelect(broker, e)}
                            className="bh-checkbox"
                          />
                          <span className="bh-checkmark"></span>
                        </label>
                      </div>
                    </div>

                    <dl className="bh-broker-metrics bh-broker-metrics--compact">
                      {broker.metrics && broker.metrics.length > 0 ? (
                        broker.metrics.slice(0, 2).map((metric) => (
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

                    <div className="bh-entity-footer">
                      {broker.website ? (
                        <a
                          className="btn btn-ghost btn-small"
                          href={broker.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {translate('brokerDetail.visit')}
                        </a>
                      ) : (
                        <button className="btn btn-ghost btn-small" disabled>
                          {translate('brokerDetail.visit')}
                        </button>
                      )}
                      <button
                        className={`btn btn-small ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => handleBrokerSelect(broker, e)}
                        disabled={isMaxReached}
                      >
                        {isSelected ? translate('brokerDetail.remove') : translate('brokerDetail.compare')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <dl className="bh-broker-metrics">
                {mainBroker.metrics && mainBroker.metrics.length > 0 ? (
                  mainBroker.metrics.map((metric) => (
                    <div key={`${mainBroker.name}-${metric.label}`}>
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

              {mainBroker.features && mainBroker.features.length > 0 && (
                <ul className="bh-feature-pills">
                  {mainBroker.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}

              <div className="bh-card-footer">
                {mainBroker.website ? (
                  <a
                    className="btn btn-ghost"
                    href={mainBroker.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {translate('brokerHub.sections.brokers.actions.visitSite')}
                  </a>
                ) : (
                  <button className="btn btn-ghost" disabled>
                    {translate('brokerHub.sections.brokers.actions.visitSite')}
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {translate('brokerDetail.expandView', { count: additionalCount + 1 })}
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
};

export default BrokerStackCard;