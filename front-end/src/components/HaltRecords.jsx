import React from 'react';
import './HaltRecords.css';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const HaltRecords = ({ records = [] }) => {
  const { currentLanguage } = useLanguage();
  const translate = (key, params) => t(key, currentLanguage, params);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  };

  const getBrokerLogo = (brokerName) => {
    if (!brokerName) return null;
    const normalized = brokerName.toLowerCase().replace(/\s+/g, '');
    const logoMap = {
      'fxcm': 'fxcm.png',
      'icmarkets': 'ic.png',
      'exness': 'exness.png',
      'tmgm': 'tmgm.png',
      'ecmarket': 'ec.png',
      'avatrade': 'ava.png',
      'ebc': 'ebc.png',
      'pepperstone': 'pepperstone.png'
    };
    const logoFile = logoMap[normalized];
    return logoFile ? `/broker-logos/${logoFile}` : null;
  };

  // Group records into sets of 3 for the grid layout
  const groupedRecords = [];
  for (let i = 0; i < Math.min(records.length, 6); i += 3) {
    groupedRecords.push(records.slice(i, i + 3));
  }

  return (
    <div className="halt-records">
      <div className="halt-records__header">
        <h2 className="halt-records__title">
          {translate('slippageRecords.title')}
        </h2>
        <p className="halt-records__subtitle">
          {translate('slippageRecords.subtitle')}
        </p>
      </div>

      {records.length === 0 ? (
        <div className="halt-records__empty">
          {translate('slippageRecords.noData')}
        </div>
      ) : (
        <div className="halt-records__grid">
          {groupedRecords.map((group, groupIndex) => (
            <div key={groupIndex} className="halt-records__row">
              {group.map((record, index) => {
                const cardIndex = groupIndex * 3 + index;

                return (
                  <div
                    key={record.id || cardIndex}
                    className="halt-card"
                  >
                    <div className="halt-card__inner">
                      <div className="halt-card__front">
                        {getBrokerLogo(record.broker_name) && (
                          <div className="halt-card__logo">
                            <img
                              src={getBrokerLogo(record.broker_name)}
                              alt={record.broker_name}
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        <div className="halt-card__broker">
                          {record.broker_name}
                        </div>
                        <div className="halt-card__platform">
                          {record.platform}
                        </div>
                      </div>
                      <div className="halt-card__back">
                        <div className="halt-card__date-label">
                          {translate('slippageRecords.columns.date')}
                        </div>
                        <div className="halt-card__date">
                          {formatDate(record.halt_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HaltRecords;
