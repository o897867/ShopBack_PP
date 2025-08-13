import React from 'react';

const StoreList = ({ stores, storeHook, fetchData, translate }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
        {translate('stores.title')} ({stores.length})
      </h2>
      
      {/* 添加商家表单 */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '6px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{margin: '0 0 15px 0', color: '#333'}}>➕ {translate('stores.addNew')}</h4>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <input
            type="text"
            placeholder={translate('stores.addUrl')}
            value={storeHook.addStoreUrl}
            onChange={(e) => storeHook.setAddStoreUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => storeHook.handleAddStore(fetchData)}
            disabled={storeHook.isAdding || !storeHook.addStoreUrl.trim()}
            style={{
              background: storeHook.isAdding ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: storeHook.isAdding ? 'not-allowed' : 'pointer'
            }}
          >
            {storeHook.isAdding ? '添加中...' : '添加'}
          </button>
        </div>
        {storeHook.addMessage && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '4px',
            background: storeHook.addMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: storeHook.addMessage.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${storeHook.addMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {storeHook.addMessage.text}
          </div>
        )}
      </div>

      {/* 商家列表 */}
      {stores.map((store) => (
        <div key={store.id} onClick={() => storeHook.handleStoreClick(store)} style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          borderRadius: '6px',
          marginBottom: '10px',
          background: '#f8f9fa',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}>
          <h3 style={{margin: '0 0 8px 0', color: '#333'}}>{store.name}</h3>
          <p style={{color: '#007bff', margin: '0 0 8px 0', fontSize: '14px'}}>
            {store.url}
          </p>
          <p style={{color: '#999', fontSize: '12px', margin: 0}}>
            {translate('store.updateTime')}: {new Date(store.updated_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StoreList;