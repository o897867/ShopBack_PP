import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import './index.css';
import Navigation from './components/Navigation.jsx';
import TradingViewPage from './pages/trading.jsx';
import BrokerHub from './pages/BrokerHub.jsx';
const Forum = lazy(() => import('./pages/Forum.jsx'));
const ForumModeration = lazy(() => import('./pages/ForumModeration.jsx'));
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
    },
    eth: {
      title: 'ETH Price Prediction',
      message: 'ETH predictions are paused for maintenance and will return soon.'
    }
  };
  // Initialize page from URL hash or localStorage; fallback to 'home'
  const getInitialPage = () => {
    try {
      const raw = (window.location.hash || '').replace('#', '').trim();
      const hash = raw.split('?')[0];
      const known = ['broker-hub','forum','forum-mod','predictions','eth','trading','login','register'];
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






  if (currentPage === 'broker-hub') {
    return <BrokerHub onNavigate={setCurrentPage} />;
  }

  return (
    <div className="app">
      <div className="container">
        <div className="page-header">
          <div className="controls" style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>

        {/* Header and Navigation */}
        <div className="card card-padded header-card" style={{ marginBottom: 24, textAlign: 'center' }}>
          <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <h1 className="title" style={{ fontSize: '2rem' }}>
            {currentPage === 'forum' ? translate('forum.title') :
             currentPage === 'forum-mod' ? 'Forum Moderation' :
             currentPage === 'login' ? translate('auth.login.title') :
             currentPage === 'register' ? translate('auth.register.title') :
             pausedPages[currentPage] ? pausedPages[currentPage].title :
             currentPage === 'broker-hub' ? translate('brokerHub.pageTitle') :
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
        ) : currentPage === 'login' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Login onSuccess={() => setCurrentPage('forum')} />
          </Suspense>
        ) : currentPage === 'register' ? (
          <Suspense fallback={<div className="muted">Loading…</div>}>
            <Register onSuccess={() => setCurrentPage('login')} />
          </Suspense>
        ) : pausedPages[currentPage] ? (
          <div className="card card-padded" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ maxWidth: 520, margin: '0 auto' }}>{pausedPages[currentPage].message}</p>
          </div>
        ) : currentPage === 'trading' ? (
          <TradingViewPage />
        ) : null}
      </div>
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
