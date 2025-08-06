import React, { useState, useEffect } from 'react';
import './App.css';
import Navigation from './components/Navigation.jsx';
import TradingViewPage from './pages/trading.jsx';
import DonationPage from './pages/DonationPage.jsx';
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { t} from './translations/index';
import LanguageSelector from './components/LanguageSelector.jsx';

const API_BASE_URL = '';
// 临时测试代码 - 添加到 App.js 最顶部
const testObj = {
  en: {
    dashboard: {
      title: 'English Title'
    }
  },
  'zh-CN': {
    dashboard: {
      title: '中文标题'
    }
  }
};

// 简单测试函数
const simpleTest = (key, lang) => {
  console.log('Testing with:', key, lang);
  console.log('testObj:', testObj);
  console.log('testObj[lang]:', testObj[lang]);
  console.log('testObj[lang].dashboard:', testObj[lang]?.dashboard);
  console.log('testObj[lang].dashboard.title:', testObj[lang]?.dashboard?.title);
  
  return testObj[lang]?.dashboard?.title || 'NOT FOUND';
};

// 在 App 组件内测试
console.log('Simple test result:', simpleTest('dashboard.title', 'zh-CN'));
const api = {
  createAlert: async (alertData) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }
    return response.json();
  },
  compareStore: async (storeName) => {
    const response = await fetch(`${API_BASE_URL}/api/compare/${encodeURIComponent(storeName)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getComparableStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/compare-all`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getUserAlerts: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  deleteAlert: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/stores`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getUpsizedStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/upsized-stores`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStoreHistory: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/history`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  // 新增：获取特定商家的统计信息
  getStoreStatistics: async (storeName) => {
    const response = await fetch(`${API_BASE_URL}/api/statistics?store_name=${encodeURIComponent(storeName)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  triggerRescrape: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rescrape-all`, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  addStore: async (url) => {
    const response = await fetch(`${API_BASE_URL}/api/add-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }
    return response.json();
  }
  
};

const App = () => {
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const translate = (key) => t(key, currentLanguage);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [upsizedStores, setUpsizedStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeHistory, setStoreHistory] = useState([]);
  const [storeStatistics, setStoreStatistics] = useState([]); // 新增：商家统计数据
  const [statistics, setStatistics] = useState([]);
  const [isRescraping, setIsRescraping] = useState(false);
  const [addStoreUrl, setAddStoreUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertUrl, setAlertUrl] = useState('');
  const [alertThresholdType, setAlertThresholdType] = useState('above_current');
  const [alertThresholdValue, setAlertThresholdValue] = useState('');
  const [userAlerts, setUserAlerts] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [comparableStores, setComparableStores] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  console.log('Test EN:', t('dashboard.title', 'en'));
  console.log('Test CN:', t('dashboard.title', 'zh-CN'));
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboard, storesData, upsizedData, statisticsData, comparableData] = await Promise.all([
        api.getDashboard(),
        api.getStores(),
        api.getUpsizedStores(),
        api.getStatistics(),
        api.getComparableStores()
      ]);
      
      setDashboardStats(dashboard);
      setStores(storesData);
      setUpsizedStores(upsizedData);
      setStatistics(statisticsData);
      setComparableStores(comparableData);
    } catch (error) {
      console.error('❌ 获取数据失败:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const detectPlatform = (url) => {
  if (!url) return 'Unknown';
  
  const urlLower = url.toLowerCase();
  if (urlLower.includes('shopback.com')) {
    return 'ShopBack';
  } else if (urlLower.includes('cashrewards.com')) {
    return 'CashRewards';
  } else if (urlLower.includes('rakuten.com')) {
    return 'Rakuten';
  } else if (urlLower.includes('topcashback.com')) {
    return 'TopCashback';
  } else {
    return 'Unknown';
  }
};

  const handleCreateAlert = async () => {
    if (!alertEmail.trim() || !alertUrl.trim() || !alertThresholdValue.trim()) {
      setAlertMessage({ type: 'error', text: '请填写所有必需字段' });
      return;
    }
  
    try {
      setIsCreatingAlert(true);
      setAlertMessage(null);
      
      await api.createAlert({
        user_email: alertEmail,
        store_url: alertUrl,
        threshold_type: alertThresholdType,
        threshold_value: parseFloat(alertThresholdValue)
      });
      
      setAlertMessage({ type: 'success', text: '价格提醒创建成功！' });
      
      // 清空表单
      setAlertUrl('');
      setAlertThresholdValue('');
      
      // 刷新用户提醒列表
      if (alertEmail) {
        const alerts = await api.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
      
    } catch (error) {
      setAlertMessage({ type: 'error', text: error.message });
    } finally {
      setIsCreatingAlert(false);
    }
  };


  const handleLoadUserAlerts = async () => {
    if (!alertEmail.trim()) {
      setAlertMessage({ type: 'error', text: '请输入邮箱地址' });
      return;
    }
    
    try {
      const alerts = await api.getUserAlerts(alertEmail);
      setUserAlerts(alerts);
      setAlertMessage(null);
    } catch (error) {
      setAlertMessage({ type: 'error', text: '加载提醒失败' });
    }
  };
  
  const handleDeleteAlert = async (alertId) => {
    try {
      await api.deleteAlert(alertId);
      setAlertMessage({ type: 'success', text: '提醒已删除' });
      
      // 刷新列表
      if (alertEmail) {
        const alerts = await api.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: '删除失败' });
    }
  };
  
  const getThresholdTypeText = (type) => {
    switch(type) {
      case 'above_current': return '高于当前';
      case 'fixed_value': return '达到固定值';
      case 'percentage_increase': return '涨幅百分比';
      default: return type;
    }
  };
  const handleAddStore = async () => {
    if (!addStoreUrl.trim()) return;
    
    try {
      setIsAdding(true);
      setAddMessage(null);
      await api.addStore(addStoreUrl);
      setAddMessage({ type: 'success', text: '商家添加成功！' });
      setAddStoreUrl('');
      // 刷新商家列表
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      setAddMessage({ type: 'error', text: error.message });
    } finally {
      setIsAdding(false);
    }
  };
  const handleStoreClick = async (store) => {
    try {
      setSelectedStore(store);
      // 并行获取历史数据和统计数据
      const [history, stats] = await Promise.all([
        api.getStoreHistory(store.id),
        api.getStoreStatistics(store.name)
      ]);
      setStoreHistory(history);
      setStoreStatistics(stats);
    } catch (error) {
      console.error('获取商家历史失败:', error);
    }
  };

  const handleRescrape = async () => {
    try {
      setIsRescraping(true);
      await api.triggerRescrape();
      setTimeout(() => {
        fetchData();
        setIsRescraping(false);
      }, 5000);
    } catch (error) {
      console.error('重新抓取失败:', error);
      setIsRescraping(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取分类的统计信息
  const getCategoryStats = (category) => {
    return storeStatistics.find(stat => stat.category === category);
  };
  // 添加比较处理函数
  const handleCompareStore = async (storeName) => {
    try {
      const comparison = await api.compareStore(storeName);
      setSelectedComparison(comparison);
      setShowComparison(true);  // 添加这行
    } catch (error) {
      console.error('比较失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
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
    <button onClick={() => setShowAlerts(!showAlerts)} style={{
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
      {showAlerts ? translate('dashboard.closeAlerts') : translate('dashboard.alerts')}
    </button>
  </>
)}
   {currentPage === 'dashboard' ? (
<div>
        {/* 统计卡片 */}
        {dashboardStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #007bff'
            }}>
              
              <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.totalStores')}</h3>
              <div style={{fontSize: '3em', color: '#007bff', fontWeight: 'bold'}}>
                {dashboardStats.total_stores}
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #28a745'
            }}>
              
              <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.totalRecords')}</h3>
              <div style={{fontSize: '3em', color: '#28a745', fontWeight: 'bold'}}>
                {dashboardStats.total_records?.toLocaleString()}
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{fontSize: '3em', marginBottom: '10px'}}></div>
              <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.recentScrapes')}</h3>
              <div style={{fontSize: '3em', color: '#ffc107', fontWeight: 'bold'}}>
                {dashboardStats.recent_scrapes}
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #dc3545'
            }}>
              <div style={{fontSize: '3em', marginBottom: '10px'}}>🔥</div>
              <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.upsizedStores')}</h3>
              <div style={{fontSize: '3em', color: '#dc3545', fontWeight: 'bold'}}>
                {dashboardStats.upsized_stores}
              </div>
            </div>
          </div>
        )}

        {/* 平均Cashback率 */}
        {dashboardStats && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{margin: '0 0 15px 0', color: '#333'}}>{translate('dashboard.avgCashback')}</h2>
            <div style={{fontSize: '4em', color: '#007bff', fontWeight: 'bold'}}>
              {dashboardStats.avg_cashback_rate}%
            </div>
          </div>
        )}

        {/* Upsized商家 */}
{upsizedStores.length > 0 && (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  }}>
    <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
      {translate('dashboard.upsizedStores')} ({upsizedStores.length})
    </h2>
    
    {/* 这里是关键部分 - map函数的正确写法 */}
    {upsizedStores.map((store, index) => {
      // 1. 先在map函数内部检测平台
      const platform = detectPlatform(store.url);
      
      // 2. 然后返回JSX元素
      return (
        <div key={index} style={{
          padding: '20px',
          borderBottom: index < upsizedStores.length - 1 ? '1px solid #eee' : 'none',
          background: `linear-gradient(to right,  white)`,
          borderRadius: '6px',
          marginBottom: '15px'
          
        }}>
          
          {/* 商家名称和平台标签 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px'
          }}>
            <div>
              <h3 style={{margin: '0 0 5px 0', color: '#333', fontSize: '1.3em'}}>
                {store.name}
              </h3>
              {/* 平台标签 */}
              <div style={{
                display: 'inline-block',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.75em',
                fontWeight: 'bold'
              }}>
                {platform}
              </div>
            </div>
            
            {/* UPSIZED标签 */}
            <span style={{
              background: '#dc3545',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8em',
              fontWeight: 'bold'
            }}>
               UPSIZED
            </span>
          </div>
          
          {/* Cashback信息 */}
          <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#28a745', marginBottom: '8px'}}>
            {store.main_cashback}
            {store.previous_offer && (
              <span style={{
                color: '#666',
                textDecoration: 'line-through',
                marginLeft: '15px',
                fontSize: '0.7em'
              }}>
                {translate('upsized.originalPrice')}: {store.previous_offer}
              </span>
            )}
          </div>
          
          {/* 其他信息 */}
          <p style={{color: '#007bff', fontSize: '14px', margin: '5px 0'}}>
            🔗 {store.url}
          </p>
          <p style={{color: '#999', fontSize: '12px', margin: 0}}>
            {translate('upsized.scraped')}: {new Date(store.scraped_at).toLocaleString()}
          </p>
        </div>
      );
    })}
  </div>
)}
        {comparableStores.length > 0 && (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  }}>
    <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
      {translate('compare.title')} ({comparableStores.length})
    </h2>
    <p style={{color: '#666', marginBottom: '20px'}}>
      {translate('compare.description')}
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '15px'
    }}>
      {comparableStores.map((store, index) => (
        <div key={index} 
             onClick={() => handleCompareStore(store.name)}
             style={{
               padding: '15px',
               border: '2px solid #e9ecef',
               borderRadius: '8px',
               cursor: 'pointer',
               transition: 'all 0.2s',
               background: '#f8f9fa'
             }}
             onMouseEnter={(e) => {
               e.target.style.borderColor = '#007bff';
               e.target.style.transform = 'translateY(-2px)';
               e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
             }}
             onMouseLeave={(e) => {
               e.target.style.borderColor = '#e9ecef';
               e.target.style.transform = 'translateY(0)';
               e.target.style.boxShadow = 'none';
             }}>
          <h4 style={{margin: '0 0 8px 0', color: '#333'}}>{store.name}</h4>
          <div style={{fontSize: '12px', color: '#666'}}>
            {translate('compare.platforms')}: {store.platforms}
          </div>
          <div style={{fontSize: '12px', color: '#007bff', marginTop: '5px'}}>
            {translate('compare.clickToCompare')}
          </div>
        </div>
      ))}
    </div>
  </div>
)}


{showComparison && selectedComparison && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '15px'
      }}>
        <h2 style={{margin: 0, color: '#333'}}>
          🆚 {selectedComparison.store_name} {translate('compare.title')}
        </h2>
        <button 
          onClick={() => setShowComparison(false)}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {translate('common.close')}
        </button>
      </div>

      {/* 最佳推荐 */}
      {selectedComparison.best_platform && (
        <div style={{
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <h3 style={{margin: '0 0 10px 0', fontSize: '1.3em'}}>
            {translate('compare.bestChoice')}
          </h3>
          <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>
            {selectedComparison.best_platform.toUpperCase()}: {selectedComparison.best_rate}%
          </div>
        </div>
      )}

      {/* 平台比较 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {Object.entries(selectedComparison.platforms).map(([platform, data]) => (
          <div key={platform} style={{
            border: platform === selectedComparison.best_platform ? 
              '3px solid #28a745' : '2px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            background: platform === selectedComparison.best_platform ? 
              '#f8fff9' : 'white'
          }}>
            {/* 平台名称 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <h4 style={{
                margin: 0,
                color: platform === 'shopback' ? '#007bff' : '#dc3545',
                textTransform: 'uppercase',
                fontSize: '1.1em'
              }}>
                {platform === 'shopback' ? 'ShopBack' : 'CashRewards'}
              </h4>
              {platform === selectedComparison.best_platform && (
                <span style={{
                  background: '#28a745',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em',
                  fontWeight: 'bold'
                }}>
                  {translate('compare.best')}
                </span>
              )}
            </div>

            {/* Cashback率 */}
            <div style={{marginBottom: '10px'}}>
              <div style={{fontSize: '0.9em', color: '#666'}}>{translate('compare.cashbackRate')}</div>
              <div style={{
                fontSize: '2em',
                fontWeight: 'bold',
                color: platform === selectedComparison.best_platform ? '#28a745' : '#333'
              }}>
                {data.cashback}
              </div>
            </div>

            {/* 特殊标签 */}
            {data.is_upsized && (
              <div style={{
                background: '#dc3545',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                fontWeight: 'bold',
                marginBottom: '10px',
                display: 'inline-block'
              }}>
                🔥 UPSIZED
              </div>
            )}

            {/* 更新时间 */}
            <div style={{fontSize: '0.8em', color: '#999'}}>
              {translate('time.updated')}: {new Date(data.last_updated).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 比较说明 */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '6px',
        borderLeft: '4px solid #007bff'
      }}>
        <h5 style={{margin: '0 0 8px 0', color: '#333'}}></h5>
        <ul style={{margin: 0, paddingLeft: '20px', fontSize: '0.9em', color: '#666'}}>
          <li>{translate('compare.tip1')}</li>
          <li>{translate('compare.tip2')}</li>
          <li>{translate('compare.tip3')}</li>
          <li>{translate('compare.tip4')}</li>
        </ul>
      </div>
    </div>
  </div>
)}

        {/* 商家列表 */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
            {translate('stores.title')} ({stores.length})
          </h2>
          {/* 添加商家表单 */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{margin: '0 0 15px 0', color: '#333'}}>➕ {translate('stores.addNew')}</h4>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input
                  type="text"
                  placeholder={translate('stores.addUrl')}
                  value={addStoreUrl}
                  onChange={(e) => setAddStoreUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleAddStore}
                  disabled={isAdding || !addStoreUrl.trim()}
                  style={{
                    background: isAdding ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: isAdding ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAdding ? '添加中...' : '添加'}
                </button>
              </div>
              {addMessage && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: addMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: addMessage.type === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${addMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {addMessage.text}
                </div>
              )}
            </div>
          {stores.map((store) => (
            <div key={store.id} onClick={() => handleStoreClick(store)} style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              borderRadius: '6px',
              marginBottom: '10px',
              background: '#f8f9fa',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}>
              <h3 style={{margin: '0 0 8px 0', color: '#333'}}>{store.name}</h3>
              <p style={{color: '#007bff', margin: '0 0 8px 0', fontSize: '14px'}}>
                {store.url}
              </p>
              <p style={{color: '#999', fontSize: '12px', margin: 0}}>
                {translate('store.updateTime')}: {new Date(store.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* 商家详情 */}
        {selectedStore && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '30px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{margin: 0, color: '#333'}}>
                {selectedStore.name} - {translate('stores.storeDetails')}
              </h2>
              <button 
                onClick={() => setSelectedStore(null)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>

            {/* 商家历史记录 */}
            {storeHistory.length > 0 && (
              <div>
                <h3 style={{color: '#333', marginBottom: '20px'}}>{translate('stores.cashbackHistory')}</h3>
                
                {/* 按日期分组显示 */}
                {Object.entries(
                  storeHistory.reduce((groups, record) => {
                    const date = new Date(record.scraped_at).toLocaleDateString();
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(record);
                    return groups;
                  }, {})
                ).map(([date, records]) => (
                  <div key={date} style={{marginBottom: '30px'}}>
                    <h4 style={{
                      color: '#007bff', 
                      marginBottom: '15px',
                      borderBottom: '2px solid #e9ecef',
                      paddingBottom: '5px'
                    }}>
                      📅 {date}
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                      gap: '15px'
                    }}>
                      {records.map((record, index) => {
                        const categoryStats = getCategoryStats(record.category);
                        
                        return (
                          <div key={index} style={{
                            background: record.category === 'Main' ? '#e8f4fd' : '#f8f9fa',
                            border: record.category === 'Main' ? '2px solid #007bff' : '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '15px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px'
                            }}>
                              <h5 style={{
                                margin: 0,
                                color: record.category === 'Main' ? '#007bff' : '#333',
                                fontSize: '1.1em'
                              }}>
                                {record.category === 'Main' ? '🌟 主要优惠' : `📂 ${record.category}`}
                              </h5>
                              {record.is_upsized && (
                                <span style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.8em',
                                  fontWeight: 'bold'
                                }}>
                                  🔥 UPSIZED
                                </span>
                              )}
                            </div>
                            
                            <div style={{
                              fontSize: '1.5em',
                              fontWeight: 'bold',
                              color: '#28a745',
                              marginBottom: '5px'
                            }}>
                              {record.category === 'Main' ? record.main_cashback : record.category_rate}
                            </div>
                            
                            {record.previous_offer && (
                              <div style={{
                                color: '#666',
                                textDecoration: 'line-through',
                                fontSize: '0.9em',
                                marginBottom: '5px'
                              }}>
                                之前: {record.previous_offer}
                              </div>
                            )}

                            {/* 史高史低信息 */}
                            {categoryStats && (
                              <div style={{
                                background: 'rgba(0, 123, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '10px',
                                marginTop: '10px',
                                fontSize: '0.9em'
                              }}>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '10px'
                                }}>
                                  <div>
                                    <div style={{
                                      fontWeight: 'bold',
                                      color: '#dc3545',
                                      marginBottom: '3px'
                                    }}>
                                      {translate('stats.highestRate')}:: {categoryStats.highest_rate}%
                                    </div>
                                    <div style={{color: '#666', fontSize: '0.8em'}}>
                                      {formatDate(categoryStats.highest_date)}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{
                                      fontWeight: 'bold',
                                      color: '#6c757d',
                                      marginBottom: '3px'
                                    }}>
                                       📉 {translate('stats.lowestRate')}: {categoryStats.lowest_rate}%
                                    </div>
                                    <div style={{color: '#666', fontSize: '0.8em'}}>
                                      {formatDate(categoryStats.lowest_date)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 当前比例与史高史低的比较 */}
                                <div style={{marginTop: '8px', padding: '5px 0', borderTop: '1px solid #dee2e6'}}>
                                  {categoryStats.current_rate === categoryStats.highest_rate && (
                                    <span style={{color: '#dc3545', fontWeight: 'bold', fontSize: '0.8em'}}>
                                      {translate('stats.currentIsHighest')}
                                    </span>
                                  )}
                                  {categoryStats.current_rate === categoryStats.lowest_rate && (
                                    <span style={{color: '#6c757d', fontWeight: 'bold', fontSize: '0.8em'}}>
                                      📉 {translate('stats.currentIsLowest')}
                                    </span>
                                  )}
                                  {categoryStats.current_rate !== categoryStats.highest_rate && 
                                   categoryStats.current_rate !== categoryStats.lowest_rate && (
                                    <span style={{color: '#666', fontSize: '0.8em'}}>
                                      {translate('stats.differenceFromHigh')}: {(categoryStats.highest_rate - categoryStats.current_rate).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div style={{
                              color: '#999',
                              fontSize: '0.8em',
                              marginTop: '5px'
                            }}>
                              {new Date(record.scraped_at).toLocaleTimeString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {storeHistory.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                <div style={{fontSize: '3em', marginBottom: '15px'}}>📭</div>
                <p>{translate('stores.noHistory')}</p>
              </div>
            )}
          </div>
        )}
        {/* 价格提醒管理界面 */}
        {showAlerts && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '30px'
          }}>
            <h2 style={{margin: '0 0 25px 0', color: '#333'}}>{translate('alerts.title')}</h2>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE_URL}/api/test-email?email=${encodeURIComponent(alertEmail)}`);
                  const result = await response.json();
                  setAlertMessage({ 
                    type: result.success ? 'success' : 'error', 
                    text: result.message 
                  });
                } catch (error) {
                  setAlertMessage({ type: 'error', text: '测试失败' });
                }
              }}
              style={{
                background: '#ffc107',
                color: 'black',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              {translate('alerts.testEmail')}
            </button>
                        {/* 邮箱输入 */}
            <div style={{marginBottom: '25px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                📧 {translate('alerts.email')}：
              </label>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input
                  type="email"
                  placeholder=" "
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleLoadUserAlerts}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {translate('alerts.loadAlerts')}
                </button>
              </div>
            </div>

            {/* 创建新提醒 */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '6px',
              marginBottom: '25px'
            }}>
              <h4 style={{margin: '0 0 15px 0', color: '#333'}}>➕ {translate('alerts.createNew')}</h4>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  URL：
                </label>
                <input
                  type="text"
                  placeholder="URL..."
                  value={alertUrl}
                  onChange={(e) => setAlertUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                    {translate('alerts.thresholdType')}：
                  </label>
                  <select
                    value={alertThresholdType}
                    onChange={(e) => setAlertThresholdType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="above_current">＞</option>
                    <option value="fixed_value">=</option>
                    <option value="percentage_increase">Δ%</option>
                  </select>
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                    {translate('alerts.threshold')}：
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="enter"
                    value={alertThresholdValue}
                    onChange={(e) => setAlertThresholdValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateAlert}
                disabled={isCreatingAlert || !alertEmail.trim()}
                style={{
                  background: isCreatingAlert ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: isCreatingAlert ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isCreatingAlert ? 'Creating...' : 'Create'}
              </button>
            </div>

            {/* 消息提示 */}
            {alertMessage && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                borderRadius: '4px',
                background: alertMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: alertMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${alertMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {alertMessage.text}
              </div>
            )}

            {/* 用户提醒列表 */}
            {userAlerts.length > 0 && (
              <div>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>我的提醒列表</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '15px'
                }}>
                  {userAlerts.map((alert) => (
                    <div key={alert.id} style={{
                      background: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      <h5 style={{margin: '0 0 10px 0', color: '#333'}}>
                        {alert.store_name || '商家'}
                      </h5>
                      <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                        <strong>网址:</strong> {alert.store_url}
                      </p>
                      <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                        <strong>提醒条件:</strong> {getThresholdTypeText(alert.threshold_type)} {alert.threshold_value}%
                      </p>
                      <p style={{margin: '5px 0', fontSize: '12px', color: '#999'}}>
                        创建时间: {new Date(alert.created_at).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginTop: '10px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userAlerts.length === 0 && alertEmail && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                <div style={{fontSize: '3em', marginBottom: '15px'}}>📭</div>
                <p>暂无价格提醒</p>
              </div>
            )}
          </div>
        )}
        {/* 成功提示 */}
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '30px',
          textAlign: 'center',
          border: '1px solid #c3e6cb'
        }}>
          <h3>恭喜！ShopBack管理平台部署成功！</h3>
          <p>所有功能正常工作，API连接正常，数据加载成功。</p>
        </div>
      </div>
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