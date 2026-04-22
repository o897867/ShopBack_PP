import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import TopNav from '../components/TopNav.jsx';
import './News.css';

const BATCH_SIZE = 10;

const CATEGORIES = [
  { key: 'ALL', labelKey: 'news.allCategories', labelShort: { en: 'All', zh: '全部' } },
  { key: 'crypto', labelKey: 'news.category.crypto', labelShort: { en: 'Crypto', zh: '加密货币' } },
  { key: 'monetary_policy', labelKey: 'news.category.monetary_policy', labelShort: { en: 'Policy', zh: '货币政策' } },
  { key: 'market_indices', labelKey: 'news.category.market_indices', labelShort: { en: 'Indices', zh: '市场指数' } },
  { key: 'precious_metals', labelKey: 'news.category.precious_metals', labelShort: { en: 'Metals', zh: '商品' } },
  { key: 'bonds', labelKey: 'news.category.bonds', labelShort: { en: 'Bonds', zh: '债券' } },
  { key: 'forex', labelKey: 'news.category.forex', labelShort: { en: 'Forex', zh: '外汇' } },
  { key: 'tech_stocks', labelKey: 'news.category.tech_stocks', labelShort: { en: 'Tech', zh: '科技股' } },
  { key: 'central_banks', labelKey: 'news.category.central_banks', labelShort: { en: 'Banks', zh: '央行' } },
];

const News = () => {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';
  const translate = (key) => t(key, currentLanguage);

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [impactFilter, setImpactFilter] = useState('ALL');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [displayLanguage, setDisplayLanguage] = useState('auto');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [categoryFilter, sentimentFilter, impactFilter, searchTerm, symbolFilter]);

  // Fetch news
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

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocal
        ? envApiBase || 'http://localhost:8001'
        : envApiBase || `${window.location.origin.replace(/\/$/, '')}`;
      const apiUrl = `${apiBase}/api/news/latest`;

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch news');

      const data = await response.json();
      setNews(data.news || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sentimentFilter, impactFilter, searchTerm, symbolFilter]);

  // Initial load & auto-refresh
  useEffect(() => {
    fetchNews();
    if (autoRefresh) {
      const interval = setInterval(fetchNews, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchNews, autoRefresh]);

  // WebSocket
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envApiBase = import.meta.env.VITE_API_URL;
    const envWsBase = import.meta.env.VITE_WS_URL;

    const buildWsUrl = () => {
      if (envWsBase) {
        if (envWsBase.startsWith('ws')) return envWsBase.replace(/\/$/, '');
        if (envWsBase.startsWith('http')) {
          const u = new URL(envWsBase);
          const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
          return `${proto}//${u.host}${u.pathname.replace(/\/$/, '')}/news/ws`;
        }
      }
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
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === 'new_news') {
        const incoming = data.news;
        if (incoming.summary) {
          setNews(prev => [incoming, ...prev].slice(0, 100));
        }
      } else if (data.type === 'initial_news' && Array.isArray(data.news)) {
        setNews(prev => {
          if (prev.length === 0) return data.news.filter(item => item.summary).slice(0, 100);
          return prev;
        });
        if (!lastUpdate) setLastUpdate(new Date());
        setLoading(false);
      } else if (data.type === 'refresh_response' && Array.isArray(data.news)) {
        setNews(data.news.filter(item => item.summary).slice(0, 100));
        setLastUpdate(new Date());
        setLoading(false);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    return () => ws.close();
  }, []);

  // Display content by language
  const getDisplayContent = (item, field) => {
    const useChinese = displayLanguage === 'cn' || (displayLanguage === 'auto' && isChinese);
    if (field === 'summary') {
      return useChinese
        ? (item.summary_cn || item.summary || item.title)
        : (item.summary || item.title);
    }
    return item.title;
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return translate('news.timeAgo.seconds').replace('{{count}}', diff);
    if (diff < 3600) return translate('news.timeAgo.minutes').replace('{{count}}', Math.floor(diff / 60));
    if (diff < 86400) return translate('news.timeAgo.hours').replace('{{count}}', Math.floor(diff / 3600));
    return date.toLocaleDateString();
  };

  // Sentiment tag class
  const getSentimentTagClass = (sentiment) => {
    if (!sentiment) return 'b-tag';
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'b-tag b-tag-green';
    if (s === 'negative') return 'b-tag b-tag-red';
    return 'b-tag b-tag-amber';
  };

  // Impact tag class
  const getImpactTagClass = (impact) => {
    if (!impact) return 'b-tag';
    const i = impact.toLowerCase();
    if (i === 'high') return 'b-tag b-tag-red';
    if (i === 'medium') return 'b-tag b-tag-amber';
    return 'b-tag';
  };

  // Featured = first news item
  const featured = news[0] || null;

  // Remaining items
  const allItems = useMemo(() => {
    return news.slice(1);
  }, [news]);

  const totalCount = allItems.length + (featured ? 1 : 0);
  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  // Format today's date
  const todayStr = useMemo(() => {
    const now = new Date();
    if (isChinese) {
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · 星期${weekdays[now.getDay()]}`;
    }
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [isChinese]);

  // Live time
  const [liveTime, setLiveTime] = useState('');
  useEffect(() => {
    const tick = () => setLiveTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const openUrl = (url) => {
    if (url && url.trim()) window.open(url, '_blank');
  };

  return (
    <div className="news-container">
      <TopNav />
      <div className="news-inner">

        {/* Masthead */}
        <div className="b-masthead">
          <h1 className="b-pub-name">{translate('news.title')}</h1>
          <div className="b-pub-tagline">{translate('news.subtitle')}</div>
          <nav className="b-nav">
            {CATEGORIES.map((cat, i) => (
              <React.Fragment key={cat.key}>
                {i > 0 && <div className="b-nav-sep" />}
                <button
                  className={categoryFilter === cat.key ? 'active' : ''}
                  onClick={() => setCategoryFilter(cat.key)}
                >
                  {isChinese ? cat.labelShort.zh : cat.labelShort.en}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Meta bar */}
        <div className="b-meta-bar">
          <div className="b-date">{todayStr}</div>
          <div className="b-live">
            <div className="b-live-dot" />
            {isChinese ? '实时更新' : 'Live'} · {liveTime}
          </div>
        </div>

        {/* Controls */}
        <div className="b-controls">
          <input
            type="text"
            className="b-search"
            placeholder={translate('news.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="b-select"
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
          >
            <option value="ALL">{translate('news.allSentiments')}</option>
            <option value="positive">{translate('news.sentiment.positive')}</option>
            <option value="neutral">{translate('news.sentiment.neutral')}</option>
            <option value="negative">{translate('news.sentiment.negative')}</option>
          </select>
          <select
            className="b-select"
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
          >
            <option value="ALL">{translate('news.allImpacts')}</option>
            <option value="high">{translate('news.impact.high')}</option>
            <option value="medium">{translate('news.impact.medium')}</option>
            <option value="low">{translate('news.impact.low')}</option>
          </select>
          <div className="b-lang-toggle">
            <button className={displayLanguage === 'auto' ? 'active' : ''} onClick={() => setDisplayLanguage('auto')}>Auto</button>
            <button className={displayLanguage === 'en' ? 'active' : ''} onClick={() => setDisplayLanguage('en')}>EN</button>
            <button className={displayLanguage === 'cn' ? 'active' : ''} onClick={() => setDisplayLanguage('cn')}>中文</button>
          </div>
        </div>

        {/* Content */}
        {loading && news.length === 0 ? (
          <div className="b-loading">
            <div className="b-spinner" />
            <p>{translate('news.loading')}</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <div
                className="b-featured"
                onClick={() => openUrl(featured.url)}
              >
                <div className="b-label">{isChinese ? '今日重点' : 'Top Story'}</div>
                <p className="b-featured-title">{featured.title}</p>
                <p className="b-featured-body">{getDisplayContent(featured, 'summary')}</p>
                <div className="b-row">
                  {featured.source && <span className="b-source">{featured.source}</span>}
                  {featured.source && <div className="b-dot" />}
                  <span className="b-time">{formatTime(featured.published_at)}</span>
                  {featured.symbols && featured.symbols.length > 0 && (
                    <>
                      <div className="b-dot" />
                      {featured.symbols.map(s => (
                        <span
                          key={s}
                          className="b-tag"
                          onClick={(e) => { e.stopPropagation(); setSymbolFilter((s || '').toUpperCase()); }}
                        >
                          {s}
                        </span>
                      ))}
                    </>
                  )}
                  {featured.sentiment && (
                    <span
                      className={getSentimentTagClass(featured.sentiment)}
                      onClick={(e) => { e.stopPropagation(); setSentimentFilter(featured.sentiment.toLowerCase()); }}
                    >
                      {translate(`news.sentiment.${featured.sentiment.toLowerCase()}`)}
                    </span>
                  )}
                  {featured.impact_level && (
                    <span
                      className={getImpactTagClass(featured.impact_level)}
                      onClick={(e) => { e.stopPropagation(); setImpactFilter(featured.impact_level.toLowerCase()); }}
                    >
                      {translate(`news.impact.${featured.impact_level.toLowerCase()}`)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Section header */}
            <div className="b-section-head">
              <span>{isChinese ? '更多新闻' : 'More News'}</span>
              <div className="b-line" />
              <span>
                {isChinese
                  ? `显示 ${Math.min(visibleCount, allItems.length)} / ${totalCount} 条`
                  : `${Math.min(visibleCount, allItems.length)} / ${totalCount}`}
              </span>
            </div>

            {/* News list */}
            {allItems.length === 0 ? (
              <div className="b-empty">{translate('news.noNews')}</div>
            ) : (
              <div>
                {visibleItems.map((item) => {
                  const hasUrl = !!(item.url && item.url.trim());
                  return (
                    <div
                      key={item.id}
                      className={`b-item ${hasUrl ? '' : 'no-link'}`}
                      onClick={() => hasUrl && openUrl(item.url)}
                    >
                      <p className="b-item-title">{item.title}</p>
                      {item.summary && (
                        <p className="b-item-body">{getDisplayContent(item, 'summary')}</p>
                      )}
                      <div className="b-item-meta">
                        {item.source && <span className="b-source">{item.source}</span>}
                        {item.source && <div className="b-dot" />}
                        <span className="b-time">{formatTime(item.published_at)}</span>
                        {item.symbols && item.symbols.length > 0 && item.symbols.map(s => (
                          <span
                            key={s}
                            className="b-tag"
                            onClick={(e) => { e.stopPropagation(); setSymbolFilter((s || '').toUpperCase()); }}
                          >
                            {s}
                          </span>
                        ))}
                        {item.sentiment && (
                          <span
                            className={getSentimentTagClass(item.sentiment)}
                            onClick={(e) => { e.stopPropagation(); setSentimentFilter(item.sentiment.toLowerCase()); }}
                          >
                            {translate(`news.sentiment.${item.sentiment.toLowerCase()}`)}
                          </span>
                        )}
                        {item.impact_level && (
                          <span
                            className={getImpactTagClass(item.impact_level)}
                            onClick={(e) => { e.stopPropagation(); setImpactFilter(item.impact_level.toLowerCase()); }}
                          >
                            {translate(`news.impact.${item.impact_level.toLowerCase()}`)}
                          </span>
                        )}
                        {item.category && (
                          <span className="b-impact">
                            {translate(`news.category.${item.category.toLowerCase()}`)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Progress + Load More */}
            {allItems.length > 0 && (
              <>
                <div className="b-progress">
                  {isChinese
                    ? (hasMore
                      ? `显示 ${Math.min(visibleCount, allItems.length)} / ${totalCount} 条`
                      : `全部 ${totalCount} 条已加载`)
                    : (hasMore
                      ? `Showing ${Math.min(visibleCount, allItems.length)} of ${totalCount}`
                      : `All ${totalCount} loaded`)}
                </div>
                {hasMore && (
                  <button
                    className="b-more-btn"
                    onClick={() => setVisibleCount(prev => prev + BATCH_SIZE)}
                  >
                    {isChinese ? '加载更多 ↓' : 'Load more ↓'}
                  </button>
                )}
              </>
            )}

            {/* Footer */}
            <div className="b-footer">
              <div className="b-footer-note">
                {isChinese ? '由 ' : 'Summarized by '}
                <span>ChatGPT</span>
                {autoRefresh
                  ? (isChinese ? ' · 自动刷新已开启' : ' · Auto-refresh on')
                  : (isChinese ? ' · 自动刷新已关闭' : ' · Auto-refresh off')}
                {lastUpdate && (
                  <> · {lastUpdate.toLocaleTimeString()}</>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`b-btn ${autoRefresh ? 'active' : ''}`}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh
                    ? (isChinese ? '⏸ 暂停' : '⏸ Pause')
                    : (isChinese ? '▶ 自动' : '▶ Auto')}
                </button>
                <button
                  className="b-btn"
                  onClick={fetchNews}
                  disabled={loading}
                >
                  {isChinese ? '⟳ 刷新' : '⟳ Refresh'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default News;
