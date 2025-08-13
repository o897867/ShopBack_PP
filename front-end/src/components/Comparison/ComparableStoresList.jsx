import React from 'react';

const ComparableStoresList = ({ comparableStores, handleCompareStore, translate }) => {
  if (comparableStores.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
        {translate('compare.title')} ({comparableStores.length})
      </h2>
      <p style={{color: '#666', marginBottom: '20px'}}>
        {translate('compare.description')}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px'
      }}>
        {comparableStores.map((store, index) => (
          <div key={index} 
               onClick={() => handleCompareStore(store.name)}
               style={{
                 padding: '15px',
                 border: '2px solid #e9ecef',
                 borderRadius: '8px',
                 cursor: 'pointer',
                 transition: 'all 0.2s',
                 background: '#f8f9fa'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.borderColor = '#007bff';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.borderColor = '#e9ecef';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}>
            <h4 style={{margin: '0 0 8px 0', color: '#333'}}>{store.name}</h4>
            <div style={{fontSize: '12px', color: '#666'}}>
              {translate('compare.platforms')}: {store.platforms}
            </div>
            <div style={{fontSize: '12px', color: '#007bff', marginTop: '5px'}}>
              {translate('compare.clickToCompare')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparableStoresList;