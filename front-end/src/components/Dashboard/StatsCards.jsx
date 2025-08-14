import React from 'react';

const StatsCards = ({ dashboardStats, translate }) => {
  if (!dashboardStats) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #007bff'
      }}>
        <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.totalStores')}</h3>
        <div style={{fontSize: '3em', color: '#007bff', fontWeight: 'bold'}}>
          {dashboardStats.total_stores}
        </div>
      </div>
      
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #28a745'
      }}>
        <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.totalRecords')}</h3>
        <div style={{fontSize: '3em', color: '#28a745', fontWeight: 'bold'}}>
          {dashboardStats.total_records?.toLocaleString()}
        </div>
      </div>
      
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #ffc107'
      }}>
        <div style={{fontSize: '3em', marginBottom: '10px'}}></div>
        <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.recentScrapes')}</h3>
        <div style={{fontSize: '3em', color: '#ffc107', fontWeight: 'bold'}}>
          {dashboardStats.recent_scrapes}
        </div>
      </div>
      
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #dc3545'
      }}>
        <div style={{fontSize: '3em', marginBottom: '10px'}}></div>
        <h3 style={{margin: 0, color: '#666'}}>{translate('dashboard.upsizedStores')}</h3>
        <div style={{fontSize: '3em', color: '#dc3545', fontWeight: 'bold'}}>
          {dashboardStats.upsized_stores}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;