import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const QuickFilterCards = ({ activeFilter, onFilterSelect, onClearFilter }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const presets = [
    {
      id: 'beginner',
      title: translate('brokerHub.quickFilters.presets.beginner.title'),
      description: translate('brokerHub.quickFilters.presets.beginner.description'),
      icon: '🎯'
    },
    {
      id: 'lowCost',
      title: translate('brokerHub.quickFilters.presets.lowCost.title'),
      description: translate('brokerHub.quickFilters.presets.lowCost.description'),
      icon: '💰'
    },
    {
      id: 'topRegulation',
      title: translate('brokerHub.quickFilters.presets.topRegulation.title'),
      description: translate('brokerHub.quickFilters.presets.topRegulation.description'),
      icon: '🛡️'
    }
  ];

  return (
    <div className="bh-quick-filters">
      <div className="bh-quick-filters__header">
        <div>
          <h3 className="bh-quick-filters__title">
            {translate('brokerHub.quickFilters.title')}
          </h3>
          <p className="bh-quick-filters__subtitle">
            {translate('brokerHub.quickFilters.subtitle')}
          </p>
        </div>
        {activeFilter && (
          <button
            className="btn btn-ghost btn-small"
            onClick={onClearFilter}
          >
            {translate('brokerHub.quickFilters.clearFilter')}
          </button>
        )}
      </div>
      <div className="bh-quick-filters__grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`bh-filter-card ${activeFilter === preset.id ? 'bh-filter-card--active' : ''}`}
            onClick={() => onFilterSelect(preset.id)}
          >
            <span className="bh-filter-card__icon">{preset.icon}</span>
            <div className="bh-filter-card__content">
              <h4 className="bh-filter-card__title">{preset.title}</h4>
              <p className="bh-filter-card__description">{preset.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickFilterCards;
