import React from 'react';
import './PredictionCard.css';

const PredictionCard = ({ 
  title, 
  prediction, 
  confidence, 
  icon, 
  color = 'blue',
  details = null 
}) => {
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return '#10b981';
    if (conf >= 60) return '#f59e0b';
    if (conf >= 40) return '#ef4444';
    return '#6b7280';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`prediction-card ${color}`}>
      <div className="card-header">
        {icon && <span className="card-icon">{icon}</span>}
        <h3 className="card-title">{title}</h3>
      </div>
      
      <div className="card-body">
        <div className="prediction-value">
          {prediction}
        </div>
        
        {confidence !== undefined && (
          <div className="confidence-indicator">
            <span className="confidence-label">Confidence:</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${confidence}%`,
                  backgroundColor: getConfidenceColor(confidence)
                }}
              />
            </div>
            <span className="confidence-value">{confidence}%</span>
          </div>
        )}
        
        {details && (
          <div className="card-details">
            {details.map((detail, index) => (
              <div key={index} className="detail-item">
                <span className="detail-label">{detail.label}:</span>
                <span className="detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;