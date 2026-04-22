import React, { useCallback, useState, useEffect, useMemo } from 'react';
import './Home.css';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const Home = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [news, setNews] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [gua, setGua] = useState(null);
  const [newsLoading, setNewsLoading] = useState(true);

  // Fetch news
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const envApiBase = import.meta.env.VITE_API_URL;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocal
          ? envApiBase || 'http://localhost:8001'
          : envApiBase || `${window.location.origin.replace(/\/$/, '')}`;
        const res = await fetch(`${apiBase}/api/news/latest?limit=5`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setNews((data.news || []).filter(item => item.summary).slice(0, 5));
      } catch (e) {
        console.warn('Failed to load news:', e);
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch weekly reports
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const envApiBase = import.meta.env.VITE_API_URL;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocal
          ? envApiBase || 'http://localhost:8001'
          : envApiBase || `${window.location.origin.replace(/\/$/, '')}`;
        const res = await fetch(`${apiBase}/api/weekly/reports`);
        if (!res.ok) throw new Error('Failed');
        const reports = await res.json();
        if (!cancelled && reports.length > 0) {
          const latest = reports[0];
          // Fetch full report detail for nodes
          const detailRes = await fetch(`${apiBase}/api/weekly/reports/${latest.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (!cancelled) setWeekly(detail);
          }
        }
      } catch (e) {
        console.warn('Failed to load weekly:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch fortune
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/fortune');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.gua) setGua(data.gua);
      } catch (e) {
        console.warn('Failed to load fortune:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleNavigate = (target) => {
    if (target === 'weekly-mindmap') {
      window.location.href = '/weekly-mindmap';
      return;
    }
    if (!onNavigate) return;
    onNavigate(target);
  };

  // Sentiment badge
  const getSentimentClass = (sentiment) => {
    if (!sentiment) return '';
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'hp-badge--green';
    if (s === 'negative') return 'hp-badge--red';
    return 'hp-badge--amber';
  };

  const getSentimentLabel = (sentiment) => {
    if (!sentiment) return '';
    const s = sentiment.toLowerCase();
    if (isChinese) {
      if (s === 'positive') return '积极';
      if (s === 'negative') return '消极';
      return '中性';
    }
    if (s === 'positive') return 'Positive';
    if (s === 'negative') return 'Negative';
    return 'Neutral';
  };

  // Impact badge
  const getImpactClass = (impact) => {
    if (!impact) return '';
    const i = impact.toLowerCase();
    if (i === 'high') return 'hp-badge--red';
    if (i === 'medium') return 'hp-badge--amber';
    return 'hp-badge--gray';
  };

  const getImpactLabel = (impact) => {
    if (!impact) return '';
    const i = impact.toLowerCase();
    if (isChinese) {
      if (i === 'high') return '高影响';
      if (i === 'medium') return '中等影响';
      return '低影响';
    }
    if (i === 'high') return 'High';
    if (i === 'medium') return 'Medium';
    return 'Low';
  };

  // Format relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return isChinese ? `${diff}秒前` : `${diff}s ago`;
    if (diff < 3600) return isChinese ? `${Math.floor(diff / 60)}分钟前` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isChinese ? `${Math.floor(diff / 3600)}小时前` : `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Get display content
  const getDisplayContent = (item) => {
    if (isChinese) return item.summary_cn || item.summary || item.title;
    return item.summary || item.title;
  };

  // Weekly report date formatting
  const getWeekLabel = () => {
    if (!weekly) return '';
    const d = new Date(weekly.date);
    const weekNum = Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7);
    return `${d.getFullYear()} W${String(d.getMonth() * 4 + weekNum).padStart(2, '0')}`;
  };

  return (
    <div className="hp">
      <div className="hp-inner">

        {/* Nav */}
        <nav className="hp-nav">
          <div className="hp-brand">
            {isChinese ? (
              <>临象<span className="hp-brand__light">财经</span></>
            ) : (
              <>LinXiang<span className="hp-brand__light">Finance</span></>
            )}
          </div>
          <div className="hp-nav__links">
            <button className="hp-nav__link" onClick={() => handleNavigate('news')}>
              {isChinese ? '金融新闻' : 'News'}
            </button>
            <button className="hp-nav__link" onClick={() => handleNavigate('fortune')}>
              {isChinese ? '每日一卦' : 'Fortune'}
            </button>
            <button className="hp-nav__link" onClick={() => handleNavigate('weekly-mindmap')}>
              {isChinese ? '周报' : 'Weekly'}
            </button>
            <button className="hp-nav__link" onClick={() => handleNavigate('guide')}>
              {isChinese ? '关于我们' : 'About'}
            </button>
            <a
              href="https://portal.cnfxhero.com/register?node=MjE4MzQw&language=zh-Hans"
              target="_blank"
              rel="noopener noreferrer"
              className="hp-nav__cta"
            >
              {isChinese ? '立即开户 →' : 'Open account →'}
            </a>
            <div className="hp-nav__toggles">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hp-hero">
          <p className="hp-hero__eyebrow">
            {isChinese ? '面向散户的金融资讯平台' : 'Financial intelligence for retail investors'}
          </p>
          <h1 className="hp-hero__title">
            {isChinese ? (
              <>万象皆声，<em className="hp-hero__em">唯静者能听</em></>
            ) : (
              <>All noise, <em className="hp-hero__em">only the still can hear</em></>
            )}
          </h1>
          <p className="hp-hero__desc">
            {isChinese
              ? '我们为普通投资者提供简洁、及时、不废话的市场资讯与交易参考。AI摘要精华，每日更新，帮你在噪音中找到信号。'
              : 'We provide concise, timely market intelligence for everyday investors. AI-powered summaries, daily updates — find the signal in the noise.'}
          </p>
          <div className="hp-hero__actions">
            <a
              href="https://portal.cnfxhero.com/register?node=MjE4MzQw&language=zh-Hans"
              target="_blank"
              rel="noopener noreferrer"
              className="hp-btn hp-btn--outline"
            >
              {isChinese ? '立即开户' : 'Open account'}
            </a>
            <button className="hp-link" onClick={() => handleNavigate('guide')}>
              {isChinese ? '了解更多 →' : 'Learn more →'}
            </button>
          </div>
        </section>

        {/* Stats strip */}
        <div className="hp-stats">
          {[
            { val: isChinese ? '实时' : 'Live', label: isChinese ? '实时金融新闻' : 'Real-time financial news' },
            { val: 'AI', label: isChinese ? '智能摘要' : 'Smart summaries' },
            { val: isChinese ? '周报' : 'Weekly', label: isChinese ? '每周深度复盘' : 'Deep weekly review' },
          ].map(({ val, label }) => (
            <div key={label} className="hp-stats__item">
              <div className="hp-stats__val">{val}</div>
              <div className="hp-stats__label">{label}</div>
            </div>
          ))}
        </div>

        {/* About / Features */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-header__label">{isChinese ? '关于我们' : 'About us'}</span>
            <span className="hp-section-header__line" />
          </div>
          <div className="hp-features">
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                ),
                title: isChinese ? '实时资讯' : 'Real-time news',
                desc: isChinese
                  ? '聚合全球主流财经媒体，AI自动摘要，第一时间掌握市场动态。'
                  : 'Aggregated from top financial media, auto-summarized by AI.',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
                  </svg>
                ),
                title: isChinese ? '专业分析' : 'Expert analysis',
                desc: isChinese
                  ? '每周深度复盘，涵盖宏观走势、板块轮动与关键技术位。'
                  : 'Weekly deep-dives covering macro trends, sector rotation, and key technicals.',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: isChinese ? '合规经营' : 'Regulated',
                desc: isChinese
                  ? '持牌运营，受监管机构监督，资金安全有保障，透明费率。'
                  : 'Licensed and regulated, with transparent fees and fund protection.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="hp-feature-card">
                <div className="hp-feature-card__icon">{icon}</div>
                <h3 className="hp-feature-card__title">{title}</h3>
                <p className="hp-feature-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* News + Weekly two-column */}
        <div className="hp-two-col">

          {/* News column */}
          <div>
            <div className="hp-section-header">
              <span className="hp-section-header__label">{isChinese ? '最新新闻' : 'Latest news'}</span>
              <span className="hp-section-header__line" />
              <button className="hp-link" onClick={() => handleNavigate('news')}>
                {isChinese ? '查看全部 →' : 'View all →'}
              </button>
            </div>
            {newsLoading ? (
              <div className="hp-empty">{isChinese ? '加载中…' : 'Loading…'}</div>
            ) : news.length === 0 ? (
              <div className="hp-empty">{isChinese ? '暂无新闻' : 'No news available'}</div>
            ) : (
              <div className="hp-news-list">
                {news.map((item) => (
                  <article
                    key={item.id}
                    className="hp-news-item"
                    onClick={() => item.url && window.open(item.url, '_blank')}
                  >
                    <p className="hp-news-item__title">{item.title}</p>
                    <p className="hp-news-item__summary">{getDisplayContent(item)}</p>
                    <div className="hp-news-item__meta">
                      {item.source && <span className="hp-news-item__source">{item.source}</span>}
                      {item.source && <span className="hp-dot" />}
                      <span className="hp-news-item__time">{formatTime(item.published_at)}</span>
                      {item.sentiment && (
                        <span className={`hp-badge ${getSentimentClass(item.sentiment)}`}>
                          {getSentimentLabel(item.sentiment)}
                        </span>
                      )}
                      {item.impact_level && (
                        <span className={`hp-badge ${getImpactClass(item.impact_level)}`}>
                          {getImpactLabel(item.impact_level)}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Weekly column */}
          <div>
            <div className="hp-section-header">
              <span className="hp-section-header__label">{isChinese ? '本周周报' : 'This week'}</span>
              <span className="hp-section-header__line" />
            </div>
            {weekly ? (
              <div className="hp-weekly-card">
                <div className="hp-weekly-card__head">
                  <h3 className="hp-weekly-card__title">{weekly.title}</h3>
                  <span className="hp-weekly-card__week">{weekly.date}</span>
                </div>
                <div className="hp-weekly-card__divider" />
                <ul className="hp-weekly-card__bullets">
                  {(weekly.nodes || []).slice(0, 4).map((node, i) => (
                    <li key={node.id || i} className="hp-weekly-card__bullet">
                      <span className="hp-weekly-card__dot" />
                      <p>{node.title}{node.subtitle ? ` — ${node.subtitle}` : ''}</p>
                    </li>
                  ))}
                </ul>
                <div className="hp-weekly-card__divider" />
                <button className="hp-link" onClick={() => handleNavigate('weekly-mindmap')}>
                  {isChinese ? '阅读完整周报 →' : 'Read full report →'}
                </button>
              </div>
            ) : (
              <div className="hp-weekly-card hp-weekly-card--empty">
                <p className="hp-empty">{isChinese ? '暂无周报' : 'No weekly report yet'}</p>
                <button className="hp-link" onClick={() => handleNavigate('weekly-mindmap')}>
                  {isChinese ? '查看周报导图 →' : 'View weekly mindmap →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fortune card */}
        {gua && (
          <section className="hp-section">
            <div className="hp-section-header">
              <span className="hp-section-header__label">{isChinese ? '今日一卦' : "Today's fortune"}</span>
              <span className="hp-section-header__line" />
            </div>
            <div className="hp-fortune-banner">
              <div className="hp-fortune-banner__shrine">{gua.char}</div>
              <div className="hp-fortune-banner__body">
                <div className="hp-fortune-banner__top">
                  <span className="hp-fortune-banner__name">{gua.name}</span>
                  <span className={`hp-fortune-tag hp-fortune-tag--${gua.tag}`}>{gua.tag}</span>
                </div>
                <p className="hp-fortune-banner__sub">{gua.sub}</p>
                <p className="hp-fortune-banner__verdict">{gua.verdict}</p>
              </div>
              <button className="hp-btn hp-btn--outline hp-btn--sm" onClick={() => handleNavigate('fortune')}>
                {isChinese ? '查看详情 →' : 'View details →'}
              </button>
            </div>
          </section>
        )}

        {/* CTA — Open Account */}
        <div className="hp-cta">
          <div className="hp-cta__body">
            <h3 className="hp-cta__title">
              {isChinese ? '准备好开始交易了吗？' : 'Ready to start trading?'}
            </h3>
            <p className="hp-cta__desc">
              {isChinese
                ? '开户流程简单，最快5分钟完成，即可访问全球市场'
                : 'Simple signup, as fast as 5 minutes, access global markets'}
            </p>
          </div>
          <a
            href="https://portal.cnfxhero.com/register?node=MjE4MzQw&language=zh-Hans"
            target="_blank"
            rel="noopener noreferrer"
            className="hp-btn hp-btn--outline hp-btn--sm"
          >
            {isChinese ? '立即开户 →' : 'Open account →'}
          </a>
        </div>

        {/* Footer */}
        <footer className="hp-footer">
          <p className="hp-footer__copy">
            {isChinese
              ? '© 2026 临象财经 · 投资有风险，入市需谨慎'
              : '© 2026 LinXiangFinance · Investment involves risk'}
          </p>
          <div className="hp-footer__links">
            {(isChinese
              ? ['隐私政策', '使用条款', '联系我们']
              : ['Privacy', 'Terms', 'Contact']
            ).map(label => (
              <button key={label} className="hp-footer__link">{label}</button>
            ))}
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Home;
