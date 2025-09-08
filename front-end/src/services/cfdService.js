import { API_BASE_URL } from '../config/api.js';

const cfdService = {
  getBrokers: async () => {
    const res = await fetch(`${API_BASE_URL}/api/cfd/brokers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  getBroker: async (brokerId) => {
    const res = await fetch(`${API_BASE_URL}/api/cfd/brokers/${brokerId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  getBrokerNews: async (brokerId) => {
    const res = await fetch(`${API_BASE_URL}/api/cfd/brokers/${brokerId}/news`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

export default cfdService;
