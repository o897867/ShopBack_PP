import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = '/api';

// Dynamic WebSocket URL that works through nginx proxy
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // includes hostname and port
  return `${protocol}//${host}/ws/xau/price-updates`;
};

const WS_URL = getWebSocketUrl();

export const useXauPrice = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [candles, setCandles] = useState([]);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch current price
      const priceResponse = await fetch(`${API_BASE_URL}/xau/current-price`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentPrice(priceData.current_price);
      }

      // Fetch recent candles
      const candlesResponse = await fetch(`${API_BASE_URL}/xau/candles?interval=1m&limit=100`);
      if (candlesResponse.ok) {
        const candlesData = await candlesResponse.json();
        setCandles(candlesData.candles);
      }

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/xau/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch initial data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      let lastPongTime = Date.now();

      ws.onopen = () => {
        console.log('XAU WebSocket connected');
        setIsConnected(true);
        setError(null);
        lastPongTime = Date.now();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ping') {
            // Respond to ping to keep connection alive
            lastPongTime = Date.now();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
          } else if (data.type === 'initial') {
            // Initial data when connecting
            setCurrentPrice(data.current_price);
            if (data.recent_candles) {
              setCandles(data.recent_candles);
            }
          } else if (data.type === 'update') {
            // Update with new candle
            if (data.candle) {
              setCandles(prev => {
                // Keep last 100 candles
                const updated = [...prev.slice(-99), data.candle];
                return updated;
              });
              setCurrentPrice(data.candle.close);
            }
          } else if (data.type === 'disabled') {
            setError('XAU data service is temporarily disabled');
            ws.close();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('XAU WebSocket error:', error);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('XAU WebSocket disconnected', { code: event.code, reason: event.reason });
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection with exponential backoff
        const reconnectDelay = Math.min(5000 * Math.pow(1.5, reconnectTimeoutRef.current ? 1 : 0), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect in ${reconnectDelay}ms...`);
          connectWebSocket();
        }, reconnectDelay);
      };

      // Check connection health periodically
      const healthCheckInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const timeSinceLastPong = Date.now() - lastPongTime;
          if (timeSinceLastPong > 90000) { // No ping in 90 seconds
            console.warn('XAU WebSocket appears stale, closing connection');
            ws.close();
          }
        } else {
          clearInterval(healthCheckInterval);
        }
      }, 15000);

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect XAU WebSocket:', err);
      setError('Failed to connect to real-time updates');
      setIsConnected(false);

      // Retry connection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  }, []);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Refresh data manually
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Initialize on mount
  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    // Set up periodic refresh (every 5 minutes as backup)
    const refreshInterval = setInterval(refresh, 300000);

    return () => {
      clearInterval(refreshInterval);
      disconnectWebSocket();
    };
  }, []);

  return {
    currentPrice,
    candles,
    stats,
    isConnected,
    isLoading,
    error,
    refresh,
    reconnect: connectWebSocket
  };
};
