import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = '/api';

// Dynamic WebSocket URL that works through nginx proxy
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // includes hostname and port
  return `${protocol}//${host}/ws/eth/kalman-updates`;
};

const WS_URL = getWebSocketUrl();

export const useEthKalman = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [candles, setCandles] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch current price and model state
      const priceResponse = await fetch(`${API_BASE_URL}/eth/current-price`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentPrice(priceData.current_price);
        setModelMetrics(priceData.model_state);
      }

      // Fetch recent candles
      const candlesResponse = await fetch(`${API_BASE_URL}/eth/candles-3m?limit=100`);
      if (candlesResponse.ok) {
        const candlesData = await candlesResponse.json();
        setCandles(candlesData.candles);
      }

      // Fetch predictions
      const predictionsResponse = await fetch(`${API_BASE_URL}/eth/predictions`);
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData);
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
        console.log('ETH WebSocket connected');
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
            setCurrentPrice(data.current_price);
            setModelMetrics(data.model_state);
          } else if (data.type === 'update') {
            // Update with new candle and predictions
            if (data.candle) {
              setCandles(prev => {
                const updated = [...prev.slice(-99), data.candle];
                return updated;
              });
              setCurrentPrice(data.candle.close);
            }
            
            if (data.predictions) {
              setPredictions(data.predictions);
            }
            
            if (data.model_state) {
              setModelMetrics(data.model_state);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', { code: event.code, reason: event.reason });
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
          if (timeSinceLastPong > 60000) { // No ping in 60 seconds
            console.warn('WebSocket appears stale, closing connection');
            ws.close();
          }
        } else {
          clearInterval(healthCheckInterval);
        }
      }, 10000);

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
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

  // Adjust half-life parameter
  const adjustHalfLife = useCallback(async (halfLifeCandles) => {
    try {
      const response = await fetch(`${API_BASE_URL}/eth/model/half-life?half_life_candles=${halfLifeCandles}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Half-life adjusted:', data);
        
        // Fetch updated predictions
        const predictionsResponse = await fetch(`${API_BASE_URL}/eth/predictions`);
        if (predictionsResponse.ok) {
          const predictionsData = await predictionsResponse.json();
          setPredictions(predictionsData);
        }
        
        return data;
      } else {
        throw new Error('Failed to adjust half-life');
      }
    } catch (err) {
      console.error('Error adjusting half-life:', err);
      setError('Failed to adjust half-life: ' + err.message);
    }
  }, []);

  // Fetch model metrics
  const fetchModelMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eth/model/metrics`);
      if (response.ok) {
        const data = await response.json();
        setModelMetrics(data.metrics);
        return data;
      }
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    // Set up periodic metrics refresh
    const metricsInterval = setInterval(fetchModelMetrics, 30000); // Every 30 seconds

    return () => {
      clearInterval(metricsInterval);
      disconnectWebSocket();
    };
  }, []);

  return {
    currentPrice,
    predictions,
    candles,
    modelMetrics,
    isConnected,
    isLoading,
    error,
    adjustHalfLife,
    fetchModelMetrics,
    reconnect: connectWebSocket
  };
};