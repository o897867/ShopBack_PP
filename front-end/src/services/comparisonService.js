import { API_BASE_URL } from '../config/api.js';

const comparisonService = {
  compareStore: async (storeName) => {
    const response = await fetch(`${API_BASE_URL}/api/compare/${encodeURIComponent(storeName)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  getComparableStores: async () => {
    const response = await fetch(`${API_BASE_URL}/api/compare-all`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
};

export default comparisonService;