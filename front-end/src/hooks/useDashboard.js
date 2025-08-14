import { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';
import comparisonService from '../services/comparisonService.js';

export const useDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [upsizedStores, setUpsizedStores] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRescraping, setIsRescraping] = useState(false);
  const [stores, setStores] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboard, storesData, upsizedData, statisticsData, comparableData, performance] = await Promise.all([
        apiService.getDashboard(),
        apiService.getStores(),
        apiService.getUpsizedStores(),
        apiService.getStatistics(),
        comparisonService.getComparableStores(),
        apiService.getPerformanceMetrics()
      ]);
      
      setDashboardStats(dashboard);
      setStores(storesData);
      setUpsizedStores(upsizedData);
      setStatistics(statisticsData);
      setPerformanceData(performance);
      
      return { storesData, comparableData };
    } catch (error) {
      console.error('获取数据失败:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRescrape = async () => {
    try {
      setIsRescraping(true);
      await apiService.triggerRescrape();
      setTimeout(() => {
        fetchData();
        setIsRescraping(false);
      }, 5000);
    } catch (error) {
      console.error('重新抓取失败:', error);
      setIsRescraping(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    dashboardStats,
    upsizedStores,
    statistics,
    performanceData,
    loading,
    error,
    isRescraping,
    stores,
    setStores,
    fetchData,
    handleRescrape
  };
};