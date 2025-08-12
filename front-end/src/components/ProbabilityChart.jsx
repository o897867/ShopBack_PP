import React from 'react';
import './ProbabilityChart.css';

const ProbabilityChart = ({ probabilities, title = "Change Probability" }) => {
  const chartData = [
    { label: '7 Days', value: probabilities?.within7Days || 0 },
    { label: '14 Days', value: probabilities?.within14Days || 0 },
    { label: '30 Days', value: probabilities?.within30Days || 0 }
  ];

  const getBarColor = (value) => {
    if (value >= 0.8) return '#ef4444';
    if (value >= 0.6) return '#f59e0b';
    if (value >= 0.4) return '#eab308';
    if (value >= 0.2) return '#84cc16';
    return '#22c55e';
  };

  return (
    <div className="probability-chart">
      <h3 className="chart-title">{title}</h3>
      
      <div className="chart-container">
        {chartData.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="bar-wrapper">
              <div 
                className="bar"
                style={{ 
                  height: `${item.value * 100}%`,
                  backgroundColor: getBarColor(item.value)
                }}
              >
                <span className="bar-value">
                  {(item.value * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bar-label">{item.label}</div>
          </div>
        ))}
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Very Likely (80%+)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Likely (60-80%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#eab308' }}></span>
          <span>Moderate (40-60%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#84cc16' }}></span>
          <span>Unlikely (20-40%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#22c55e' }}></span>
          <span>Very Unlikely (&lt;20%)</span>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityChart;