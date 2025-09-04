import React from 'react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'ShopBack管理' },
    { id: 'showcase', label: 'Showcase' },
    { id: 'predictions', label: 'AI Predictions' },
    { id: 'eth', label: 'ETH Prediction' },
    { id: 'trading', label: 'TradingView' },
    { id: 'donations', label: 'Donations' }
  ];

  return (
    <div className="card card-padded" style={{ marginBottom: 20 }}>
      <div className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
