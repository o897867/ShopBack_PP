import React, { useCallback, useMemo, useState } from 'react';
import './BrokerHub.css';
import BrokerGroupGrid from '../components/BrokerGroupGrid.jsx';
import RankingBoard from '../components/RankingBoard.jsx';
import CommunitySpotlight from '../components/CommunitySpotlight.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import OnboardingStepper from '../components/OnboardingStepper.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import useBrokerHubData from '../hooks/useBrokerHubData.js';
import { BrokerComparisonProvider } from '../hooks/useBrokerComparison.jsx';
import BrokerCompareModal from '../components/BrokerCompareModal.jsx';
import {
  parseRegulators,
  parseBreakdownEntries,
  gradeToScore,
  computeCompositeScore,
  formatRelativeTime,
  formatWebsiteHost
} from '../utils/brokerData.js';

const BrokerHub = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);
  const [currentSection, setCurrentSection] = useState('broker');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const { brokers: rawBrokers, brokerNews, threads, threadHighlights, loading, error, refresh } = useBrokerHubData();

  const handleStepClick = useCallback((step) => {
    setOnboardingStep(step);
    if (step === 1) {
      setCurrentSection('broker');
    } else if (step === 2) {
      setCurrentSection('ranking');
    } else if (step === 3) {
      setCurrentSection('community');
    }
  }, []);

  const navItems = useMemo(() => ([
    { id: 'broker', label: translate('brokerHub.nav.brokers') },
    { id: 'ranking', label: translate('brokerHub.nav.ranking') },
    { id: 'community', label: translate('brokerHub.nav.community') }
  ]), [translate]);

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

  const formattedBrokers = useMemo(() => {
    return (rawBrokers || [])
      .map((broker) => {
        const regulatorDetails = parseRegulators(broker.regulators, broker.regulator_details);
        const breakdownEntries = parseBreakdownEntries(broker.rating_breakdown, translate);
        const compositeScore = computeCompositeScore(broker.rating_breakdown) ?? gradeToScore(broker.rating);
        const featureStrings = breakdownEntries.slice(0, 3).map((entry) => translate('brokerHub.sections.brokers.featureTemplate', { label: entry.label, score: entry.score }));

        return {
          id: broker.id,
          name: broker.name,
          rating: broker.rating,
          ratingScore: compositeScore,
          regulators: broker.regulators,
          regulatorDetails,
          website: broker.website,
          logo_url: broker.logo_url,
          breakdown: breakdownEntries,
          metrics: [
            {
              label: translate('brokerHub.sections.brokers.metrics.regulators'),
              value: regulatorDetails.length
                ? { type: 'regulators', items: regulatorDetails }
                : translate('brokerHub.sections.brokers.metrics.noData')
            },
            {
              label: translate('brokerHub.sections.brokers.metrics.rating'),
              value: broker.rating || translate('brokerHub.sections.brokers.metrics.noData')
            },
            {
              label: translate('brokerHub.sections.brokers.metrics.website'),
              value: broker.website ? formatWebsiteHost(broker.website) : translate('brokerHub.sections.brokers.metrics.noData')
            }
          ],
          features: featureStrings
        };
      })
      .sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0));
  }, [rawBrokers, translate]);

  const rankings = useMemo(() => {
    return formattedBrokers
      .map((broker) => {
        const score = broker.ratingScore ?? gradeToScore(broker.rating);
        if (!Number.isFinite(score)) return null;
        const topFeature = broker.breakdown?.[0];
        const summary = topFeature
          ? translate('brokerHub.sections.ranking.summaryTemplate', {
              feature: topFeature.label,
              score: topFeature.score,
              rating: broker.rating || score
            })
          : translate('brokerHub.sections.ranking.summaryFallback', { rating: broker.rating || score });
        return {
          id: broker.id,
          name: broker.name,
          score,
          summary
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [formattedBrokers, translate]);

  const rankingUpdates = useMemo(() => {
    if (!brokerNews || brokerNews.length === 0) return [];
    return brokerNews
      .slice(0, 6)
      .map((item, index) => ({
        id: `${item.brokerId || 'broker'}-${item.id ?? index}`,
        title: item.title,
        body: item.tag
          ? translate('brokerHub.sections.ranking.updateTemplate', { broker: item.brokerName, tag: item.tag })
          : translate('brokerHub.sections.ranking.updateFallback', { broker: item.brokerName }),
        time: formatRelativeTime(item.created_at, currentLanguage)
      }));
  }, [brokerNews, translate, currentLanguage]);

  const communityHighlightsData = useMemo(() => {
    if (!threadHighlights || threadHighlights.length === 0) return [];
    return threadHighlights.map((thread) => {
      const tag = (thread.tags && thread.tags[0]) || translate('brokerHub.sections.community.defaultTag');
      const summary = thread.author_name
        ? translate('brokerHub.sections.community.threadSummary', { author: thread.author_name })
        : translate('brokerHub.sections.community.threadSummaryNoAuthor', {
            time: formatRelativeTime(thread.created_at, currentLanguage)
          });
      return {
        topic: thread.title,
        summary,
        tag,
        time: formatRelativeTime(thread.lastActivity || thread.created_at, currentLanguage),
        participants: thread.participantsCount || 0,
        comments: thread.postsCount || 0
      };
    });
  }, [threadHighlights, translate, currentLanguage]);

  const communityStats = useMemo(() => ([
    {
      label: translate('brokerHub.sections.community.stats.activeContributors'),
      value: communityAnalytics.uniqueAuthors.toString()
    },
    {
      label: translate('brokerHub.sections.community.stats.threadsThisWeek'),
      value: communityAnalytics.threadsThisWeek.toString()
    },
    {
      label: translate('brokerHub.sections.community.stats.totalPosts'),
      value: communityAnalytics.totalPosts.toString()
    }
  ]), [communityAnalytics, translate]);

  const communityEvents = useMemo(() => {
    if (!brokerNews || brokerNews.length === 0) return [];
    return brokerNews.slice(0, 3).map((item, index) => ({
      title: translate('brokerHub.sections.community.eventsFromNews', { broker: item.brokerName }),
      date: formatRelativeTime(item.created_at, currentLanguage),
      id: `${item.brokerId || 'broker'}-event-${item.id ?? index}`
    }));
  }, [brokerNews, translate, currentLanguage]);

  const heroMetrics = useMemo(() => ([
    {
      label: translate('brokerHub.metrics.brokers.label'),
      value: (rawBrokers?.length || 0).toString(),
      helper: translate('brokerHub.metrics.brokers.helper', { count: rawBrokers?.length || 0 })
    },
    {
      label: translate('brokerHub.metrics.alerts.label'),
      value: (brokerNews?.length || 0).toString(),
      helper: translate('brokerHub.metrics.alerts.helper', { count: brokerNews?.length || 0 })
    },
    {
      label: translate('brokerHub.metrics.sentiment.label'),
      value: communityAnalytics.uniqueAuthors.toString(),
      helper: translate('brokerHub.metrics.sentiment.helper', { count: communityAnalytics.uniqueAuthors })
    }
  ]), [rawBrokers, brokerNews, communityAnalytics, translate]);

  return (
    <BrokerComparisonProvider>
      <div className="broker-hub">
      <section className="bh-hero">
        <div className="bh-hero__container">
          <div className="bh-hero__surface">
            <div className="bh-hero__topline">
              <div className="bh-hero__identity">
                {onNavigate && (
                  <button
                    className="btn btn-ghost bh-back"
                    onClick={() => onNavigate('home')}
                  >
                    {translate('brokerHub.back')}
                  </button>
                )}
                <span className="bh-brand">{translate('brokerHub.brand')}</span>
              </div>
              <div className="bh-hero__controls">
                <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
                  {translate('brokerHub.actions.refresh')}
                </button>
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </div>

            <div className="bh-hero__content">
              <div>
                <span className="bh-eyebrow">{translate('brokerHub.hero.eyebrow')}</span>
                <h1 className="bh-title">{translate('brokerHub.hero.title')}</h1>
                <p className="bh-subtitle">{translate('brokerHub.hero.description')}</p>
              </div>

              <div className="bh-hero__metrics">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="bh-kpi">
                    <span className="bh-kpi__value">{metric.value}</span>
                    <span className="bh-kpi__label">{metric.label}</span>
                    <span className="bh-kpi__helper">{metric.helper}</span>
                  </div>
                ))}
              </div>
            </div>

            <OnboardingStepper
              currentStep={onboardingStep}
              onStepClick={handleStepClick}
            />
          </div>
        </div>
      </section>

      <nav className="bh-primary-nav container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`bh-nav-pill ${currentSection === item.id ? 'bh-nav-pill--active' : ''}`}
            onClick={() => setCurrentSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="bh-main">
        {loading ? (
          <div className="bh-card" style={{ textAlign: 'center' }}>
            <div className="muted">{translate('brokerHub.loading')}</div>
          </div>
        ) : error ? (
          <div className="bh-card" style={{ textAlign: 'center' }}>
            <div className="muted" style={{ marginBottom: 12 }}>{translate('brokerHub.errors.loadFailed')}</div>
            <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>
            <button className="btn btn-primary" onClick={refresh}>{translate('brokerHub.actions.retry')}</button>
          </div>
        ) : (
          <>
            {currentSection === 'broker' && <BrokerGroupGrid brokers={formattedBrokers} />}
            {currentSection === 'ranking' && (
              <RankingBoard rankings={rankings} updates={rankingUpdates} />
            )}
            {currentSection === 'community' && (
              <CommunitySpotlight
                highlights={communityHighlightsData}
                stats={communityStats}
                events={communityEvents}
              />
            )}
          </>
        )}
        </main>

        {/* Broker对比弹窗 */}
        <BrokerCompareModal />
      </div>
    </BrokerComparisonProvider>
  );
};

export default BrokerHub;
