import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol = "BINANCE:BTCUSDT", theme = "dark" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": theme,
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_widget"
      });
      
      containerRef.current.appendChild(script);
    }
  }, [symbol, theme]);

  return (
    <div 
      ref={containerRef}
      style={{ height: '600px', width: '100%' }}
      id="tradingview_widget"
    />
  );
};

export default TradingViewWidget;