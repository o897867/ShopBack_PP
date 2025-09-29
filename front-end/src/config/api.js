// API configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode (Vite dev server on port 5173)
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    // Return current origin so Vite proxy can handle the requests
    // This way ${API_BASE_URL}/api/... becomes http://localhost:5173/api/...
    return window.location.origin;
  }

  // Check if we're in development (localhost) but not Vite dev server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }

  // For production with nginx reverse proxy
  // All API calls will be proxied through nginx to the backend
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;