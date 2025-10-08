import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const CommunitySpotlight = ({ highlights, stats, events }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const hasHighlights = Array.isArray(highlights) && highlights.length > 0;
  const hasStats = Array.isArray(stats) && stats.length > 0;
  const hasEvents = Array.isArray(events) && events.length > 0;

  return (
    <section className="bh-section">
      <div className="bh-section-heading">
        <div>
          <h2>{translate('brokerHub.sections.community.title')}</h2>
          <p className="muted">{translate('brokerHub.sections.community.subtitle')}</p>
        </div>
        <div className="bh-context-indicator">
          <span className="bh-context-why">{translate('brokerHub.sections.community.whyWatch')}</span>
          <span className="bh-context-step">{translate('brokerHub.sections.community.currentStep')}</span>
        </div>
      </div>

      <div className="bh-community-grid">
        <div className="bh-card bh-community-feed">
          <h3>{translate('brokerHub.sections.community.trendingTitle')}</h3>
          {hasHighlights ? (
            <ul>
              {highlights.map((item) => (
                <li key={item.topic}>
                  <div className="bh-feed-meta">
                    <span className="bh-badge bh-badge--tag">{item.tag || translate('brokerHub.sections.community.defaultTag')}</span>
                    <span className="muted">{item.time}</span>
                  </div>
                  <h4>{item.topic}</h4>
                  {item.summary && <p className="muted">{item.summary}</p>}
                  <div className="bh-feed-stats">
                    <span>👥 {translate('brokerHub.sections.community.participantCount', { count: item.participants ?? 0 })}</span>
                    <span>💬 {translate('brokerHub.sections.community.commentCount', { count: item.comments ?? 0 })}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="muted">{translate('brokerHub.sections.community.emptyFeed')}</div>
          )}
        </div>

        <aside className="bh-community-sidebar">
          <div className="bh-card bh-community-stats">
            <h3>{translate('brokerHub.sections.community.statsTitle')}</h3>
            {hasStats ? (
              <ul>
                {stats.map((item) => (
                  <li key={item.label}>
                    <span className="bh-stat-value">{item.value}</span>
                    <span className="muted">{item.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="muted">{translate('brokerHub.sections.community.emptyFeed')}</div>
            )}
          </div>

          <div className="bh-card bh-community-events">
            <h3>{translate('brokerHub.sections.community.eventsTitle')}</h3>
            {hasEvents ? (
              <ul>
                {events.map((event) => (
                  <li key={event.title}>
                    <div>
                      <strong>{event.title}</strong>
                      <p className="muted">{event.date}</p>
                    </div>
                    <button className="btn btn-ghost">{translate('brokerHub.sections.community.remindMe')}</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="muted">{translate('brokerHub.sections.community.emptyEvents')}</div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CommunitySpotlight;
