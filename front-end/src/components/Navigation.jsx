import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const Navigation = ({ currentPage, setCurrentPage, currentUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const baseItems = [
    { id: 'broker-hub', label: translate('nav.brokerHub') },
    { id: 'forum', label: translate('forum.title') },
    { id: 'trading', label: translate('nav.trading') }
  ];

  const authItems = currentUser
    ? [{ id: 'forum-mod', label: 'Forum Mod' }] // 可根据角色再细化
    : [
        { id: 'login', label: translate('auth.login.nav') },
        { id: 'register', label: translate('auth.register.nav') }
      ];

  const navItems = [...baseItems, ...authItems];

  const handleSelect = (id) => {
    setCurrentPage(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle button fixed at top-left */}
      <button
        className={`nav-toggle ${isOpen ? 'open' : ''}`}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        {/* Hamburger / close icon */}
        <svg
          className="nav-toggle-icon"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <>
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {/* Slide-out drawer */}
      <div className={`nav-drawer ${isOpen ? 'open' : ''}`} role="menu">
        {currentUser && (
          <div className="badge published" style={{ marginBottom: 8 }}>
            已登录：{currentUser.username || currentUser.display_name}
          </div>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            role="menuitem"
            onClick={() => handleSelect(item.id)}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
        {currentUser && (
          <button
            className="nav-item"
            onClick={() => { onLogout && onLogout(); setIsOpen(false); }}
          >
            退出登录
          </button>
        )}
      </div>
    </>
  );
};

export default Navigation;
