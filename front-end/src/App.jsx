import React, { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import Navigation from './components/Navigation.jsx';
import TradingViewPage from './pages/trading.jsx';
import DonationPage from './pages/DonationPage.jsx';
import BayesianDashboard from './pages/BayesianDashboard.jsx';
import EthKalmanPrediction from './pages/EthKalmanPrediction.jsx';
import Showcase from './pages/Showcase.jsx';
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { t} from './translations/index';
import LanguageSelector from './components/LanguageSelector.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { getThresholdTypeText } from './utils/thresholdTypes.js';
import { useDashboard } from './hooks/useDashboard.js';
import { useStores } from './hooks/useStores.js';
import { useAlerts } from './hooks/useAlerts.js';
import { useComparison } from './hooks/useComparison.js';

// Dashboard Components
import StatsCards from './components/Dashboard/StatsCards.jsx';
import AverageCashback from './components/Dashboard/AverageCashback.jsx';
import UpsizedStoresList from './components/Dashboard/UpsizedStoresList.jsx';
import PerformanceCard from './components/Dashboard/PerformanceCard.jsx';

// Comparison Components
import CompareModal from './components/Comparison/CompareModal.jsx';
import ComparableStoresList from './components/Comparison/ComparableStoresList.jsx';

// Store Components
import StoreList from './components/Stores/StoreList.jsx';
import StoreDetails from './components/Stores/StoreDetails.jsx';

// Alert Components
import AlertManagement from './components/Alerts/AlertManagement.jsx';


const App = () => {
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const translate = (key) => t(key, currentLanguage);
  // Initialize page from URL hash or localStorage; fallback to 'home'
  const getInitialPage = () => {
    try {
      const raw = (window.location.hash || '').replace('#', '').trim();
      const hash = raw.split('?')[0];
      const known = ['home','dashboard','showcase','predictions','eth','trading','donations'];
      if (hash && known.includes(hash)) return hash;
      const saved = localStorage.getItem('currentPage');
      if (saved && known.includes(saved)) return saved;
    } catch (e) { /* ignore */ }
    return 'home';
  };
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  
  // Custom hooks
  const { dashboardStats, upsizedStores, statistics, performanceData, loading, error, isRescraping, stores, setStores, fetchData, handleRescrape } = useDashboard();
  const storeHook = useStores();
  const alertHook = useAlerts();
  const comparisonHook = useComparison();
  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      const result = await fetchData();
      if (result) {
        setStores(result.storesData);
        storeHook.setStores(result.storesData);
        comparisonHook.setComparableStores(result.comparableData);
      }
    };
    initializeData();
  }, []);

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



if (currentPage !== 'home' && (languageLoading || loading)) {
  return (
    <div className="center" style={{ minHeight: '100vh' }}>
      <div className="card card-padded" style={{ minWidth: 260, textAlign: 'center' }}>
        <div className="muted" style={{ marginBottom: 8 }}>{translate('messages.loading')}</div>
        <div className="pill">…</div>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div className="center" style={{ minHeight: '100vh' }}>
        <div className="card card-padded" style={{ maxWidth: 560 }}>
          <h2 className="title" style={{ color: 'var(--danger)', fontSize: '1.4rem' }}>{translate('messages.connectionError')}</h2>
          <p className="muted">{error}</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={fetchData}>
              {translate('messages.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal home with two translucent bubbles
  if (currentPage === 'home') {
    return (
      <div className="home-bubbles">
        <div className="bubble-container">
          <button className="bubble" onClick={() => setCurrentPage('showcase')}>
            <span className="bubble-label">行业</span>
          </button>
          <button className="bubble" onClick={() => setCurrentPage('trading')}>
            <span className="bubble-label">工具</span>
          </button>
        </div>
      </div>
    );
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
            {currentPage === 'dashboard' ? translate('dashboard.title') :
             currentPage === 'showcase' ? 'Showcase' :
             currentPage === 'predictions' ? 'AI Cashback Predictions' :
             currentPage === 'eth' ? 'ETH Price Prediction' :
             currentPage === 'trading' ? translate('nav.trading') :
             translate('nav.donations')}
          </h1>

          {currentPage === 'dashboard' && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={handleRescrape}
                disabled={isRescraping}
                className={`btn btn-primary`}
              >
                {isRescraping ? translate('dashboard.rescraping') : translate('dashboard.rescrape')}
              </button>
              <button
                onClick={() => alertHook.setShowAlerts(!alertHook.showAlerts)}
                className="btn btn-secondary"
                style={{ marginLeft: 8 }}
              >
                {alertHook.showAlerts ? translate('dashboard.closeAlerts') : translate('dashboard.alerts')}
              </button>
            </div>
          )}
        </div>

        {/* Pages */}
        {currentPage === 'dashboard' ? (
          <div>
            <PerformanceCard performanceData={performanceData} translate={translate} />
            <StatsCards dashboardStats={dashboardStats} translate={translate} />
            <AverageCashback dashboardStats={dashboardStats} translate={translate} />
            <UpsizedStoresList upsizedStores={upsizedStores} translate={translate} />
            <ComparableStoresList
              comparableStores={comparisonHook.comparableStores}
              handleCompareStore={comparisonHook.handleCompareStore}
              translate={translate}
            />
            <CompareModal
              showComparison={comparisonHook.showComparison}
              selectedComparison={comparisonHook.selectedComparison}
              setShowComparison={comparisonHook.setShowComparison}
              translate={translate}
            />
            <StoreList
              stores={stores}
              storeHook={storeHook}
              fetchData={fetchData}
              translate={translate}
            />
            <StoreDetails storeHook={storeHook} translate={translate} />
            <AlertManagement alertHook={alertHook} translate={translate} />
          </div>
        ) : currentPage === 'showcase' ? (
          <Showcase />
        ) : currentPage === 'predictions' ? (
          <BayesianDashboard />
        ) : currentPage === 'eth' ? (
          <EthKalmanPrediction />
        ) : currentPage === 'trading' ? (
          <TradingViewPage />
        ) : (
          <DonationPage />
        )}
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
