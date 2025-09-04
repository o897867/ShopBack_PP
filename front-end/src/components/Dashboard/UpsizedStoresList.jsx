import React from 'react';
import { detectPlatform } from '../../utils/platformDetector.js';

const UpsizedStoresList = ({ upsizedStores, translate }) => {
  if (upsizedStores.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h2 style={{margin: '0 0 25px 0', color: '#333'}}>
        {translate('dashboard.upsizedStores')} ({upsizedStores.length})
      </h2>
      
      {upsizedStores.map((store, index) => {
        const platform = detectPlatform(store.url);
        
        return (
          <div key={index} style={{
            padding: '20px',
            borderBottom: index < upsizedStores.length - 1 ? '1px solid #eee' : 'none',
            background: `linear-gradient(to right,  white)`,
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            {/* 商家名称和平台标签 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <div>
                <h3 style={{margin: '0 0 5px 0', color: '#333', fontSize: '1.3em'}}>
                  {store.name}
                </h3>
                {/* 平台标签 */}
                <div style={{
                  display: 'inline-block',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75em',
                  fontWeight: 'bold'
                }}>
                  {platform}
                </div>
              </div>
              
              {/* UPSIZED标签 */}
              <span style={{
                background: '#dc3545',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8em',
                fontWeight: 'bold'
              }}>
                 UPSIZED
              </span>
            </div>
            
            {/* Cashback信息 */}
            <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#28a745', marginBottom: '8px'}}>
              {store.main_cashback}
              {store.previous_offer && (
                <span style={{
                  color: '#666',
                  textDecoration: 'line-through',
                  marginLeft: '15px',
                  fontSize: '0.7em'
                }}>
                  {translate('upsized.originalPrice')}: {store.previous_offer}
                </span>
              )}
            </div>
            
            {/* 其他信息 */}
            <p style={{color: '#007bff', fontSize: '14px', margin: '5px 0'}}>
              {store.url}
            </p>
            <p style={{color: '#999', fontSize: '12px', margin: 0}}>
              {translate('upsized.scraped')}: {new Date(store.scraped_at).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default UpsizedStoresList;
