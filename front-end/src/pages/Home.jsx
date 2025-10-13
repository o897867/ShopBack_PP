import React, { useCallback, useMemo } from 'react';
import './Home.css';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import useBrokerHubData from '../hooks/useBrokerHubData.js';
import {
  parseRegulators,
  parseBreakdownEntries,
  gradeToScore,
  computeCompositeScore,
  formatRelativeTime
} from '../utils/brokerData.js';

const getStatusMetadata = (score, translate) => {
  if (!Number.isFinite(score)) {
    return {
      id: 'unknown',
      label: translate('home.board.status.unknown'),
      tone: 'neutral'
    };
  }
  if (score >= 92) {
    return {
      id: 'live',
      label: translate('home.board.status.live'),
      tone: 'positive'
    };
  }
  if (score >= 86) {
    return {
      id: 'review',
      label: translate('home.board.status.review'),
      tone: 'warning'
    };
  }
  if (score >= 78) {
    return {
      id: 'watch',
      label: translate('home.board.status.watch'),
      tone: 'attention'
    };
  }
  return {
    id: 'hold',
    label: translate('home.board.status.hold'),
    tone: 'neutral'
  };
};

const Home = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);
  const locale = currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US';
  const formatNumber = useCallback((value) => new Intl.NumberFormat(locale).format(value ?? 0), [locale]);
  const {
    brokers: rawBrokers,
    brokerNews,
    threads,
    threadHighlights,
    loading,
    error,
    refresh
  } = useBrokerHubData();

  const communityAnalytics = useMemo(() => {
    const uniqueAuthors = new Set();
    const now = Date.now();

    (threads || []).forEach((thread) => {
      if (thread?.author_name) uniqueAuthors.add(thread.author_name);
    });

    (threadHighlights || []).forEach((highlight) => {
      (highlight.participantNames || []).forEach((name) => uniqueAuthors.add(name));
    });

    const threadsThisWeek = (threads || []).filter((thread) => {
      const timestamp = thread?.last_post_at || thread?.created_at;
      if (!timestamp) return false;
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return false;
      const diff = now - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const totalPosts = (threadHighlights || []).reduce((sum, item) => sum + (item.postsCount || 0), 0);

    return {
      uniqueAuthors: uniqueAuthors.size,
      threadsThisWeek,
      totalPosts
    };
  }, [threads, threadHighlights]);

  const processedBrokers = useMemo(() => {
    return (rawBrokers || [])
      .map((broker) => {
        const breakdownEntries = parseBreakdownEntries(broker.rating_breakdown, translate);
        const compositeScore = computeCompositeScore(broker.rating_breakdown) ?? gradeToScore(broker.rating);
        const regulators = parseRegulators(broker.regulators, broker.regulator_details);
        const topFeature = breakdownEntries[0]?.label;
        return {
          id: broker.id,
          name: broker.name,
          rating: broker.rating,
          score: compositeScore,
          regulators,
          topFeature
        };
      })
      .filter((broker) => broker.name)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [rawBrokers, translate]);

  const boardRows = useMemo(() => {
    return processedBrokers.slice(0, 6).map((broker, index) => {
      const status = getStatusMetadata(broker.score ?? 0, translate);
      return {
        ...broker,
        position: index + 1,
        status,
        regulatorCount: broker.regulators?.length || 0,
        focus: broker.topFeature || translate('home.board.focusFallback')
      };
    });
  }, [processedBrokers, translate]);

  const heroMetrics = useMemo(() => ([
    {
      id: 'brokers',
      value: formatNumber(rawBrokers?.length || 0),
      label: translate('home.metrics.brokers'),
      helper: translate('home.metrics.brokersHelper', { count: rawBrokers?.length || 0 })
    },
    {
      id: 'alerts',
      value: formatNumber(brokerNews?.length || 0),
      label: translate('home.metrics.alerts'),
      helper: translate('home.metrics.alertsHelper', { count: brokerNews?.length || 0 })
    },
    {
      id: 'community',
      value: formatNumber(communityAnalytics.uniqueAuthors || 0),
      label: translate('home.metrics.community'),
      helper: translate('home.metrics.communityHelper', { count: communityAnalytics.uniqueAuthors || 0 })
    }
  ]), [rawBrokers, brokerNews, communityAnalytics, translate, formatNumber]);

  const quickActions = useMemo(() => ([
    {
      id: 'compare',
      title: translate('home.quickActions.compare.title'),
      description: translate('home.quickActions.compare.description'),
      target: 'broker-hub'
    },
    {
      id: 'analytics',
      title: translate('home.quickActions.analytics.title'),
      description: translate('home.quickActions.analytics.description'),
      target: 'analytics'
    },
    {
      id: 'community',
      title: translate('home.quickActions.community.title'),
      description: translate('home.quickActions.community.description'),
      target: 'forum'
    }
  ]), [translate]);

  const activityFeed = useMemo(() => {
    const newsItems = (brokerNews || []).slice(0, 5).map((item) => ({
      id: `news-${item.id || item.title}`,
      title: item.title || translate('home.timeline.newsFallback', { broker: item.brokerName || translate('home.timeline.unknownBroker') }),
      context: item.tag
        ? translate('home.timeline.tagged', { tag: item.tag, broker: item.brokerName })
        : translate('home.timeline.generic', { broker: item.brokerName || translate('home.timeline.unknownBroker') }),
      timestamp: item.created_at,
      relative: formatRelativeTime(item.created_at, currentLanguage),
      tone: 'signal'
    }));

    const threadItems = (threads || []).slice(0, 5).map((thread) => ({
      id: `thread-${thread.id || thread.title}`,
      title: thread.title || translate('home.timeline.threadFallback'),
      context: thread.author_name
        ? translate('home.timeline.threadBy', { author: thread.author_name })
        : translate('home.timeline.threadAnonymous'),
      timestamp: thread.last_post_at || thread.created_at,
      relative: formatRelativeTime(thread.last_post_at || thread.created_at, currentLanguage),
      tone: 'community'
    }));

    return [...newsItems, ...threadItems]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 7);
  }, [brokerNews, threads, translate, currentLanguage]);

  const highlight = boardRows[0];

  const handleNavigate = (target) => {
    if (!onNavigate) return;
    onNavigate(target);
  };

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__content">
            <div className="home-hero__topline">
              <span className="home-hero__badge">{translate('home.hero.badge')}</span>
              <div className="home-hero__toggles">
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </div>
            <h1 className="home-hero__title">{translate('home.hero.title')}</h1>
            <p className="home-hero__subtitle">{translate('home.hero.subtitle')}</p>
            <div className="home-hero__actions">
              <button className="btn btn-primary" onClick={() => handleNavigate('broker-hub')}>
                {translate('home.hero.primary')}
              </button>
              <button className="btn btn-ghost" onClick={() => handleNavigate('analytics')}>
                {translate('home.hero.secondary')}
              </button>
            </div>
            <div className="home-hero__metrics">
              {heroMetrics.map((metric) => (
                <div key={metric.id} className="home-hero__metric">
                  <span className="home-hero__metric-value">{metric.value}</span>
                  <span className="home-hero__metric-label">{metric.label}</span>
                  <span className="home-hero__metric-helper">{metric.helper}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="home-hero__preview">
            <div className="home-preview-card">
              <div className="home-preview-card__header">
                <span>{translate('home.preview.title')}</span>
                <span className="home-preview-card__badge">{translate('home.preview.badge')}</span>
              </div>
              {loading ? (
                <div className="home-preview-card__empty">{translate('home.preview.loading')}</div>
              ) : boardRows.length === 0 ? (
                <div className="home-preview-card__empty">{translate('home.preview.empty')}</div>
              ) : (
                <ul className="home-preview-card__list">
                  {boardRows.slice(0, 3).map((broker) => (
                    <li key={broker.id} className="home-preview-card__item">
                      <span className="home-preview-card__rank">#{broker.position}</span>
                      <div className="home-preview-card__meta">
                        <span className="home-preview-card__name">{broker.name}</span>
                        <span className="home-preview-card__feature">{broker.focus}</span>
                      </div>
                      <span className={`home-pill home-pill--${broker.status.tone}`}>{broker.status.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="home-main container">
        {loading ? (
          <div className="home-card home-card--state">
            <div className="muted">{translate('home.states.loading')}</div>
          </div>
        ) : error ? (
          <div className="home-card home-card--state">
            <div className="muted" style={{ marginBottom: 12 }}>{translate('home.states.error')}</div>
            <div className="muted" style={{ fontSize: '0.9rem', marginBottom: 16 }}>{error}</div>
            <button className="btn btn-primary" onClick={refresh}>{translate('home.states.retry')}</button>
          </div>
        ) : (
          <>
            <section className="home-section">
              <header className="home-section__header">
                <div>
                  <h2 className="home-section__title">{translate('home.workspace.title')}</h2>
                  <p className="home-section__subtitle">{translate('home.workspace.subtitle')}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => handleNavigate('broker-hub')}>
                  {translate('home.workspace.cta')}
                </button>
              </header>

              <div className="home-workspace">
                <div className="home-board">
                  <div className="home-board__head">
                    <span>{translate('home.board.title')}</span>
                    <span className="home-board__helper">{translate('home.board.helper')}</span>
                  </div>
                  <div className="home-board__table">
                    <div className="home-board__row home-board__row--header">
                      <span>{translate('home.board.column.broker')}</span>
                      <span>{translate('home.board.column.status')}</span>
                      <span>{translate('home.board.column.score')}</span>
                      <span>{translate('home.board.column.regulators')}</span>
                      <span>{translate('home.board.column.actions')}</span>
                    </div>
                    {boardRows.map((broker) => (
                      <div key={broker.id} className="home-board__row">
                        <div className="home-board__cell home-board__cell--primary">
                          <span className="home-board__position">#{broker.position}</span>
                          <div>
                            <div className="home-board__name">{broker.name}</div>
                            <div className="home-board__note">{broker.focus}</div>
                          </div>
                        </div>
                        <div className="home-board__cell">
                          <span className={`home-pill home-pill--${broker.status.tone}`}>{broker.status.label}</span>
                        </div>
                        <div className="home-board__cell">
                          <span className="home-badge home-badge--score">{broker.score ?? '—'}</span>
                        </div>
                        <div className="home-board__cell">
                          <span className="home-badge home-badge--neutral">
                            {translate('home.board.regulatorCount', { count: broker.regulatorCount })}
                          </span>
                        </div>
                        <div className="home-board__cell">
                          <button className="home-link" onClick={() => handleNavigate('broker-hub')}>
                            {translate('home.board.viewProfile')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="home-aside">
                  <div className="home-card home-card--highlight">
                    <div className="home-card__eyebrow">{translate('home.highlight.title')}</div>
                    {highlight ? (
                      <>
                        <h3 className="home-card__headline">{translate('home.highlight.headline', { broker: highlight.name })}</h3>
                        <p className="home-card__body">
                          {translate('home.highlight.description', {
                            score: highlight.score ?? '—',
                            focus: highlight.focus
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="home-card__body">{translate('home.highlight.empty')}</p>
                    )}
                    <button className="btn btn-primary" onClick={() => handleNavigate('analytics')}>
                      {translate('home.highlight.cta')}
                    </button>
                  </div>

                  <div className="home-card home-card--actions">
                    <h3 className="home-card__title">{translate('home.quickActions.title')}</h3>
                    <ul className="home-action-list">
                      {quickActions.map((action) => (
                        <li key={action.id} className="home-action-list__item">
                          <div>
                            <div className="home-action-list__title">{action.title}</div>
                            <div className="home-action-list__description">{action.description}</div>
                          </div>
                          <button className="home-link" onClick={() => handleNavigate(action.target)}>
                            {translate('home.quickActions.launch')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="home-card home-card--timeline">
                    <h3 className="home-card__title">{translate('home.timeline.title')}</h3>
                    <p className="home-card__body">{translate('home.timeline.subtitle')}</p>
                    {activityFeed.length === 0 ? (
                      <div className="home-card__empty">{translate('home.timeline.empty')}</div>
                    ) : (
                      <ul className="home-timeline">
                        {activityFeed.map((item) => (
                          <li key={item.id} className={`home-timeline__item home-timeline__item--${item.tone}`}>
                            <div className="home-timeline__meta">
                              <span className="home-timeline__title">{item.title}</span>
                              <span className="home-timeline__relative">{item.relative}</span>
                            </div>
                            <div className="home-timeline__context">{item.context}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </aside>
              </div>
            </section>

            <section className="home-section home-section--community">
              <header className="home-section__header">
                <div>
                  <h2 className="home-section__title">{translate('home.community.title')}</h2>
                  <p className="home-section__subtitle">{translate('home.community.subtitle')}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => handleNavigate('forum')}>
                  {translate('home.community.cta')}
                </button>
              </header>
              <div className="home-community">
                <div className="home-community__stats">
                  <div className="home-community__stat">
                    <span className="home-community__value">{formatNumber(communityAnalytics.uniqueAuthors)}</span>
                    <span className="home-community__label">{translate('home.community.stats.voices')}</span>
                  </div>
                  <div className="home-community__stat">
                    <span className="home-community__value">{formatNumber(communityAnalytics.threadsThisWeek)}</span>
                    <span className="home-community__label">{translate('home.community.stats.threads')}</span>
                  </div>
                  <div className="home-community__stat">
                    <span className="home-community__value">{formatNumber(communityAnalytics.totalPosts)}</span>
                    <span className="home-community__label">{translate('home.community.stats.posts')}</span>
                  </div>
                </div>

                <div className="home-card home-card--feed">
                  <h3 className="home-card__title">{translate('home.community.feedTitle')}</h3>
                  <p className="home-card__body">{translate('home.community.feedSubtitle')}</p>
                  <ul className="home-feed">
                    {(threadHighlights || []).slice(0, 4).map((thread) => (
                      <li key={thread.id || thread.title} className="home-feed__item">
                        <div className="home-feed__topic">{thread.title || translate('home.community.feedFallback')}</div>
                        <div className="home-feed__meta">
                          <span>{thread.author_name || translate('home.community.anonymous')}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(thread.lastActivity || thread.created_at, currentLanguage)}</span>
                        </div>
                      </li>
                    ))}
                    {(threadHighlights || []).length === 0 && (
                      <li className="home-feed__empty">{translate('home.community.feedEmpty')}</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
