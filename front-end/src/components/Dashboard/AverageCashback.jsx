import React from 'react';

const AverageCashback = ({ dashboardStats, translate }) => {
  if (!dashboardStats) return null;

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '8px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h2 style={{margin: '0 0 15px 0', color: '#333'}}>{translate('dashboard.avgCashback')}</h2>
      <div style={{fontSize: '4em', color: '#007bff', fontWeight: 'bold'}}>
        {dashboardStats.avg_cashback_rate}%
      </div>
    </div>
  );
};

export default AverageCashback;