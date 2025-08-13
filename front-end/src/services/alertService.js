import { API_BASE_URL } from '../config/api.js';

const alertService = {
  createAlert: async (alertData) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }
    return response.json();
  },
  
  getUserAlerts: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  deleteAlert: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  testEmail: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/test-email?email=${encodeURIComponent(email)}`);
    return response.json();
  }
};

export default alertService;