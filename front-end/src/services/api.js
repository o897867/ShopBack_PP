// API Service for Health Module
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

class ApiService {
  async request(url, options = {}) {
    const fullUrl = `${API_BASE_URL}${url}`;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(fullUrl, defaultOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const urlWithParams = queryString ? `${url}?${queryString}` : url;
    return this.request(urlWithParams, { method: 'GET' });
  }

  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

const api = new ApiService();
export default api;