// API configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  
  // For production with nginx reverse proxy
  // All API calls will be proxied through nginx to the backend
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;