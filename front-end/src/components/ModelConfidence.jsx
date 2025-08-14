import React from 'react';
import './ModelConfidence.css';

const ModelConfidence = ({ 
  confidence, 
  observationCount, 
  lastUpdate,
  isUpdating = false 
}) => {
  const getConfidenceLevel = (conf) => {
    if (conf >= 80) return { level: 'Excellent', color: '#10b981' };
    if (conf >= 60) return { level: 'Good', color: '#3b82f6' };
    if (conf >= 40) return { level: 'Moderate', color: '#f59e0b' };
    if (conf >= 20) return { level: 'Limited', color: '#ef4444' };
    return { level: 'Insufficient', color: '#6b7280' };
  };

  const { level, color } = getConfidenceLevel(confidence);

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const updateDate = new Date(date);
    const diff = now - updateDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="model-confidence">
      <div className="confidence-header">
        <h3 className="confidence-title">Model Confidence</h3>
        {isUpdating && (
          <div className="updating-indicator">
            <span className="updating-dot"></span>
            <span className="updating-text">Updating...</span>
          </div>
        )}
      </div>
      
      <div className="confidence-content">
        <div className="confidence-meter">
          <div className="meter-background">
            <div 
              className="meter-fill"
              style={{ 
                width: `${confidence}%`,
                backgroundColor: color
              }}
            />
          </div>
          <div className="confidence-percentage" style={{ color }}>
            {confidence.toFixed(1)}%
          </div>
        </div>
        
        <div className="confidence-level" style={{ color }}>
          {level}
        </div>
        
        <div className="confidence-stats">
          <div className="stat-item">
            <span className="stat-label">Observations:</span>
            <span className="stat-value">{observationCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Update:</span>
            <span className="stat-value">{formatLastUpdate(lastUpdate)}</span>
          </div>
        </div>
        
        <div className="confidence-info">
          {confidence < 40 && (
            <p className="info-message warning">
              Low confidence due to limited data. Predictions will improve as more data is collected.
            </p>
          )}
          {confidence >= 40 && confidence < 60 && (
            <p className="info-message moderate">
              Moderate confidence. Model is learning patterns and accuracy is improving.
            </p>
          )}
          {confidence >= 60 && confidence < 80 && (
            <p className="info-message good">
              Good confidence level. Predictions are generally reliable.
            </p>
          )}
          {confidence >= 80 && (
            <p className="info-message excellent">
              Excellent confidence! Model has sufficient data for accurate predictions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelConfidence;