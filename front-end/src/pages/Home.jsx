import React, { useCallback, useMemo, useState } from 'react';
import './Home.css';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import BrokerScorePanel from '../components/BrokerScorePanel.jsx';
import RebateComparison from '../components/RebateComparison.jsx';
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
  const [visibleSections, setVisibleSections] = useState(() => ({ hero: true }));

  const {
    brokers: rawBrokers,
    brokerNews,
    threads,
    threadHighlights,
    loading,
    error,
    refresh
  } = useBrokerHubData();

  // Intersection Observer for scroll animations
  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const sectionNodes = Array.from(document.querySelectorAll('[data-section]'));
    if (sectionNodes.length === 0) {
      return undefined;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for environments without IntersectionObserver support
      setVisibleSections((prev) => {
        const nextState = { ...prev };
        sectionNodes.forEach((node) => {
          const id = node.dataset.section;
          if (id) nextState[id] = true;
        });
        return nextState;
      });
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.dataset.section;
          if (!sectionId) return;

          if (entry.isIntersecting) {
            setVisibleSections((prev) => {
              if (prev[sectionId]) return prev;
              return { ...prev, [sectionId]: true };
            });
          } else if (sectionId !== 'hero') {
            setVisibleSections((prev) => {
              if (!prev[sectionId]) return prev;
              return { ...prev, [sectionId]: false };
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '120px 0px 120px 0px' }
    );

    sectionNodes.forEach((node) => observer.observe(node));

    return () => {
      sectionNodes.forEach((node) => observer.unobserve(node));
      observer.disconnect();
    };
  }, [loading, error]);

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

  const formattedBrokers = useMemo(() => {
    const allBrokers = (rawBrokers || [])
      .map((broker) => {
        const regulatorDetails = parseRegulators(broker.regulators, broker.regulator_details);
        const breakdownEntries = parseBreakdownEntries(broker.rating_breakdown, translate);
        const compositeScore = computeCompositeScore(broker.rating_breakdown) ?? gradeToScore(broker.rating);

        return {
          id: broker.id,
          name: broker.name,
          rating: broker.rating,
          ratingScore: compositeScore,
          score: compositeScore,
          regulators: broker.regulators,
          regulatorDetails,
          website: broker.website,
          logo_url: broker.logo_url,
          breakdown: breakdownEntries
        };
      })
      .filter((broker) => broker.name)
      .sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0));

    // Filter to show 8 premium brokers: TMGM, Exness, IC Markets, Pepperstone, AvaTrade, FXTM, EBC, ECMarket
    const targetBrokers = ['tmgm', 'exness', 'ic markets', 'ic market', 'pepperstone', 'avatrade', 'fxtm', 'ebc', 'ecmarket'];
    return allBrokers.filter((broker) =>
      targetBrokers.some(target => broker.name.toLowerCase().includes(target))
    );
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
      {/* Hero Section - Always visible */}
      <section className="home-hero" data-section="hero">
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

      <main className="home-main">
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
            {/* Segment 1: Broker Score Panel */}
            <section
              className={`home-segment home-segment--alt ${visibleSections.scores ? 'home-segment--visible' : ''}`}
              data-section="scores"
            >
              <BrokerScorePanel
                brokers={formattedBrokers}
                onBrokerClick={(broker) => handleNavigate('broker-hub')}
              />
            </section>

            {/* Segment 2: Rebate Comparison */}
            <section
              className={`home-segment home-segment--alt ${visibleSections.rebate ? 'home-segment--visible' : ''}`}
              data-section="rebate"
            >
              <RebateComparison brokers={formattedBrokers} />
            </section>

            {/* Segment 3: Trust & Social Proof */}
            <section
              className={`home-segment ${visibleSections.trust ? 'home-segment--visible' : ''}`}
              data-section="trust"
            >
              <header className="home-section__header">
                <div>
                  <h2 className="home-section__title">{translate('trustSection.title')}</h2>
                  <p className="home-section__subtitle">{translate('trustSection.subtitle')}</p>
                </div>
              </header>
              <div className="trust-grid">
                <div className="trust-stats">
                  <div className="trust-stat-card">
                    <span className="trust-stat-value">50,000+</span>
                    <span className="trust-stat-label">{translate('trustSection.stats.users')}</span>
                  </div>
                  <div className="trust-stat-card">
                    <span className="trust-stat-value">2.5M+</span>
                    <span className="trust-stat-label">{translate('trustSection.stats.trades')}</span>
                  </div>
                  <div className="trust-stat-card">
                    <span className="trust-stat-value">98%</span>
                    <span className="trust-stat-label">{translate('trustSection.stats.satisfaction')}</span>
                  </div>
                </div>
                <div className="trust-partners">
                  <h3 className="trust-subsection-title">{translate('trustSection.partners.title')}</h3>
                  <p className="trust-subsection-subtitle">{translate('trustSection.partners.subtitle')}</p>
                  <div className="trust-partner-logos">
                    {processedBrokers.slice(0, 6).map((broker, index) => (
                      <div key={broker.id} className="trust-partner-logo" style={{ animationDelay: `${index * 100}ms` }}>
                        {broker.logo_url ? (
                          <img src={broker.logo_url} alt={broker.name} />
                        ) : (
                          <span>{broker.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
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
