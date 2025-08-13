import React, { useState, useEffect } from 'react';
import './App.css';
import Navigation from './components/Navigation.jsx';
import TradingViewPage from './pages/trading.jsx';
import DonationPage from './pages/DonationPage.jsx';
import BayesianDashboard from './pages/BayesianDashboard.jsx';
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { t} from './translations/index';
import LanguageSelector from './components/LanguageSelector.jsx';
import { getThresholdTypeText } from './utils/thresholdTypes.js';
import { useDashboard } from './hooks/useDashboard.js';
import { useStores } from './hooks/useStores.js';
import { useAlerts } from './hooks/useAlerts.js';
import { useComparison } from './hooks/useComparison.js';

// Dashboard Components
import StatsCards from './components/Dashboard/StatsCards.jsx';
import AverageCashback from './components/Dashboard/AverageCashback.jsx';
import UpsizedStoresList from './components/Dashboard/UpsizedStoresList.jsx';

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
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Custom hooks
  const { dashboardStats, upsizedStores, statistics, loading, error, isRescraping, stores, setStores, fetchData, handleRescrape } = useDashboard();
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



if (languageLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <div style={{fontSize: '2em', marginBottom: '20px'}}></div>
        <div>{translate('messages.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <h2 style={{color: '#dc3545'}}>❌ {translate('messages.connectionError')}</h2>
        <p>{error}</p>
        <button onClick={fetchData} style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          {translate('messages.retry')}
        </button>
        
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f5f5f5', padding: '20px'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
              <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px'
      }}>
        <LanguageSelector />
      </div>
        
        {/* 页面标题 */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
{/* 导航菜单 */}
<Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
<h1 style={{margin: 0, color: '#333', fontSize: '2.5em'}}>
  {currentPage === 'dashboard' ? translate('dashboard.title') : 
   currentPage === 'predictions' ? 'AI Cashback Predictions' :
   currentPage === 'trading' ? translate('nav.trading') : 
   translate('nav.donations')}
</h1>
{currentPage === 'dashboard' && (
  <>
    <button onClick={handleRescrape} disabled={isRescraping} style={{
      background: isRescraping ? '#6c757d' : '#007bff',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: isRescraping ? 'not-allowed' : 'pointer',
      marginTop: '20px',
      fontSize: '16px'
    }}>
      {isRescraping ? translate('dashboard.rescraping') : translate('dashboard.rescrape')}
    </button>
    <button onClick={() => alertHook.setShowAlerts(!alertHook.showAlerts)} style={{
      background: '#17a2b8',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '20px',
      marginLeft: '10px',
      fontSize: '16px'
    }}>
      {alertHook.showAlerts ? translate('dashboard.closeAlerts') : translate('dashboard.alerts')}
    </button>
  </>
)}
   {currentPage === 'dashboard' ? (
<div>
        {/* 统计卡片 */}
        <StatsCards dashboardStats={dashboardStats} translate={translate} />
        
        {/* 平均Cashback率 */}
        <AverageCashback dashboardStats={dashboardStats} translate={translate} />
        
        {/* Upsized商家 */}
        <UpsizedStoresList upsizedStores={upsizedStores} translate={translate} />
        
        {/* 可比较商家列表 */}
        <ComparableStoresList 
          comparableStores={comparisonHook.comparableStores} 
          handleCompareStore={comparisonHook.handleCompareStore} 
          translate={translate} 
        />
        
        {/* 比较模态框 */}
        <CompareModal 
          showComparison={comparisonHook.showComparison}
          selectedComparison={comparisonHook.selectedComparison}
          setShowComparison={comparisonHook.setShowComparison}
          translate={translate}
        />
        
        {/* 商家列表 */}
        <StoreList 
          stores={stores} 
          storeHook={storeHook} 
          fetchData={fetchData} 
          translate={translate} 
        />
        
        {/* 商家详情 */}
        <StoreDetails storeHook={storeHook} translate={translate} />
        
        {/* 价格提醒管理界面 */}
        <AlertManagement alertHook={alertHook} translate={translate} />
      </div>
) : currentPage === 'predictions' ? (
    <BayesianDashboard />
) : currentPage === 'trading' ? (
    <TradingViewPage />
   ) : (
    <DonationPage />
   )}
        </div>
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
