// API configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  
  // For production deployment - choose the option that matches your setup:
  
  // Option 1: Backend on same server, different port (most common)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8001`;
  
  // Option 2: Backend on different server/domain - uncomment and modify:
  // return 'https://your-backend-domain.com:8001';
  
  // Option 3: Backend behind reverse proxy on same server/port - uncomment:
  // return window.location.origin;
  
  // Option 4: Backend on specific subdomain - uncomment and modify:
  // return `${window.location.protocol}//api.${window.location.hostname}`;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;