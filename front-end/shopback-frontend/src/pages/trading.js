import React, { useState } from 'react';
import TradingViewWidget from '../components/tradingWidget';

const TradingViewPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');
  const [theme, setTheme] = useState('dark');

  const popularSymbols = [
    { label: 'Bitcoin (BTC/USDT)', value: 'BINANCE:BTCUSDT' },
    { label: 'USDJPY', value: '	FX_IDC:USDJPY' },
    { label: 'Gold (XAU/USD)', value: 'TVC:GOLD' },
    { label: 'EURJPY', value: 'FX_IDC:EURJPY' },
    { label: 'USDJPY', value: 'FX_IDC:USDJPY' },
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

      {/* TradingView图表 */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <TradingViewWidget symbol={selectedSymbol} theme={theme} />
      </div>

      {/* 快速访问按钮 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🚀 快速切换:</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {popularSymbols.slice(0, 6).map(symbol => (
            <button
              key={symbol.value}
              onClick={() => setSelectedSymbol(symbol.value)}
              style={{
                background: selectedSymbol === symbol.value ? '#007bff' : '#f8f9fa',
                color: selectedSymbol === symbol.value ? 'white' : '#333',
                border: '1px solid #ddd',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradingViewPage;