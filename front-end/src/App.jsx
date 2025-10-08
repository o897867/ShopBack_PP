import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import './index.css';
import Navigation from './components/Navigation.jsx';
import TradingViewPage from './pages/trading.jsx';
import BrokerHub from './pages/BrokerHub.jsx';
const Forum = lazy(() => import('./pages/Forum.jsx'));
const ForumModeration = lazy(() => import('./pages/ForumModeration.jsx'));
const BrokerAnalytics = lazy(() => import('./pages/BrokerAnalytics.jsx'));
const EthKalmanPrediction = lazy(() => import('./pages/EthKalmanPrediction.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { t} from './translations/index';
import LanguageSelector from './components/LanguageSelector.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { getThresholdTypeText } from './utils/thresholdTypes.js';


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
      const known = ['broker-hub','analytics','forum','forum-mod','predictions','eth','trading','login','register'];
      if (hash && known.includes(hash)) return hash;
      const saved = localStorage.getItem('currentPage');
      if (saved && known.includes(saved)) return saved;
    } catch (e) { /* ignore */ }
    return 'broker-hub';
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
    <div className="app">
      {/* 全局导航 - 始终显示 */}
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {currentPage === 'broker-hub' ? (
        <BrokerHub onNavigate={setCurrentPage} />
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
               currentPage === 'eth' ? translate('nav.ethPrediction') :
               currentPage === 'login' ? translate('auth.login.title') :
               currentPage === 'register' ? translate('auth.register.title') :
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
        ) : currentPage === 'eth' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <EthKalmanPrediction />
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
