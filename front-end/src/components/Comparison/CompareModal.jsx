import React from 'react';

const CompareModal = ({ showComparison, selectedComparison, setShowComparison, translate }) => {
  if (!showComparison || !selectedComparison) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '15px'
        }}>
          <h2 style={{margin: 0, color: '#333'}}>
            🆚 {selectedComparison.store_name} {translate('compare.title')}
          </h2>
          <button 
            onClick={() => setShowComparison(false)}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {translate('common.close')}
          </button>
        </div>

        {/* 最佳推荐 */}
        {selectedComparison.best_platform && (
          <div style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '1.3em'}}>
              {translate('compare.bestChoice')}
            </h3>
            <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>
              {selectedComparison.best_platform.toUpperCase()}: {selectedComparison.best_rate}%
            </div>
          </div>
        )}

        {/* 平台比较 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {Object.entries(selectedComparison.platforms).map(([platform, data]) => (
            <div key={platform} style={{
              border: platform === selectedComparison.best_platform ? 
                '3px solid #28a745' : '2px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              background: platform === selectedComparison.best_platform ? 
                '#f8fff9' : 'white'
            }}>
              {/* 平台名称 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}>
                <h4 style={{
                  margin: 0,
                  color: platform === 'shopback' ? '#007bff' : '#dc3545',
                  textTransform: 'uppercase',
                  fontSize: '1.1em'
                }}>
                  {platform === 'shopback' ? 'ShopBack' : 'CashRewards'}
                </h4>
                {platform === selectedComparison.best_platform && (
                  <span style={{
                    background: '#28a745',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {translate('compare.best')}
                  </span>
                )}
              </div>

              {/* Cashback率 */}
              <div style={{marginBottom: '10px'}}>
                <div style={{fontSize: '0.9em', color: '#666'}}>{translate('compare.cashbackRate')}</div>
                <div style={{
                  fontSize: '2em',
                  fontWeight: 'bold',
                  color: platform === selectedComparison.best_platform ? '#28a745' : '#333'
                }}>
                  {data.cashback}
                </div>
              </div>

              {/* 特殊标签 */}
              {data.is_upsized && (
                <div style={{
                  background: '#dc3545',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  display: 'inline-block'
                }}>
                  UPSIZED
                </div>
              )}

              {/* 更新时间 */}
              <div style={{fontSize: '0.8em', color: '#999'}}>
                {translate('time.updated')}: {new Date(data.last_updated).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* 比较说明 */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '6px',
          borderLeft: '4px solid #007bff'
        }}>
          <h5 style={{margin: '0 0 8px 0', color: '#333'}}></h5>
          <ul style={{margin: 0, paddingLeft: '20px', fontSize: '0.9em', color: '#666'}}>
            <li>{translate('compare.tip1')}</li>
            <li>{translate('compare.tip2')}</li>
            <li>{translate('compare.tip3')}</li>
            <li>{translate('compare.tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;