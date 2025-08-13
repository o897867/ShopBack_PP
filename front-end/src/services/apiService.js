import { API_BASE_URL } from '../config/api.js';

const apiService = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/stores`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getUpsizedStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/upsized-stores`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStoreHistory: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/history`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getStoreStatistics: async (storeName) => {
    const response = await fetch(`${API_BASE_URL}/api/statistics?store_name=${encodeURIComponent(storeName)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  triggerRescrape: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rescrape-all`, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  addStore: async (url) => {
    const response = await fetch(`${API_BASE_URL}/api/add-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }
    return response.json();
  }
};

export default apiService;