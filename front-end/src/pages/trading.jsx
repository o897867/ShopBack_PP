import React, { useState } from 'react';

const TradingViewPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');
  const [theme, setTheme] = useState('dark');

  const popularSymbols = [
    { label: 'Bitcoin (BTC/USDT)', value: 'BINANCE:BTCUSDT' },
    { label: 'USDJPY', value: 'FX_IDC:USDJPY' },
    { label: 'Gold (XAU/USD)', value: 'TVC:GOLD' },
    { label: 'EURJPY', value: 'FX_IDC:EURJPY' },
    { label: 'EURUSD', value: 'FX_IDC:EURUSD' },
    { label: 'Silver (XAG/USD)', value: 'TVC:SILVER' }
  ];

  return (
    <div>
      {/* 控制面板 */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📈 TradingView图表
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              选择交易对:
            </label>
            <select 
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {popularSymbols.map(symbol => (
                <option key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              主题:
            </label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="dark">🌙 深色主题</option>
              <option value="light">☀️ 浅色主题</option>
            </select>
          </div>
        </div>
      </div>

      {/* TradingView图表占位符 */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h3>📈 TradingView 图表</h3>
          <p>当前交易对: {selectedSymbol}</p>
          <p>主题: {theme}</p>
          <p style={{color: '#666', fontSize: '14px'}}>
            TradingView组件将在这里显示
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingViewPage;
