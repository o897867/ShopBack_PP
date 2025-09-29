import { useState, useCallback, useContext, createContext } from 'react';
import { API_BASE_URL } from '../config/api.js';

// 创建对比上下文
const BrokerComparisonContext = createContext();

// 对比状态管理Hook
export const useBrokerComparison = () => {
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // 添加broker到对比列表
  const addBroker = useCallback((broker) => {
    setSelectedBrokers(prev => {
      // 防止重复添加
      if (prev.find(b => b.id === broker.id)) {
        return prev;
      }
      // 限制最多5个
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, broker];
    });
  }, []);

  // 从对比列表移除broker
  const removeBroker = useCallback((brokerId) => {
    setSelectedBrokers(prev => prev.filter(b => b.id !== brokerId));

    // 如果移除后只剩一个或没有，清除对比数据
    if (selectedBrokers.length <= 2) {
      setComparisonData(null);
      setShowComparison(false);
    }
  }, [selectedBrokers.length]);

  // 清空所有选择
  const clearSelection = useCallback(() => {
    setSelectedBrokers([]);
    setComparisonData(null);
    setShowComparison(false);
    setError(null);
  }, []);

  // 切换broker选择状态
  const toggleBroker = useCallback((broker) => {
    const isSelected = selectedBrokers.find(b => b.id === broker.id);
    if (isSelected) {
      removeBroker(broker.id);
    } else {
      addBroker(broker);
    }
  }, [selectedBrokers, addBroker, removeBroker]);

  // 检查broker是否已选择
  const isBrokerSelected = useCallback((brokerId) => {
    return selectedBrokers.some(b => b.id === brokerId);
  }, [selectedBrokers]);

  // 获取对比数据
  const fetchComparisonData = useCallback(async () => {
    if (selectedBrokers.length < 2) {
      setError('至少需要选择2个经纪商进行对比');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const brokerIds = selectedBrokers.map(b => b.id);
      const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brokerIds),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setComparisonData(data);
      setShowComparison(true);
    } catch (err) {
      setError(err.message || '获取对比数据失败');
      console.error('Comparison fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrokers]);

  // 启动对比（获取数据并显示）
  const startComparison = useCallback(async () => {
    await fetchComparisonData();
  }, [fetchComparisonData]);

  // 关闭对比弹窗
  const closeComparison = useCallback(() => {
    setShowComparison(false);
  }, []);

  // 计算选择统计
  const selectionStats = {
    count: selectedBrokers.length,
    maxReached: selectedBrokers.length >= 5,
    canCompare: selectedBrokers.length >= 2,
  };

  return {
    // 状态
    selectedBrokers,
    comparisonData,
    isLoading,
    error,
    showComparison,
    selectionStats,

    // 操作方法
    addBroker,
    removeBroker,
    toggleBroker,
    clearSelection,
    isBrokerSelected,
    startComparison,
    closeComparison,
    fetchComparisonData,

    // 便捷属性
    hasSelection: selectedBrokers.length > 0,
    canStartComparison: selectedBrokers.length >= 2,
    isMaxSelection: selectedBrokers.length >= 5,
  };
};

// Context Provider组件
export const BrokerComparisonProvider = ({ children }) => {
  const comparisonState = useBrokerComparison();

  return (
    <BrokerComparisonContext.Provider value={comparisonState}>
      {children}
    </BrokerComparisonContext.Provider>
  );
};

// 使用Context的Hook
export const useBrokerComparisonContext = () => {
  const context = useContext(BrokerComparisonContext);
  if (!context) {
    throw new Error('useBrokerComparisonContext must be used within BrokerComparisonProvider');
  }
  return context;
};

// 默认导出主Hook
export default useBrokerComparison;