import React from 'react';
import { formatDate } from '../../utils/dateFormatter.js';

const StoreDetails = ({ storeHook, translate }) => {
  const { selectedStore, storeHistory, setSelectedStore, getCategoryStats } = storeHook;
  
  if (!selectedStore) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginTop: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h2 style={{margin: 0, color: '#333'}}>
          {selectedStore.name} - {translate('stores.storeDetails')}
        </h2>
        <button 
          onClick={() => setSelectedStore(null)}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          关闭
        </button>
      </div>

      {/* 商家历史记录 */}
      {storeHistory.length > 0 && (
        <div>
          <h3 style={{color: '#333', marginBottom: '20px'}}>{translate('stores.cashbackHistory')}</h3>
          
          {/* 按日期分组显示 */}
          {Object.entries(
            storeHistory.reduce((groups, record) => {
              const date = new Date(record.scraped_at).toLocaleDateString();
              if (!groups[date]) groups[date] = [];
              groups[date].push(record);
              return groups;
            }, {})
          ).map(([date, records]) => (
            <div key={date} style={{marginBottom: '30px'}}>
              <h4 style={{
                color: '#007bff', 
                marginBottom: '15px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '5px'
              }}>
                📅 {date}
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '15px'
              }}>
                {records.map((record, index) => {
                  const categoryStats = getCategoryStats(record.category);
                  
                  return (
                    <div key={index} style={{
                      background: record.category === 'Main' ? '#e8f4fd' : '#f8f9fa',
                      border: record.category === 'Main' ? '2px solid #007bff' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <h5 style={{
                          margin: 0,
                          color: record.category === 'Main' ? '#007bff' : '#333',
                          fontSize: '1.1em'
                        }}>
                          {record.category === 'Main' ? '🌟 主要优惠' : `📂 ${record.category}`}
                        </h5>
                        {record.is_upsized && (
                          <span style={{
                            background: '#dc3545',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8em',
                            fontWeight: 'bold'
                          }}>
                            🔥 UPSIZED
                          </span>
                        )}
                      </div>
                      
                      <div style={{
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        color: '#28a745',
                        marginBottom: '5px'
                      }}>
                        {record.category === 'Main' ? record.main_cashback : record.category_rate}
                      </div>
                      
                      {record.previous_offer && (
                        <div style={{
                          color: '#666',
                          textDecoration: 'line-through',
                          fontSize: '0.9em',
                          marginBottom: '5px'
                        }}>
                          之前: {record.previous_offer}
                        </div>
                      )}

                      {/* 史高史低信息 */}
                      {categoryStats && (
                        <div style={{
                          background: 'rgba(0, 123, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '10px',
                          marginTop: '10px',
                          fontSize: '0.9em'
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px'
                          }}>
                            <div>
                              <div style={{
                                fontWeight: 'bold',
                                color: '#dc3545',
                                marginBottom: '3px'
                              }}>
                                {translate('stats.highestRate')}:: {categoryStats.highest_rate}%
                              </div>
                              <div style={{color: '#666', fontSize: '0.8em'}}>
                                {formatDate(categoryStats.highest_date)}
                              </div>
                            </div>
                            <div>
                              <div style={{
                                fontWeight: 'bold',
                                color: '#6c757d',
                                marginBottom: '3px'
                              }}>
                                 📉 {translate('stats.lowestRate')}: {categoryStats.lowest_rate}%
                              </div>
                              <div style={{color: '#666', fontSize: '0.8em'}}>
                                {formatDate(categoryStats.lowest_date)}
                              </div>
                            </div>
                          </div>
                          
                          {/* 当前比例与史高史低的比较 */}
                          <div style={{marginTop: '8px', padding: '5px 0', borderTop: '1px solid #dee2e6'}}>
                            {categoryStats.current_rate === categoryStats.highest_rate && (
                              <span style={{color: '#dc3545', fontWeight: 'bold', fontSize: '0.8em'}}>
                                {translate('stats.currentIsHighest')}
                              </span>
                            )}
                            {categoryStats.current_rate === categoryStats.lowest_rate && (
                              <span style={{color: '#6c757d', fontWeight: 'bold', fontSize: '0.8em'}}>
                                📉 {translate('stats.currentIsLowest')}
                              </span>
                            )}
                            {categoryStats.current_rate !== categoryStats.highest_rate && 
                             categoryStats.current_rate !== categoryStats.lowest_rate && (
                              <span style={{color: '#666', fontSize: '0.8em'}}>
                                {translate('stats.differenceFromHigh')}: {(categoryStats.highest_rate - categoryStats.current_rate).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div style={{
                        color: '#999',
                        fontSize: '0.8em',
                        marginTop: '5px'
                      }}>
                        {new Date(record.scraped_at).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {storeHistory.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{fontSize: '3em', marginBottom: '15px'}}>📭</div>
          <p>{translate('stores.noHistory')}</p>
        </div>
      )}
    </div>
  );
};

export default StoreDetails;