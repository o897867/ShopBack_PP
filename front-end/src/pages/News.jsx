import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import './News.css';

const CATEGORIES = [
  { key: '', label_cn: '全部', label_en: 'All' },
  { key: 'crypto', label_cn: '加密 Crypto', label_en: 'Crypto' },
  { key: 'monetary_policy', label_cn: '政策 Policy', label_en: 'Policy' },
  { key: 'market_indices', label_cn: '指数 Indices', label_en: 'Indices' },
  { key: 'forex', label_cn: '外汇 Forex', label_en: 'Forex' },
  { key: 'precious_metals', label_cn: '大宗 Commodities', label_en: 'Commodities' },
  { key: 'tech_stocks', label_cn: '个股 Equities', label_en: 'Equities' },
];

function getApiBase() {
  return import.meta.env.VITE_API_URL || '';
}

const News = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [impact, setImpact] = useState('');
  const [search, setSearch] = useState('');
  const [clock, setClock] = useState('');
  const searchDebounce = useRef(null);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ important_limit: '20', others_limit: '30' });
      if (category) params.set('category', category);
      if (sentiment) params.set('sentiment', sentiment);
      if (impact) params.set('impact', impact);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${getApiBase()}/api/news/latest?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setNews(data.news || []);
    } catch (e) {
      console.warn('Failed to load news:', e);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [category, sentiment, impact, search]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {}, 300);
  };

  // Helpers
  const getSentimentClass = (s) => {
    if (!s) return '';
    const v = s.toLowerCase();
    if (v === 'positive') return 'news-badge--green';
    if (v === 'negative') return 'news-badge--red';
    return 'news-badge--amber';
  };

  const getSentimentLabel = (s) => {
    if (!s) return '';
    const v = s.toLowerCase();
    if (isChinese) return v === 'positive' ? '积极' : v === 'negative' ? '消极' : '中性';
    return v === 'positive' ? 'Positive' : v === 'negative' ? 'Negative' : 'Neutral';
  };

  const getImpactClass = (i) => {
    if (!i) return '';
    const v = i.toLowerCase();
    if (v === 'high') return 'news-badge--red';
    if (v === 'medium') return 'news-badge--amber';
    return 'news-badge--gray';
  };

  const getImpactLabel = (i) => {
    if (!i) return '';
    const v = i.toLowerCase();
    if (isChinese) return v === 'high' ? '高影响' : v === 'medium' ? '中等影响' : '低影响';
    return v === 'high' ? 'High' : v === 'medium' ? 'Medium' : 'Low';
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatRelative = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() / 1000) - ts);
    if (diff < 60) return isChinese ? `${diff}秒前` : `${diff}s ago`;
    if (diff < 3600) return isChinese ? `${Math.floor(diff / 60)}分钟前` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isChinese ? `${Math.floor(diff / 3600)}小时前` : `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts * 1000).toLocaleDateString();
  };

  const getDisplayTitle = (item) => {
    return item.title_cn || item.title || '';
  };

  const getDisplaySummary = (item) => {
    return item.summary_cn || item.summary || '';
  };

  // Date string
  const dateStr = new Date().toLocaleDateString(isChinese ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: isChinese ? 'long' : 'short',
    day: 'numeric',
    weekday: isChinese ? 'long' : 'long',
  });

  // Split first featured vs rest
  const featured = news.length > 0 ? news[0] : null;
  const rest = news.slice(1);

  return (
    <div className="news-page">
      <div className="news-page__inner">
        <TopNav onNavigate={onNavigate} activePage="news" />

        {/* Masthead */}
        <section className="news-mast">
          <p className="news-mast__eyebrow">
            {isChinese ? '最新资讯 · Real-time news' : 'Real-time financial news'}
          </p>
          <h1 className="news-mast__title">
            {isChinese ? '市场速览' : 'Market Brief'}
          </h1>
          <div className="news-mast__meta-bar">
            <span className="news-mast__date">{dateStr}</span>
            <span className="news-dot-sep" />
            <span className="news-mast__date">{clock}</span>
            <span style={{ flex: 1 }} />
            <span className="news-live">
              <span className="news-live__dot" />
              Live · {isChinese ? '实时' : 'Live'}
            </span>
          </div>

          {/* Categories */}
          <nav className="news-cats">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`news-cats__item${category === cat.key ? ' active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                {isChinese ? cat.label_cn : cat.label_en}
              </button>
            ))}
          </nav>

          {/* Filters */}
          <div className="news-filters">
            <input
              className="news-input news-search"
              type="search"
              placeholder={isChinese ? '搜索新闻 / Search…' : 'Search news…'}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <select
              className="news-input news-select"
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
            >
              <option value="">{isChinese ? '所有情绪 · All sentiment' : 'All sentiment'}</option>
              <option value="positive">{isChinese ? '积极' : 'Positive'}</option>
              <option value="neutral">{isChinese ? '中性' : 'Neutral'}</option>
              <option value="negative">{isChinese ? '消极' : 'Negative'}</option>
            </select>
            <select
              className="news-input news-select"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            >
              <option value="">{isChinese ? '影响 · All impact' : 'All impact'}</option>
              <option value="high">{isChinese ? '高影响' : 'High'}</option>
              <option value="medium">{isChinese ? '中等' : 'Medium'}</option>
              <option value="low">{isChinese ? '低影响' : 'Low'}</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="news-empty">{isChinese ? '加载中…' : 'Loading…'}</div>
        ) : news.length === 0 ? (
          <div className="news-empty">{isChinese ? '暂无新闻' : 'No news found'}</div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <article
                className="news-featured"
                style={{ cursor: featured.url ? 'pointer' : 'default' }}
                onClick={() => featured.url && window.open(featured.url, '_blank')}
              >
                <div className="news-featured__srcline">
                  {featured.source && (
                    <span className="news-featured__src">{featured.source}</span>
                  )}
                  {featured.source && <span className="news-dot-sep" />}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>
                    {formatTime(featured.published_at)} · {formatRelative(featured.published_at)}
                  </span>
                  {featured.sentiment && (
                    <span className={`news-badge ${getSentimentClass(featured.sentiment)}`}>
                      {getSentimentLabel(featured.sentiment)}
                    </span>
                  )}
                  {featured.impact_level && (
                    <span className={`news-badge ${getImpactClass(featured.impact_level)}`}>
                      {getImpactLabel(featured.impact_level)}
                    </span>
                  )}
                </div>
                <h2 className="news-featured__title">{getDisplayTitle(featured)}</h2>
                <p className="news-featured__summary">{getDisplaySummary(featured)}</p>
              </article>
            )}

            {/* News list */}
            <div className="news-list">
              {rest.map((item) => (
                <article
                  key={item.id}
                  className="news-item"
                  onClick={() => item.url && window.open(item.url, '_blank')}
                >
                  <span className="news-item__time">{formatTime(item.published_at)}</span>
                  <div>
                    {item.source && <span className="news-item__src">{item.source}</span>}
                    <p className="news-item__title">{getDisplayTitle(item)}</p>
                    <p className="news-item__sum">{getDisplaySummary(item)}</p>
                  </div>
                  <div className="news-item__badges">
                    {item.sentiment && (
                      <span className={`news-badge ${getSentimentClass(item.sentiment)}`}>
                        {getSentimentLabel(item.sentiment)}
                      </span>
                    )}
                    {item.impact_level && (
                      <span className={`news-badge ${getImpactClass(item.impact_level)}`}>
                        {getImpactLabel(item.impact_level)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="news-footer">
          <p className="news-footer__copy">
            {isChinese
              ? '© 2026 临象财经 · 投资有风险，入市需谨慎'
              : '© 2026 LinXiangFinance · Investment involves risk'}
          </p>
          <div className="news-footer__links">
            {(isChinese
              ? ['隐私政策', '使用条款', '联系我们']
              : ['Privacy', 'Terms', 'Contact']
            ).map(label => (
              <button key={label} className="news-footer__link">{label}</button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default News;
