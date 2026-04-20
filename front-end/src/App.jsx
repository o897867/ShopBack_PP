import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import Navigation from './components/Navigation.jsx';

// Weekly mindmap module (lazy-loaded, fully isolated)
const TimelineView = lazy(() => import('./weekly/pages/TimelineView.tsx'));
const NodeDetailPage = lazy(() => import('./weekly/pages/NodeDetailPage.tsx'));
const TopicsView = lazy(() => import('./weekly/pages/TopicsView.tsx'));
const GraphView = lazy(() => import('./weekly/pages/GraphView.tsx'));
import TradingViewPage from './pages/trading.jsx';
import BrokerHub from './pages/BrokerHub.jsx';
import Home from './pages/Home.jsx';
const Forum = lazy(() => import('./pages/Forum.jsx'));
const ForumModeration = lazy(() => import('./pages/ForumModeration.jsx'));
const BrokerAnalytics = lazy(() => import('./pages/BrokerAnalytics.jsx'));
// ETH Prediction disabled
const IndicatorTesting = lazy(() => import('./pages/IndicatorTesting.jsx'));
const OrderBook = lazy(() => import('./pages/OrderBook.jsx'));
const Health = lazy(() => import('./pages/Health.jsx'));
const HealthToken = lazy(() => import('./pages/HealthToken.jsx'));
const WeightKlineMatch = lazy(() => import('./pages/WeightKlineMatch.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const Fortune = lazy(() => import('./pages/Fortune.jsx'));
const LeverageCalculator = lazy(() => import('./pages/LeverageCalculator.jsx'));
const Guide = lazy(() => import('./pages/Guide.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const WithdrawalRate = lazy(() => import('./pages/WithdrawalRate.jsx'));
const LiquidityCrisisMap = lazy(() => import('./pages/LiquidityCrisisMap.jsx'));
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { t} from './translations/index';
import LanguageSelector from './components/LanguageSelector.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';


/** Thin wrapper so weekly routes also show the hamburger nav. */
const WeeklyNav = ({ currentPage, setCurrentPage }) => {
  const handleSetPage = (id) => {
    if (id === 'weekly-mindmap') return; // already there
    window.location.href = `/#${id}`;
  };
  return <Navigation currentPage="weekly-mindmap" setCurrentPage={handleSetPage} />;
};

const App = () => {
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const translate = (key) => t(key, currentLanguage);
  const pausedPages = {
    predictions: {
      title: 'AI Cashback Predictions',
      message: 'This feature is currently paused while we upgrade the models.'
    }
  };
  // Initialize page from URL hash or localStorage; fallback to 'home'
  const getInitialPage = () => {
    try {
      const raw = (window.location.hash || '').replace('#', '').trim();
      const hash = raw.split('?')[0];
      const known = ['home','broker-hub','analytics','forum','forum-mod','predictions','indicators','news','health','health-token','health-match','trading','orderbook','fortune','leverage-calculator','guide','login','register','withdrawal-rate','liquidity-crisis'];
      if (hash && known.includes(hash)) return hash;
      const saved = localStorage.getItem('currentPage');
      if (saved && known.includes(saved)) return saved;
    } catch (e) { /* ignore */ }
    return 'home';
  };
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  

  // Persist page selection and reflect in URL hash
  useEffect(() => {
    try {
      localStorage.setItem('currentPage', currentPage);
      const currentHash = (window.location.hash || '').replace('#','');
      if (currentHash !== currentPage) {
        window.location.hash = currentPage;
      }
    } catch (e) { /* ignore */ }
  }, [currentPage]);






  return (
    <Routes>
      {/* Weekly mindmap module — isolated routes */}
      <Route path="/weekly-mindmap" element={
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeeklyNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <TimelineView />
        </Suspense>
      } />
      <Route path="/weekly-mindmap/nodes/:id" element={
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeeklyNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NodeDetailPage />
        </Suspense>
      } />
      <Route path="/weekly-mindmap/topics" element={
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeeklyNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <TopicsView />
        </Suspense>
      } />
      <Route path="/weekly-mindmap/topics/:slug" element={
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeeklyNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <TopicsView />
        </Suspense>
      } />
      <Route path="/weekly-mindmap/graph" element={
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeeklyNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <GraphView />
        </Suspense>
      } />

      {/* Existing hash-based app — catch-all */}
      <Route path="*" element={
        <HashApp
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pausedPages={pausedPages}
          translate={translate}
        />
      } />
    </Routes>
  );
};

/** Original hash-based app, extracted so Routes can render it as a fallback. */
const HashApp = ({ currentPage, setCurrentPage, pausedPages, translate }) => {
  return (
    <div className="app">
      {/* 全局导航 - 始终显示 */}
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {currentPage === 'home' ? (
        <Home onNavigate={setCurrentPage} />
      ) : currentPage === 'broker-hub' ? (
        <BrokerHub onNavigate={setCurrentPage} />
      ) : currentPage === 'indicators' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <IndicatorTesting />
        </Suspense>
      ) : currentPage === 'orderbook' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <OrderBook />
        </Suspense>
      ) : currentPage === 'news' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <News />
        </Suspense>
      ) : currentPage === 'health-token' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <HealthToken
            onNavigate={setCurrentPage}
            onTokenValidated={(token, email) => {
              console.log('Token validated:', token, email);
              setCurrentPage('health');
            }}
          />
        </Suspense>
      ) : currentPage === 'health' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <Health onNavigate={setCurrentPage} />
        </Suspense>
      ) : currentPage === 'health-match' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WeightKlineMatch onNavigate={setCurrentPage} />
        </Suspense>
      ) : currentPage === 'leverage-calculator' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <LeverageCalculator />
        </Suspense>
      ) : currentPage === 'guide' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <Guide onNavigate={setCurrentPage} />
        </Suspense>
      ) : currentPage === 'withdrawal-rate' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <WithdrawalRate />
        </Suspense>
      ) : currentPage === 'liquidity-crisis' ? (
        <Suspense fallback={<div className="muted">Loading…</div>}>
          <LiquidityCrisisMap />
        </Suspense>
      ) : (
        <div className="container">
          <div className="page-header">
            <div className="controls" style={{ marginLeft: 'auto' }}>
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 24, textAlign: 'center', padding: '2rem 0' }}>
            <h1 className="title" style={{ fontSize: '2rem', margin: 0 }}>
              {currentPage === 'forum' ? translate('forum.title') :
               currentPage === 'forum-mod' ? 'Forum Moderation' :
               currentPage === 'analytics' ? translate('nav.analytics') :
               currentPage === 'login' ? translate('auth.login.title') :
               currentPage === 'register' ? translate('auth.register.title') :
               currentPage === 'fortune' ? translate('home.fortune.title') :
               pausedPages[currentPage] ? pausedPages[currentPage].title :
               translate('nav.trading')}
            </h1>
          </div>


        {/* Pages */}
        {currentPage === 'forum' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Forum />
          </Suspense>
        ) : currentPage === 'forum-mod' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <ForumModeration />
          </Suspense>
        ) : currentPage === 'analytics' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <BrokerAnalytics />
          </Suspense>
        ) : currentPage === 'login' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Login onSuccess={() => setCurrentPage('forum')} />
          </Suspense>
        ) : currentPage === 'register' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Register onSuccess={() => setCurrentPage('login')} />
          </Suspense>
        ) : currentPage === 'fortune' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Fortune onNavigate={setCurrentPage} />
          </Suspense>
        ) : pausedPages[currentPage] ? (
          <div className="card card-padded" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ maxWidth: 520, margin: '0 auto' }}>{pausedPages[currentPage].message}</p>
          </div>
        ) : currentPage === 'trading' ? (
          <TradingViewPage />
        ) : null}
        </div>
      )}
    </div>
  );
};


export default function AppWithLanguage() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
