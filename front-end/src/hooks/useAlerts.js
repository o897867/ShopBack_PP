import { useState } from 'react';
import alertService from '../services/alertService.js';
import { useLanguage } from './useLanguage.jsx';
import { t } from '../translations/index';

export const useAlerts = () => {
  const { currentLanguage } = useLanguage();
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
      setAlertMessage({ type: 'error', text: t('alerts.fillAllFields', currentLanguage) });
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
      
      setAlertMessage({ type: 'success', text: t('alerts.createSuccess', currentLanguage) });
      
      // 清空表单
      setAlertUrl('');
      setAlertThresholdValue('');
      
      // 刷新用户提醒列表
      if (alertEmail) {
        const alerts = await alertService.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
      
    } catch (error) {
      setAlertMessage({ type: 'error', text: error.message || t('messages.operationFailed', currentLanguage) });
    } finally {
      setIsCreatingAlert(false);
    }
  };

  const handleLoadUserAlerts = async () => {
    if (!alertEmail.trim()) {
      setAlertMessage({ type: 'error', text: t('alerts.enterEmail', currentLanguage) });
      return;
    }
    
    try {
      const alerts = await alertService.getUserAlerts(alertEmail);
      setUserAlerts(alerts);
      setAlertMessage(null);
    } catch (error) {
      setAlertMessage({ type: 'error', text: t('alerts.loadError', currentLanguage) });
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlertMessage({ type: 'success', text: t('alerts.deleteSuccess', currentLanguage) });
      
      // 刷新列表
      if (alertEmail) {
        const alerts = await alertService.getUserAlerts(alertEmail);
        setUserAlerts(alerts);
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: t('alerts.deleteError', currentLanguage) });
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
      setAlertMessage({ type: 'error', text: t('alerts.testEmailError', currentLanguage) });
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
