import React from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import './TopNav.css';

const OPEN_ACCOUNT_URL = 'https://portal.cnfxhero.com/register?node=MjE4MzQw&language=zh-Hans';

const TopNav = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';

  const handleNav = (target) => {
    if (target === 'weekly-mindmap') {
      window.location.href = '/weekly-mindmap';
      return;
    }
    if (!onNavigate) {
      // fallback: use hash navigation
      window.location.href = `/#${target}`;
      return;
    }
    onNavigate(target);
  };

  return (
    <nav className="topnav">
      <div className="topnav__inner">
        <button className="topnav__brand" onClick={() => handleNav('home')}>
          {isChinese ? (
            <>临象<span className="topnav__brand-light">财经</span></>
          ) : (
            <>LinXiang<span className="topnav__brand-light">Finance</span></>
          )}
        </button>
        <div className="topnav__links">
          <button className="topnav__link" onClick={() => handleNav('news')}>
            {isChinese ? '金融新闻' : 'News'}
          </button>
          <button className="topnav__link" onClick={() => handleNav('fortune')}>
            {isChinese ? '每日一卦' : 'Fortune'}
          </button>
          <button className="topnav__link" onClick={() => handleNav('weekly-mindmap')}>
            {isChinese ? '周报' : 'Weekly'}
          </button>
          <button className="topnav__link" onClick={() => handleNav('guide')}>
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
      </div>
    </nav>
  );
};

export default TopNav;
