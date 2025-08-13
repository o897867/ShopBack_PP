import { useState, useEffect, useCallback, useRef } from 'react';

export const useBayesianModel = (storeId = null) => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDataFetch, setLastDataFetch] = useState(null);
  const modelRef = useRef(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = storeId 
        ? `/api/predictions/${storeId}`
        : '/api/predictions/global';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No model exists, try to trigger training
          const trainResponse = await fetch('/api/predictions/retrain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id: storeId })
          });
          
          if (trainResponse.ok) {
            setError('Model is being trained. Please check back in a few minutes.');
          } else {
            setError('No prediction model available and training failed.');
          }
          return null;
        }
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      return data.prediction;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [storeId]);

  const initializeModel = useCallback(async () => {
    const predictionData = await fetchPredictions();
    
    if (predictionData) {
      // Store the predictions from the Python backend
      setPredictions(predictionData);
      setLastDataFetch(new Date());
    }
    
    setLoading(false);
  }, [fetchPredictions]);

  const updateModelWithNewData = useCallback(async () => {
    // For Python backend, we just refresh predictions
    const predictionData = await fetchPredictions();
    
    if (predictionData) {
      setPredictions(predictionData);
      setLastDataFetch(new Date());
    }
  }, [fetchPredictions]);

  const refreshPredictions = useCallback(async () => {
    await updateModelWithNewData();
  }, [updateModelWithNewData]);

  const loadStoredModel = useCallback(() => {
    // For Python backend, we don't use localStorage for models
    // Models are stored in the database and managed by the backend
    return false;
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      await initializeModel();
    };

    loadModel();
  }, [storeId, initializeModel]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshPredictions();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshPredictions]);

  const getPredictionForStore = useCallback(async (specificStoreId) => {
    try {
      const response = await fetch(`/api/predictions/${specificStoreId}`);
      if (!response.ok) throw new Error('Failed to fetch store predictions');
      
      const data = await response.json();
      return data.prediction;
    } catch (err) {
      console.error('Error getting store prediction:', err);
      return null;
    }
  }, []);

  return {
    model,
    predictions,
    loading,
    error,
    updateModelWithNewData,
    refreshPredictions,
    getPredictionForStore,
    lastDataFetch,
    modelConfidence: predictions?.model_confidence || 0
  };
};

export const useBayesianComparison = (storeIds = []) => {
  const [comparisons, setComparisons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparisons = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const results = {};
        
        for (const storeId of storeIds) {
          const response = await fetch(`/api/predictions/${storeId}`);
          if (response.ok) {
            const data = await response.json();
            results[storeId] = data.prediction;
          }
        }
        
        setComparisons(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (storeIds.length > 0) {
      fetchComparisons();
    }
  }, [storeIds]);

  return { comparisons, loading, error };
};

export const useModelAutoUpdate = (predictions, interval = 300000) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!predictions) return;

    const checkForUpdates = async () => {
      setIsUpdating(true);
      
      try {
        // Check scheduler status
        const response = await fetch('/api/predictions/scheduler-status');
        if (response.ok) {
          const data = await response.json();
          const schedulerStatus = data.scheduler_status;
          
          if (schedulerStatus.last_update_time) {
            const lastUpdateTime = new Date(schedulerStatus.last_update_time);
            if (!lastUpdate || lastUpdateTime > lastUpdate) {
              setLastUpdate(lastUpdateTime);
              setUpdateCount(schedulerStatus.update_count || 0);
            }
          }
        }
      } catch (err) {
        console.error('Auto-update failed:', err);
      } finally {
        setIsUpdating(false);
      }
    };

    const intervalId = setInterval(checkForUpdates, interval);
    
    checkForUpdates();

    return () => clearInterval(intervalId);
  }, [predictions, interval, lastUpdate]);

  return { isUpdating, lastUpdate, updateCount };
};