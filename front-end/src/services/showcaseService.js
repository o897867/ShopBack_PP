import { API_BASE_URL } from '../config/api.js';

const showcaseService = {
  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/api/showcase/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  getEventsByCategory: async (categoryId) => {
    const res = await fetch(`${API_BASE_URL}/api/showcase/categories/${categoryId}/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  getEventDetail: async (eventId) => {
    const res = await fetch(`${API_BASE_URL}/api/showcase/events/${eventId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

export default showcaseService;

