import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const Navigation = ({ currentPage, setCurrentPage, currentUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const navGroups = [
    {
      title: translate('nav.groups.explore'),
      items: [
        { id: 'home', label: translate('nav.home'), badge: 'recommended' },
        { id: 'broker-hub', label: translate('nav.brokerHub') },
        { id: 'analytics', label: translate('nav.analytics') }
      ]
    },
    {
      title: translate('nav.groups.community'),
      items: [
        { id: 'forum', label: translate('forum.title') },
        { id: 'trading', label: translate('nav.trading') },
        { id: 'eth', label: translate('nav.ethPrediction') },
        { id: 'indicators', label: 'Indicator Testing' }
      ]
    },
    {
      title: translate('nav.groups.account'),
      items: currentUser
        ? [{ id: 'forum-mod', label: 'Forum Mod' }]
        : [
            { id: 'login', label: translate('auth.login.nav') },
            { id: 'register', label: translate('auth.register.nav') }
          ]
    }
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
        {currentUser && (
          <div className="badge published" style={{ marginBottom: 8 }}>
            {translate('forum.common.loggedIn').replace('{{name}}', currentUser.username || currentUser.display_name)}
          </div>
        )}
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="nav-group">
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                role="menuitem"
                onClick={() => handleSelect(item.id)}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              >
                {item.label}
                {item.badge === 'recommended' && (
                  <span className="nav-badge">{translate('nav.badges.recommended')}</span>
                )}
              </button>
            ))}
          </div>
        ))}
        {currentUser && (
          <button
            className="nav-item nav-item-logout"
            onClick={() => { onLogout && onLogout(); setIsOpen(false); }}
          >
            {translate('nav.logout')}
          </button>
        )}
      </div>
    </>
  );
};

export default Navigation;
