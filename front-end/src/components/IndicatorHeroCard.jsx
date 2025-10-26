import React from 'react';
import './IndicatorHeroCard.css';

const IndicatorHeroCard = ({
  indicator,
  isSelected,
  onClick,
  imagePath
}) => {
  const { id, label, color, role } = indicator;

  return (
    <div
      className={`indicator-hero-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--card-accent': color }}
    >
      <div className="hero-card-inner">
        <div className="hero-card-image">
          <img
            src={imagePath}
            alt={`${label} indicator`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="hero-card-fallback" style={{ display: 'none' }}>
            {id === 'SMA14' ? '📊' : id === 'EMA20' ? '📈' : '⚖️'}
          </div>
        </div>

        <div className="hero-card-info">
          <div className="hero-card-name">{label}</div>
          <div className="hero-card-role">{role}</div>
        </div>

        {isSelected && (
          <div className="hero-card-selected-indicator">
            <span className="selected-checkmark">✓</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorHeroCard;
