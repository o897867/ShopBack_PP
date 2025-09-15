import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const navItems = [
    { id: 'home', label: translate('showcase.categories') },
    { id: 'dashboard', label: translate('nav.dashboard') },
    { id: 'showcase', label: translate('showcase.title') },
    { id: 'forum', label: 'Forum' },
    { id: 'forum-mod', label: 'Forum Mod' },
    { id: 'predictions', label: 'AI Predictions' },
    { id: 'eth', label: 'ETH Prediction' },
    { id: 'trading', label: translate('nav.trading') },
    { id: 'donations', label: translate('nav.donations') }
  ];

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
      </div>
    </>
  );
};

export default Navigation;
