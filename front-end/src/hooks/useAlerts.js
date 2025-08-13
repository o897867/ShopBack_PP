import { useState } from 'react';
import alertService from '../services/alertService.js';

export const useAlerts = () => {
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertUrl, setAlertUrl] = useState('');
  const [alertThresholdType, setAlertThresholdType] = useState('above_current');
  const [alertThresholdValue, setAlertThresholdValue] = useState('');
  const [userAlerts, setUserAlerts] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  const handleCreateAlert = async () => {
    if (!alertEmail.trim() || !alertUrl.trim() || !alertThresholdValue.trim()) {
      setAlertMessage({ type: 'error', text: '请填写所有必需字段' });
      return;
    }
  
    try {
      setIsCreatingAlert(true);
      setAlertMessage(null);
      
      await alertService.createAlert({
        user_email: alertEmail,
        store_url: alertUrl,
        threshold_type: alertThresholdType,
        threshold_value: parseFloat(alertThresholdValue)
      });
      
      setAlertMessage({ type: 'success', text: '价格提醒创建成功！' });
      
      // 清空表单
      setAlertUrl('');
      setAlertThresholdValue('');
      
      // 刷新用户提醒列表
      if (alertEmail) {
        const alerts = await alertService.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
      
    } catch (error) {
      setAlertMessage({ type: 'error', text: error.message });
    } finally {
      setIsCreatingAlert(false);
    }
  };

  const handleLoadUserAlerts = async () => {
    if (!alertEmail.trim()) {
      setAlertMessage({ type: 'error', text: '请输入邮箱地址' });
      return;
    }
    
    try {
      const alerts = await alertService.getUserAlerts(alertEmail);
      setUserAlerts(alerts);
      setAlertMessage(null);
    } catch (error) {
      setAlertMessage({ type: 'error', text: '加载提醒失败' });
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlertMessage({ type: 'success', text: '提醒已删除' });
      
      // 刷新列表
      if (alertEmail) {
        const alerts = await alertService.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: '删除失败' });
    }
  };

  const handleTestEmail = async () => {
    try {
      const result = await alertService.testEmail(alertEmail);
      setAlertMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      });
    } catch (error) {
      setAlertMessage({ type: 'error', text: '测试失败' });
    }
  };

  return {
    showAlerts,
    setShowAlerts,
    alertEmail,
    setAlertEmail,
    alertUrl,
    setAlertUrl,
    alertThresholdType,
    setAlertThresholdType,
    alertThresholdValue,
    setAlertThresholdValue,
    userAlerts,
    alertMessage,
    isCreatingAlert,
    handleCreateAlert,
    handleLoadUserAlerts,
    handleDeleteAlert,
    handleTestEmail
  };
};