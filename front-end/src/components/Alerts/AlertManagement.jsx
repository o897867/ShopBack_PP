import React from 'react';
import { getThresholdTypeText } from '../../utils/thresholdTypes.js';

const AlertManagement = ({ alertHook, translate }) => {
  const {
    showAlerts,
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
  } = alertHook;

  if (!showAlerts) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginTop: '30px'
    }}>
      <h2 style={{margin: '0 0 25px 0', color: '#333'}}>{translate('alerts.title')}</h2>
      
      {/* Test Email Button */}
      <button
        onClick={handleTestEmail}
        style={{
          background: '#ffc107',
          color: 'black',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        {translate('alerts.testEmail')}
      </button>

      {/* Email Input */}
      <div style={{marginBottom: '25px'}}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
          {translate('alerts.email')}：
        </label>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <input
            type="email"
            placeholder=" "
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleLoadUserAlerts}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {translate('alerts.loadAlerts')}
          </button>
        </div>
      </div>

      {/* Create New Alert */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '6px',
        marginBottom: '25px'
      }}>
        <h4 style={{margin: '0 0 15px 0', color: '#333'}}>{translate('alerts.createNew')}</h4>
        
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            URL：
          </label>
          <input
            type="text"
            placeholder="URL..."
            value={alertUrl}
            onChange={(e) => setAlertUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              {translate('alerts.thresholdType')}：
            </label>
            <select
              value={alertThresholdType}
              onChange={(e) => setAlertThresholdType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="above_current">＞</option>
              <option value="fixed_value">=</option>
              <option value="percentage_increase">Δ%</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              {translate('alerts.threshold')}：
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="enter"
              value={alertThresholdValue}
              onChange={(e) => setAlertThresholdValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreateAlert}
          disabled={isCreatingAlert || !alertEmail.trim()}
          style={{
            background: isCreatingAlert ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: isCreatingAlert ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isCreatingAlert ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Message Display */}
      {alertMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '4px',
          background: alertMessage.type === 'success' ? '#d4edda' : '#f8d7da',
          color: alertMessage.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${alertMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {alertMessage.text}
        </div>
      )}

      {/* User Alerts List */}
      {userAlerts.length > 0 && (
        <div>
          <h4 style={{margin: '0 0 15px 0', color: '#333'}}>我的提醒列表</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '15px'
          }}>
            {userAlerts.map((alert) => (
              <div key={alert.id} style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <h5 style={{margin: '0 0 10px 0', color: '#333'}}>
                  {alert.store_name || '商家'}
                </h5>
                <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                  <strong>网址:</strong> {alert.store_url}
                </p>
                <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                  <strong>提醒条件:</strong> {getThresholdTypeText(alert.threshold_type)} {alert.threshold_value}%
                </p>
                <p style={{margin: '5px 0', fontSize: '12px', color: '#999'}}>
                  创建时间: {new Date(alert.created_at).toLocaleString()}
                </p>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '10px'
                  }}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {userAlerts.length === 0 && alertEmail && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{fontSize: '3em', marginBottom: '15px'}}></div>
          <p>暂无价格提醒</p>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;
