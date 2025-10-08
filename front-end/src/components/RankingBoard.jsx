import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const RankingBoard = ({ rankings, updates }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const hasRankings = Array.isArray(rankings) && rankings.length > 0;
  const hasUpdates = Array.isArray(updates) && updates.length > 0;

  return (
    <section className="bh-section">
      <div className="bh-section-heading">
        <div>
          <h2>{translate('brokerHub.sections.ranking.title')}</h2>
          <p className="muted">{translate('brokerHub.sections.ranking.subtitle')}</p>
        </div>
        <div className="bh-context-indicator">
          <span className="bh-context-why">{translate('brokerHub.sections.ranking.whyWatch')}</span>
          <span className="bh-context-step">{translate('brokerHub.sections.ranking.currentStep')}</span>
        </div>
      </div>

      <div className="bh-ranking-layout">
        <ol className="bh-ranking-list">
          {hasRankings ? (
            rankings.map((item, index) => (
              <li key={item.name} className={`bh-ranking-row ${index < 3 ? 'bh-ranking-row--top' : ''}`}>
                <div className="bh-rank-number">{index + 1}</div>
                <div className="bh-rank-content">
                  <div className="bh-rank-header">
                    <h3>{item.name}</h3>
                    {typeof item.delta === 'number' && !Number.isNaN(item.delta) && (
                      <span className={`bh-delta bh-delta--${item.delta >= 0 ? 'up' : 'down'}`}>
                        {item.delta >= 0 ? '▲' : '▼'} {Math.abs(item.delta)}
                      </span>
                    )}
                  </div>
                  {item.summary && <p className="muted">{item.summary}</p>}
                  <div className="bh-score-bar">
                    <span className="bh-score-label">{translate('brokerHub.sections.ranking.compositeLabel')}</span>
                    <div className="bh-score-meter">
                      <span style={{ width: `${Math.min(Math.max(item.score || 0, 0), 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bh-rank-score">{Math.round(item.score || 0)}</div>
              </li>
            ))
          ) : (
            <li className="bh-ranking-row">
              <div className="bh-rank-content" style={{ gridColumn: '1 / span 3' }}>
                <div className="muted">{translate('brokerHub.sections.ranking.empty')}</div>
              </div>
            </li>
          )}
        </ol>

        <aside className="bh-card bh-ranking-updates">
          <h3>{translate('brokerHub.sections.ranking.updatesTitle')}</h3>
          {hasUpdates ? (
            <ul>
              {updates.map((update) => (
                <li key={update.id || update.title}>
                  <span className="bh-update-time">{update.time}</span>
                  <div>
                    <strong>{update.title}</strong>
                    {update.body && <p className="muted">{update.body}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="muted">{translate('brokerHub.sections.ranking.emptyUpdates')}</div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default RankingBoard;
