import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export const useXauQuoteHistory = (pollIntervalMs = 4000) => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/xau/quote/history?limit=120`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.quotes || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load quote history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    timerRef.current = setInterval(fetchHistory, pollIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchHistory, pollIntervalMs]);

  return { history, error, isLoading, refresh: fetchHistory };
};
