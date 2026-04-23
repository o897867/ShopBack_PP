// API base URL - uses VITE_API_URL env var, falls back to current origin
export const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
export default API_BASE_URL;