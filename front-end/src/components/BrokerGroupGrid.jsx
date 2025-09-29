import React, { useCallback, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { useBrokerComparisonContext } from '../hooks/useBrokerComparison.jsx';
import BrokerStackCard from './BrokerStackCard.jsx';

const BrokerGroupGrid = ({ brokers }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const {
    selectedBrokers,
    toggleBroker,
    selectionStats,
    startComparison,
    isLoading,
    error
  } = useBrokerComparisonContext();

  const groupedBrokers = useMemo(() => {
    if (!brokers || brokers.length === 0) return [];

    const groups = new Map();
    const ungrouped = [];

    brokers.forEach(broker => {
      const groupName = extractGroupName(broker.name);

      if (groupName) {
        if (!groups.has(groupName)) {
          groups.set(groupName, {
            groupName,
            brokers: [],
            allRegulators: new Set()
          });
        }

        const group = groups.get(groupName);
        group.brokers.push(broker);

        if (broker.regulatorDetails) {
          broker.regulatorDetails.forEach(reg => {
            group.allRegulators.add(JSON.stringify(reg));
          });
        }
      } else {
        ungrouped.push(broker);
      }
    });

    const groupedBrokers = Array.from(groups.values()).map(group => ({
      ...group,
      allRegulators: Array.from(group.allRegulators).map(regStr => JSON.parse(regStr))
        .sort((a, b) => a.code.localeCompare(b.code))
    }));

    const singleBrokerGroups = ungrouped.map(broker => ({
      groupName: broker.name,
      brokers: [broker],
      allRegulators: broker.regulatorDetails || []
    }));

    return [...groupedBrokers, ...singleBrokerGroups];
  }, [brokers]);

  function extractGroupName(brokerName) {
    if (!brokerName) return null;

    const patterns = [
      /^(Plus500)[A-Z]{2,3}.*$/i,
      /^(IC Markets).*$/i,
      /^(XM).*$/i,
      /^(Exness).*$/i,
      /^(TMGM).*$/i,
      /^(HFM|HotForex).*$/i,
      /^(FXTM).*$/i,
      /^(FxPro).*$/i,
      /^(OANDA).*$/i,
      /^(IG).*$/i,
      /^(Saxo).*$/i,
      /^(AvaTrade).*$/i,
      /^(Tickmill).*$/i,
      /^(Vantage).*$/i,
      /^(BlackBull).*$/i,
      /^(CMC Markets).*$/i,
      /^(Doo Prime).*$/i,
      /^(Pepperstone).*$/i,
      /^(Eightcap).*$/i,
      /^(FP Markets).*$/i,
      /^(Axi).*$/i,
      /^(RoboForex).*$/i,
      /^(FOREX\.com).*$/i,
      /^(EBC).*$/i,
      /^(Blueberry).*$/i,
      /^(STARTRADER).*$/i,
      /^(DBG Markets).*$/i,
      /^(ZFX).*$/i
    ];

    for (const pattern of patterns) {
      const match = brokerName.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

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
        {groupedBrokers.map((brokerGroup, index) => {
          if (brokerGroup.brokers.length === 1) {
            const broker = brokerGroup.brokers[0];
            const isSelected = selectedBrokers.some(selected => selected.id === broker.id);
            const isMaxReached = selectionStats.maxReached && !isSelected;

            return (
              <article
                key={broker.id || broker.name}
                className={`bh-card bh-broker-card ${isSelected ? 'bh-card--selected' : ''} ${isMaxReached ? 'bh-card--disabled' : ''}`}
              >
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
                    {isSelected ? '移除对比' : '添加对比'}
                  </button>
                </div>
              </article>
            );
          } else {
            return (
              <BrokerStackCard
                key={`group-${brokerGroup.groupName}-${index}`}
                brokerGroup={brokerGroup}
              />
            );
          }
        })}
      </div>

      {selectionStats.canCompare && (
        <div className="bh-floating-compare">
          <div className="bh-floating-compare__content">
            <div className="bh-floating-compare__info">
              <span className="bh-floating-compare__title">
                已选择 {selectionStats.count} 个经纪商
              </span>
              <span className="bh-floating-compare__subtitle">
                {selectionStats.count === 5 ? '已达最大对比数量' : `还可选择 ${5 - selectionStats.count} 个`}
              </span>
            </div>
            <div className="bh-floating-compare__actions">
              <button
                className="btn btn-ghost btn-small"
                onClick={() => {
                  selectedBrokers.forEach(broker => toggleBroker(broker));
                }}
              >
                清空
              </button>
              <button
                className="btn btn-primary"
                onClick={startComparison}
                disabled={isLoading}
              >
                {isLoading ? '加载中...' : `开始对比 (${selectionStats.count})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bh-error-toast">
          <span className="bh-error-message">{error}</span>
        </div>
      )}
    </section>
  );
};

export default BrokerGroupGrid;