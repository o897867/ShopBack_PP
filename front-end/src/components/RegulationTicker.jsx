import React, { useMemo, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { formatRelativeTime } from '../utils/brokerData.js';
import './RegulationTicker.css';

const RegulationTicker = ({ regulatoryNews = [], onViewDetails }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const getStatusType = (tag) => {
    if (!tag) return 'info';
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('warning') || tagLower.includes('警告') || tagLower.includes('suspend') || tagLower.includes('暂停')) {
      return 'warning';
    }
    if (tagLower.includes('fine') || tagLower.includes('罚款') || tagLower.includes('penalty')) {
      return 'danger';
    }
    if (tagLower.includes('approved') || tagLower.includes('合规') || tagLower.includes('compliant')) {
      return 'success';
    }
    return 'info';
  };

  const processedNews = useMemo(() => {
    return regulatoryNews
      .filter(item => item && item.title)
      .slice(0, 8)
      .map(item => ({
        id: item.id || item.title,
        brokerId: item.brokerId,
        brokerName: item.brokerName || translate('regulationTicker.unknownBroker'),
        title: item.title,
        tag: item.tag || translate('regulationTicker.defaultTag'),
        statusType: getStatusType(item.tag),
        timestamp: item.created_at,
        relative: formatRelativeTime(item.created_at, currentLanguage)
      }));
  }, [regulatoryNews, currentLanguage, translate]);

  const latestAlert = processedNews[0];

  return (
    <div className="regulation-ticker">
      <div className="regulation-ticker-header">
        <div>
          <h2 className="regulation-ticker-title">
            {translate('regulationTicker.title')}
          </h2>
          <p className="regulation-ticker-subtitle">{translate('regulationTicker.subtitle')}</p>
        </div>
        {onViewDetails && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onViewDetails()}
          >
            {translate('regulationTicker.viewAll')}
          </button>
        )}
      </div>

      {processedNews.length === 0 ? (
        <div className="regulation-ticker-empty">
          <p className="muted">{translate('regulationTicker.noUpdates')}</p>
        </div>
      ) : (
        <>
          {latestAlert && (
            <div className={`regulation-alert regulation-alert--${latestAlert.statusType}`}>
              <div className="regulation-alert-content">
                <div className="regulation-alert-header">
                  <span className={`regulation-badge regulation-badge--${latestAlert.statusType}`}>
                    {latestAlert.tag}
                  </span>
                  <span className="regulation-alert-time">{latestAlert.relative}</span>
                </div>
                <h3 className="regulation-alert-title">{latestAlert.title}</h3>
                <p className="regulation-alert-broker">
                  {translate('regulationTicker.regarding', { broker: latestAlert.brokerName })}
                </p>
              </div>
            </div>
          )}

          <div className="regulation-timeline">
            <div className="timeline-header">
              <h3 className="timeline-title">{translate('regulationTicker.recentUpdates')}</h3>
              <span className="timeline-count">
                {translate('regulationTicker.showing', { count: processedNews.length })}
              </span>
            </div>

            <ul className="timeline-list">
              {processedNews.slice(1).map((item) => (
                <li key={item.id} className={`timeline-item timeline-item--${item.statusType}`}>
                  <div className="timeline-marker">
                    <span className="timeline-dot"></span>
                    <span className="timeline-line"></span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className={`regulation-badge regulation-badge--${item.statusType} regulation-badge--sm`}>
                        {item.tag}
                      </span>
                      <span className="timeline-time">{item.relative}</span>
                    </div>
                    <h4 className="timeline-event-title">{item.title}</h4>
                    <p className="timeline-broker">
                      {item.brokerName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default RegulationTicker;
