import { useState } from 'react';
import comparisonService from '../services/comparisonService.js';

export const useComparison = () => {
  const [comparableStores, setComparableStores] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleCompareStore = async (storeName) => {
    try {
      const comparison = await comparisonService.compareStore(storeName);
      setSelectedComparison(comparison);
      setShowComparison(true);
    } catch (error) {
      console.error('比较失败:', error);
    }
  };

  return {
    comparableStores,
    setComparableStores,
    selectedComparison,
    showComparison,
    setShowComparison,
    handleCompareStore
  };
};