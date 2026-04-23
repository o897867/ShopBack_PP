import React, { useState, useCallback, useEffect } from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import './TopNav.css';

const OPEN_ACCOUNT_URL = 'https://portal.cnfxhero.com/register?node=MjE4MzQw&language=zh-Hans';

const NAV_ITEMS = [
  { key: 'home', cn: '首页', en: 'Home' },
  { key: 'news', cn: '金融新闻', en: 'News' },
  { key: 'fortune', cn: '每日一卦', en: 'Fortune' },
  { key: 'weekly-mindmap', cn: '每周周报', en: 'Weekly' },
  { key: 'analytics', cn: '数据分析', en: 'Analytics' },
  { key: 'guide', cn: '关于我们', en: 'About' },
];

const TopNav = ({ onNavigate, activePage }) => {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = useCallback((target) => {
    setDrawerOpen(false);
    if (target === 'weekly-mindmap') {
      window.location.href = '/weekly-mindmap';
      return;
    }
    if (!onNavigate) {
      window.location.href = `/#${target}`;
      return;
    }
    onNavigate(target);
  }, [onNavigate]);

  // Close drawer on ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const linkClass = (page) =>
    `topnav__link${activePage === page ? ' topnav__link--active' : ''}`;

  return (
    <>
      <nav className="topnav">
        <div className="topnav__inner">
          <button className="topnav__brand" onClick={() => handleNav('home')}>
            {isChinese ? (
              <>临象<span className="topnav__brand-light">财经</span></>
            ) : (
              <>LinXiang<span className="topnav__brand-light">Finance</span></>
            )}
          </button>

          {/* Desktop links */}
          <div className="topnav__links">
            <button className={linkClass('news')} onClick={() => handleNav('news')}>
              {isChinese ? '金融新闻' : 'News'}
            </button>
            <button className={linkClass('fortune')} onClick={() => handleNav('fortune')}>
              {isChinese ? '每日一卦' : 'Fortune'}
            </button>
            <button className={linkClass('weekly-mindmap')} onClick={() => handleNav('weekly-mindmap')}>
              {isChinese ? '周报' : 'Weekly'}
            </button>
            <button className={linkClass('guide')} onClick={() => handleNav('guide')}>
              {isChinese ? '关于我们' : 'About'}
            </button>
            <a
              href={OPEN_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="topnav__cta"
            >
              {isChinese ? '立即开户 →' : 'Open account →'}
            </a>
            <div className="topnav__toggles">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>

          {/* Mobile icons (search + hamburger) */}
          <div className="topnav__mobile-icons">
            <button className="topnav__icon-btn" aria-label="Search" onClick={() => handleNav('news')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
            <button className="topnav__icon-btn" aria-label="Menu" onClick={() => setDrawerOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`topnav-scrim${drawerOpen ? ' topnav-scrim--open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`topnav-drawer${drawerOpen ? ' topnav-drawer--open' : ''}`}>
        <div className="topnav-drawer__head">
          <span className="topnav-drawer__brand">
            {isChinese ? (
              <>临象<span className="topnav__brand-light">财经</span></>
            ) : (
              <>LinXiang<span className="topnav__brand-light">Finance</span></>
            )}
          </span>
          <button className="topnav__icon-btn" aria-label="Close" onClick={() => setDrawerOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="topnav-drawer__nav">
          {NAV_ITEMS.map(({ key, cn, en }) => (
            <button
              key={key}
              className={`topnav-drawer__item${activePage === key ? ' topnav-drawer__item--active' : ''}`}
              onClick={() => handleNav(key)}
            >
              <span>{isChinese ? cn : en}</span>
              <span className="topnav-drawer__en">{isChinese ? en : cn}</span>
            </button>
          ))}
        </div>
        <div className="topnav-drawer__toggles">
          <ThemeToggle />
          <LanguageSelector />
        </div>
        <div className="topnav-drawer__footer">
          <a
            href={OPEN_ACCOUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="topnav-drawer__cta"
          >
            {isChinese ? '立即开户 · Open account' : 'Open account · 立即开户'}
            <span>→</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default TopNav;
