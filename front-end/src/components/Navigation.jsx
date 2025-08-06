import React from 'react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'ShopBack管理', icon: '' },
    { id: 'trading', label: 'TradingView', icon: '' },
    { id: 'donations', label: 'Donations', icon: '' }
  ];

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '15px',
      justifyContent: 'center'
    }}>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setCurrentPage(item.id)}
          style={{
            background: currentPage === item.id ? '#007bff' : '#f8f9fa',
            color: currentPage === item.id ? 'white' : '#333',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default Navigation;