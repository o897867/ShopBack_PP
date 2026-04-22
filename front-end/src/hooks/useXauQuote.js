import { useEffect, useRef, useState, useCallback } from 'react';

const API_BASE_URL = '/api';

export const useXauQuote = (pollIntervalMs = 2000) => {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/xau/quote`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setQuote(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load quote');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    timerRef.current = setInterval(fetchQuote, pollIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchQuote, pollIntervalMs]);

  return { quote, error, isLoading, refresh: fetchQuote };
};
