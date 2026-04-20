import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './News.css';

const News = () => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);
  const [news, setNews] = useState([]); // 合并视图
  const [importantNews, setImportantNews] = useState([]);
  const [otherNews, setOtherNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [impactFilter, setImpactFilter] = useState('ALL');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [displayLanguage, setDisplayLanguage] = useState('auto');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 获取新闻数据
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);

      const envApiBase = import.meta.env.VITE_API_URL;
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (sentimentFilter !== 'ALL') params.append('sentiment', sentimentFilter);
      if (impactFilter !== 'ALL') params.append('impact', impactFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (symbolFilter) params.append('symbol', symbolFilter);

      // 根据当前页面协议选择 API 域名，避免 HTTPS 页面调用 HTTP 触发 mixed content
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocal
        ? envApiBase || 'http://localhost:8001'
        : envApiBase || `${window.location.origin.replace(/\/$/, '')}`;
      const apiUrl = `${apiBase}/api/news/latest`;

      const response = await fetch(`${apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      const important = data.important || (data.news || []).filter(item => item.summary);
      const others = data.others || (data.news || []).filter(item => !item.summary);

      // 直接使用后端返回的数据，因为后端已经实现了过滤功能
      setImportantNews(important);
      setOtherNews(others);
      setNews([...important, ...others]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sentimentFilter, impactFilter, searchTerm, symbolFilter]);

  // 初始加载和自动刷新
  useEffect(() => {
    fetchNews();

    if (autoRefresh) {
      const interval = setInterval(fetchNews, 60000); // 每分钟刷新
      return () => clearInterval(interval);
    }
  }, [fetchNews, autoRefresh]);

  // WebSocket 实时更新
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envApiBase = import.meta.env.VITE_API_URL;
    const envWsBase = import.meta.env.VITE_WS_URL; // allow overriding WS endpoint explicitly

    const buildWsUrl = () => {
      // Highest priority: explicit WS endpoint
      if (envWsBase) {
        // If user passes full ws(s):// URL, use as-is; if http(s), convert to ws(s)
        if (envWsBase.startsWith('ws')) {
          return envWsBase.replace(/\/$/, '');
        }
        if (envWsBase.startsWith('http')) {
          const u = new URL(envWsBase);
          const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
          return `${proto}//${u.host}${u.pathname.replace(/\/$/, '')}/news/ws`;
        }
      }

      // Otherwise derive from API base or current host
      let wsHost = isLocal ? 'localhost:8001' : window.location.host;
      let basePath = '/api';
      if (envApiBase) {
        try {
          const u = new URL(envApiBase);
          wsHost = u.host;
          basePath = u.pathname.replace(/\/$/, '') || '/api';
        } catch (e) {
          wsHost = envApiBase.replace(/^https?:\/\//, '');
        }
      }
      return `${wsProtocol}//${wsHost}${basePath}/news/ws`;
    };

    const wsUrl = buildWsUrl();
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error('WS message parse error:', err, event.data);
        return;
      }
      if (data.type === 'new_news') {
        const incoming = data.news;
        // 移除前端过滤，依赖后端过滤
        const hasSummary = !!(incoming.summary && incoming.summary !== '');
        if (hasSummary) {
          setImportantNews(prev => [incoming, ...prev].slice(0, 50));
        } else {
          setOtherNews(prev => [incoming, ...prev].slice(0, 50));
        }
        setNews(prevNews => [incoming, ...prevNews].slice(0, 100)); // 合并视图
        console.log('New news received:', data.news.title);
      } else if (data.type === 'initial_news' && Array.isArray(data.news)) {
        // 只在没有数据时使用 WebSocket 的初始数据，避免覆盖 fetchNews 的结果
        setImportantNews(prev => {
          if (prev.length === 0) {
            const important = data.news.filter(item => item.summary);
            return important.slice(0, 50);
          }
          return prev;
        });
        setOtherNews(prev => {
          if (prev.length === 0) {
            const others = data.news.filter(item => !item.summary);
            return others.slice(0, 50);
          }
          return prev;
        });
        setNews(prev => {
          if (prev.length === 0 && data.news && data.news.length > 0) {
            return data.news.slice(0, 100);
          }
          return prev;
        });
        if (!lastUpdate) {
          setLastUpdate(new Date());
        }
        setLoading(false);
      } else if (data.type === 'refresh_response' && Array.isArray(data.news)) {
        // 直接使用后端数据
        const important = data.news.filter(item => item.summary);
        const others = data.news.filter(item => !item.summary);
        setImportantNews(important.slice(0, 50));
        setOtherNews(others.slice(0, 50));
        setNews([...important, ...others].slice(0, 100));
        setLastUpdate(new Date());
        setLoading(false);
      } else {
        console.debug('WS message (ignored type):', data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // 获取显示的内容（根据语言选择）
  const getDisplayContent = (item, field) => {
    if (displayLanguage === 'cn') {
      return field === 'summary' ? (item.summary_cn || item.summary || item.title) : item.title;
    } else if (displayLanguage === 'en') {
      return field === 'summary' ? (item.summary || item.title) : item.title;
    } else {
      // auto - 根据用户语言
      const useChinese = currentLanguage === 'zh-CN';
      if (field === 'summary') {
        return useChinese ? (item.summary_cn || item.summary || item.title) : (item.summary || item.title);
      }
      return item.title;
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒

    if (diff < 60) return translate('news.timeAgo.seconds').replace('{{count}}', diff);
    if (diff < 3600) return translate('news.timeAgo.minutes').replace('{{count}}', Math.floor(diff / 60));
    if (diff < 86400) return translate('news.timeAgo.hours').replace('{{count}}', Math.floor(diff / 3600));
    return date.toLocaleDateString();
  };

  // 获取情感标签
  const getSentimentClass = (sentiment) => {
    if (!sentiment) return '';
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'sentiment-positive';
    if (s === 'negative') return 'sentiment-negative';
    return 'sentiment-neutral';
  };

  // 获取影响级别样式
  const getImpactClass = (impact) => {
    if (!impact) return '';
    const i = impact.toLowerCase();
    if (i === 'high') return 'impact-high';
    if (i === 'medium') return 'impact-medium';
    return 'impact-low';
  };

  // 渲染新闻卡片
  const renderNewsCard = (item) => {
    const hasUrl = !!(item.url && item.url.trim());

    const subtitle = () => {
      const text = getDisplayContent(item, 'summary');
      if (!text) return '';
      // 取第一句作为副标题
      const firstSentence = text.split(/(?<=[。.!?])\s+/)[0];
      return firstSentence;
    };

    return (
      <div
        key={item.id}
        className={`news-card ${item.summary ? 'news-card--highlight' : ''} ${hasUrl ? 'clickable' : 'no-link'}`}
        onClick={() => hasUrl && window.open(item.url, '_blank')}
      >
        <div className="news-header">
          <div className="news-title-group">
            <h3 className="news-title">{item.title}</h3>
            {item.summary && (
              <p className="news-subtitle">{subtitle()}</p>
            )}
          </div>
          <div className="news-meta">
            <span className="news-source">{item.source}</span>
            <span className="news-time">{formatTime(item.published_at)}</span>
          </div>
        </div>

        <div className="news-content">
          <p className="news-summary">
            {getDisplayContent(item, 'summary')}
          </p>
        </div>

        <div className="news-footer">
          {/* 标的物标签 */}
          {item.symbols && item.symbols.length > 0 && (
            <div className="news-symbols">
              {item.symbols.map(symbol => (
                <span
                  key={symbol}
                  className="symbol-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSymbolFilter((symbol || '').toUpperCase());
                  }}
                >
                  {symbol}
                </span>
              ))}
            </div>
          )}

          {/* 分类、情感和影响标签 */}
          <div className="news-tags">
            {item.category && (
              <span
                className="category-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryFilter(item.category.toLowerCase());
                }}
              >
                {translate(`news.category.${item.category.toLowerCase()}`)}
              </span>
            )}
            {item.sentiment && (
              <span
                className={`sentiment-tag ${getSentimentClass(item.sentiment)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSentimentFilter(item.sentiment.toLowerCase());
                }}
              >
                {translate(`news.sentiment.${item.sentiment.toLowerCase()}`)}
              </span>
            )}
            {item.impact_level && (
              <span
                className={`impact-tag ${getImpactClass(item.impact_level)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setImpactFilter(item.impact_level.toLowerCase());
                }}
              >
                {translate(`news.impact.${item.impact_level.toLowerCase()}`)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="news-container">
      {/* 页面标题 */}
      <div className="news-hero">
        <div>
          <p className="news-eyebrow">{translate('news.eyebrow')}</p>
          <h1>{translate('news.title')}</h1>
          <p className="news-hero-subtitle">
            {translate('news.subtitle')}
          </p>
        </div>
        <div className="hero-actions">
          <span className="pill pill-primary">{translate('news.summarized')} {importantNews.length}</span>
          <span className="pill pill-ghost">{translate('news.titleOnly')} {otherNews.length}</span>
        </div>
      </div>
      <div className="ai-summary-note">
        <span className="pill pill-info">{translate('news.aiNote')}</span>
      </div>

      {/* 控制栏 */}
      <div className="news-controls">
        <div className="controls-row">
          {/* 搜索框 */}
          <input
            type="text"
            className="news-search"
            placeholder={translate('news.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* 分类过滤 */}
          <select
            className="news-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">{translate('news.allCategories')}</option>
            <option value="tech_stocks">{translate('news.category.tech_stocks')}</option>
            <option value="market_indices">{translate('news.category.market_indices')}</option>
            <option value="precious_metals">{translate('news.category.precious_metals')}</option>
            <option value="bonds">{translate('news.category.bonds')}</option>
            <option value="forex">{translate('news.category.forex')}</option>
            <option value="central_banks">{translate('news.category.central_banks')}</option>
            <option value="monetary_policy">{translate('news.category.monetary_policy')}</option>
            <option value="crypto">{translate('news.category.crypto')}</option>
          </select>

          {/* 情感过滤 */}
          <select
            className="news-select"
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
          >
            <option value="ALL">{translate('news.allSentiments')}</option>
            <option value="positive">{translate('news.sentiment.positive')}</option>
            <option value="neutral">{translate('news.sentiment.neutral')}</option>
            <option value="negative">{translate('news.sentiment.negative')}</option>
          </select>

          {/* 影响级别过滤 */}
          <select
            className="news-select"
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
          >
            <option value="ALL">{translate('news.allImpacts')}</option>
            <option value="high">{translate('news.impact.high')}</option>
            <option value="medium">{translate('news.impact.medium')}</option>
            <option value="low">{translate('news.impact.low')}</option>
          </select>

          {/* 语言切换 */}
          <div className="language-toggle">
            <button
              className={displayLanguage === 'auto' ? 'active' : ''}
              onClick={() => setDisplayLanguage('auto')}
            >
              Auto
            </button>
            <button
              className={displayLanguage === 'en' ? 'active' : ''}
              onClick={() => setDisplayLanguage('en')}
            >
              EN
            </button>
            <button
              className={displayLanguage === 'cn' ? 'active' : ''}
              onClick={() => setDisplayLanguage('cn')}
            >
              中文
            </button>
          </div>

          {/* 刷新控制 */}
          <button
            className="refresh-btn"
            onClick={fetchNews}
            disabled={loading}
          >
            {loading ? '⟳' : '↻'} {translate('news.refresh')}
          </button>

          {/* 自动刷新开关 */}
          <button
            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? translate('news.autoRefreshOn') : translate('news.autoRefreshOff')}
          </button>
        </div>

        {/* 最后更新时间 */}
        {lastUpdate && (
          <div className="last-update">
            {translate('news.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* 新闻列表 */}
      <div className="news-list">
        {loading && news.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{translate('news.loading')}</p>
          </div>
        ) : (
          <>
            <div className="news-section">
              <div className="section-header">
                <h2>{translate('news.importantNews')}</h2>
                <div className="section-meta">
                  <span className="pill pill-primary">{translate('news.totalCount').replace('{{count}}', importantNews.length)}</span>
                </div>
              </div>
              {importantNews.length === 0 ? (
                <div className="empty-container">
                  <p>{translate('news.noImportantNews')}</p>
                </div>
              ) : (
                <div className="news-grid">
                  {importantNews.map(item => renderNewsCard(item))}
                </div>
              )}
            </div>

            <div className="news-section">
              <div className="section-header">
                <h2>{translate('news.otherNews')}</h2>
                <div className="section-meta">
                  <span className="pill pill-ghost">{translate('news.totalCount').replace('{{count}}', otherNews.length)}</span>
                </div>
              </div>
              {otherNews.length === 0 ? (
                <div className="empty-container">
                  <p>{translate('news.noOtherNews')}</p>
                </div>
              ) : (
                <div className="news-grid">
                  {otherNews.map(item => renderNewsCard(item))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 统计信息 */}
      {!loading && news.length > 0 && (
        <div className="news-stats">
          <span className="stat-item">
            {translate('news.totalNews')}: {news.length}
          </span>
          <span className="stat-item">
            {translate('news.sentiment.positive')}: {news.filter(n => n.sentiment === 'positive').length}
          </span>
          <span className="stat-item">
            {translate('news.sentiment.negative')}: {news.filter(n => n.sentiment === 'negative').length}
          </span>
        </div>
      )}
    </div>
  );
};

export default News;
