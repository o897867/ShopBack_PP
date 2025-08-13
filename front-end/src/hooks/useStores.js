import { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';

export const useStores = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeHistory, setStoreHistory] = useState([]);
  const [storeStatistics, setStoreStatistics] = useState([]);
  const [addStoreUrl, setAddStoreUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);

  const handleStoreClick = async (store) => {
    try {
      setSelectedStore(store);
      const [history, stats] = await Promise.all([
        apiService.getStoreHistory(store.id),
        apiService.getStoreStatistics(store.name)
      ]);
      setStoreHistory(history);
      setStoreStatistics(stats);
    } catch (error) {
      console.error('获取商家历史失败:', error);
    }
  };

  const handleAddStore = async (onDataRefresh) => {
    if (!addStoreUrl.trim()) return;
    
    try {
      setIsAdding(true);
      setAddMessage(null);
      await apiService.addStore(addStoreUrl);
      setAddMessage({ type: 'success', text: '商家添加成功！' });
      setAddStoreUrl('');
      // 刷新商家列表
      setTimeout(() => onDataRefresh(), 2000);
    } catch (error) {
      setAddMessage({ type: 'error', text: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryStats = (category) => {
    return storeStatistics.find(stat => stat.category === category);
  };

  return {
    stores,
    setStores,
    selectedStore,
    setSelectedStore,
    storeHistory,
    storeStatistics,
    addStoreUrl,
    setAddStoreUrl,
    isAdding,
    addMessage,
    handleStoreClick,
    handleAddStore,
    getCategoryStats
  };
};