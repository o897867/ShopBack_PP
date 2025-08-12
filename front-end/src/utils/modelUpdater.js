import { BayesianCashbackModel, processHistoricalData } from './bayesianModel';

export class ModelUpdateManager {
  constructor() {
    this.updateQueue = [];
    this.isProcessing = false;
    this.updateListeners = new Set();
    this.lastFetchTime = null;
    this.updateInterval = 300000;
    this.autoUpdateEnabled = true;
  }

  subscribe(callback) {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.updateListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  async checkForNewData() {
    try {
      const response = await fetch('/api/history?limit=100&order=desc');
      if (!response.ok) throw new Error('Failed to fetch recent data');
      
      const recentData = await response.json();
      
      if (!this.lastFetchTime) {
        this.lastFetchTime = new Date();
        return recentData;
      }
      
      const newData = recentData.filter(entry => 
        new Date(entry.scraped_at) > this.lastFetchTime
      );
      
      if (newData.length > 0) {
        this.lastFetchTime = new Date();
        this.notifyListeners('new_data_detected', { count: newData.length });
      }
      
      return newData;
    } catch (error) {
      console.error('Error checking for new data:', error);
      this.notifyListeners('error', { message: error.message });
      return [];
    }
  }

  async updateModel(model, newData) {
    if (!model || !newData || newData.length === 0) return model;
    
    try {
      this.notifyListeners('update_started', { dataCount: newData.length });
      
      const observations = processHistoricalData(newData);
      
      observations.forEach(obs => {
        model.updateWithObservation(obs);
      });
      
      const modelKey = `bayesian_model_${new Date().getTime()}`;
      localStorage.setItem(modelKey, model.serializeModel());
      
      localStorage.setItem('latest_model_key', modelKey);
      
      this.notifyListeners('update_completed', { 
        observationCount: observations.length,
        totalObservations: model.observationCount
      });
      
      return model;
    } catch (error) {
      console.error('Error updating model:', error);
      this.notifyListeners('error', { message: error.message });
      return model;
    }
  }

  async processUpdateQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      
      try {
        await this.updateModel(update.model, update.data);
      } catch (error) {
        console.error('Error processing update:', error);
      }
    }
    
    this.isProcessing = false;
  }

  queueUpdate(model, data) {
    this.updateQueue.push({ model, data });
    this.processUpdateQueue();
  }

  startAutoUpdate(model) {
    if (!this.autoUpdateEnabled) return;
    
    const performUpdate = async () => {
      const newData = await this.checkForNewData();
      
      if (newData.length > 0) {
        this.queueUpdate(model, newData);
      }
    };
    
    performUpdate();
    
    const intervalId = setInterval(performUpdate, this.updateInterval);
    
    return () => {
      clearInterval(intervalId);
      this.autoUpdateEnabled = false;
    };
  }

  async detectAnomalies(model, newData) {
    if (!model || !newData || newData.length === 0) return [];
    
    const anomalies = [];
    const predictions = model.getModelSummary().predictions;
    
    newData.forEach(entry => {
      const rate = entry.main_rate_numeric || entry.category_rate_numeric || 0;
      
      if (Math.abs(rate - predictions.magnitude.expectedChange) > 
          predictions.magnitude.standardDeviation * 3) {
        anomalies.push({
          type: 'unusual_rate',
          storeId: entry.store_id,
          storeName: entry.store_name,
          rate,
          expected: predictions.magnitude.expectedChange,
          deviation: Math.abs(rate - predictions.magnitude.expectedChange)
        });
      }
      
      if (entry.is_upsized && predictions.upsizeProbability.probability < 10) {
        anomalies.push({
          type: 'unexpected_upsize',
          storeId: entry.store_id,
          storeName: entry.store_name,
          probability: predictions.upsizeProbability.probability
        });
      }
    });
    
    if (anomalies.length > 0) {
      this.notifyListeners('anomalies_detected', { anomalies });
    }
    
    return anomalies;
  }

  async syncWithBackend(model) {
    try {
      const modelData = {
        posteriors: model.posteriors,
        observationCount: model.observationCount,
        lastUpdate: model.lastUpdate
      };
      
      const response = await fetch('/api/model-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
      
      if (response.ok) {
        this.notifyListeners('sync_completed', { success: true });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners('sync_failed', { error: error.message });
      return false;
    }
  }

  getUpdateHistory() {
    const history = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('bayesian_model_')) {
        const timestamp = parseInt(key.replace('bayesian_model_', ''));
        history.push({
          key,
          timestamp: new Date(timestamp),
          size: localStorage.getItem(key).length
        });
      }
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  cleanOldModels(keepCount = 5) {
    const history = this.getUpdateHistory();
    
    if (history.length <= keepCount) return;
    
    const toDelete = history.slice(keepCount);
    
    toDelete.forEach(item => {
      localStorage.removeItem(item.key);
    });
    
    this.notifyListeners('cleanup_completed', { 
      deleted: toDelete.length,
      kept: keepCount
    });
  }

  async validateModel(model) {
    if (!model) return { valid: false, errors: ['Model is null'] };
    
    const errors = [];
    
    if (model.observationCount < 10) {
      errors.push('Insufficient observations for reliable predictions');
    }
    
    const predictions = model.getModelSummary().predictions;
    
    if (predictions.nextChange.expectedDays < 0) {
      errors.push('Invalid time prediction');
    }
    
    if (Math.abs(predictions.magnitude.expectedChange) > 100) {
      errors.push('Unrealistic magnitude prediction');
    }
    
    if (predictions.modelConfidence < 20) {
      errors.push('Model confidence too low');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      confidence: predictions.modelConfidence
    };
  }

  setUpdateInterval(intervalMs) {
    this.updateInterval = Math.max(60000, intervalMs);
  }

  pauseAutoUpdate() {
    this.autoUpdateEnabled = false;
    this.notifyListeners('auto_update_paused', {});
  }

  resumeAutoUpdate() {
    this.autoUpdateEnabled = true;
    this.notifyListeners('auto_update_resumed', {});
  }

  async forceUpdate(model) {
    try {
      this.notifyListeners('force_update_started', {});
      
      const response = await fetch('/api/history?limit=500');
      if (!response.ok) throw new Error('Failed to fetch historical data');
      
      const allData = await response.json();
      const observations = processHistoricalData(allData);
      
      const newModel = new BayesianCashbackModel();
      observations.forEach(obs => {
        newModel.updateWithObservation(obs);
      });
      
      localStorage.setItem('bayesian_model_forced', newModel.serializeModel());
      
      this.notifyListeners('force_update_completed', {
        observationCount: observations.length
      });
      
      return newModel;
    } catch (error) {
      console.error('Force update failed:', error);
      this.notifyListeners('force_update_failed', { error: error.message });
      throw error;
    }
  }
}

export const globalUpdateManager = new ModelUpdateManager();

export function useModelUpdater(model) {
  const [updateStatus, setUpdateStatus] = useState({
    isUpdating: false,
    lastUpdate: null,
    updateCount: 0,
    errors: []
  });

  useEffect(() => {
    if (!model) return;

    const unsubscribe = globalUpdateManager.subscribe((event, data) => {
      switch (event) {
        case 'update_started':
          setUpdateStatus(prev => ({ ...prev, isUpdating: true }));
          break;
        case 'update_completed':
          setUpdateStatus(prev => ({
            ...prev,
            isUpdating: false,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));
          break;
        case 'error':
          setUpdateStatus(prev => ({
            ...prev,
            isUpdating: false,
            errors: [...prev.errors, data.message]
          }));
          break;
        default:
          break;
      }
    });

    const stopAutoUpdate = globalUpdateManager.startAutoUpdate(model);

    return () => {
      unsubscribe();
      stopAutoUpdate();
    };
  }, [model]);

  return updateStatus;
}