import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const EffectivenessPanel = ({ indicator, effectiveness }) => {
  if (!effectiveness) {
    return <div className="effectiveness-panel">No effectiveness data available</div>;
  }

  const { metrics, effectiveness_score, recommendation } = effectiveness;

  // Score gauge chart data
  const scoreData = {
    labels: ['Score', 'Remaining'],
    datasets: [{
      data: [effectiveness_score || 0, 100 - (effectiveness_score || 0)],
      backgroundColor: [
        effectiveness_score >= 80 ? 'rgba(0, 255, 0, 0.8)' :
        effectiveness_score >= 60 ? 'rgba(255, 206, 86, 0.8)' :
        effectiveness_score >= 40 ? 'rgba(255, 159, 64, 0.8)' :
        'rgba(255, 99, 132, 0.8)',
        'rgba(200, 200, 200, 0.2)'
      ],
      borderWidth: 0
    }]
  };

  const scoreOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  // Win/Loss chart data
  const winLossData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [{
      data: [metrics?.winning_trades || 0, metrics?.losing_trades || 0],
      backgroundColor: [
        'rgba(0, 255, 0, 0.6)',
        'rgba(255, 0, 0, 0.6)'
      ],
      borderWidth: 1,
      borderColor: [
        'rgba(0, 255, 0, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    }]
  };

  // Performance metrics bar chart
  const performanceData = {
    labels: ['Return %', 'Sharpe', 'Win Rate %'],
    datasets: [{
      label: 'Performance',
      data: [
        metrics?.total_return || 0,
        (metrics?.sharpe_ratio || 0) * 10, // Scale for visibility
        metrics?.win_rate || 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#999'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#999'
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label;
            const value = context.parsed.y;
            if (label === 'Sharpe') {
              return `Sharpe Ratio: ${(value / 10).toFixed(2)}`;
            }
            return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff00';
    if (score >= 60) return '#ffce38';
    if (score >= 40) return '#ff9f40';
    return '#ff6384';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="effectiveness-panel">
      <h3>{indicator} Effectiveness Analysis</h3>

      <div className="score-section">
        <div className="score-gauge">
          <div style={{ position: 'relative', height: '200px' }}>
            <Doughnut data={scoreData} options={scoreOptions} />
            <div className="score-center" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(effectiveness_score) }}>
                {effectiveness_score?.toFixed(1) || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                {getScoreLabel(effectiveness_score)}
              </div>
            </div>
          </div>
        </div>

        <div className="recommendation-box" style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          marginTop: '1rem'
        }}>
          <strong>Recommendation:</strong>
          <p>{recommendation}</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>📊 Total Return</h4>
          <div className="metric-value" style={{ color: metrics?.total_return > 0 ? '#00ff00' : '#ff6384' }}>
            {metrics?.total_return > 0 ? '+' : ''}{metrics?.total_return?.toFixed(2) || 0}%
          </div>
        </div>

        <div className="metric-card">
          <h4>📈 Sharpe Ratio</h4>
          <div className="metric-value">
            {metrics?.sharpe_ratio?.toFixed(2) || 0}
          </div>
          <small>{metrics?.sharpe_ratio > 1 ? 'Good' : 'Needs improvement'}</small>
        </div>

        <div className="metric-card">
          <h4>📉 Max Drawdown</h4>
          <div className="metric-value" style={{ color: '#ff6384' }}>
            {metrics?.max_drawdown?.toFixed(2) || 0}%
          </div>
        </div>

        <div className="metric-card">
          <h4>🎯 Win Rate</h4>
          <div className="metric-value" style={{ color: metrics?.win_rate > 50 ? '#00ff00' : '#ff6384' }}>
            {metrics?.win_rate?.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      <div className="charts-section" style={{ marginTop: '2rem' }}>
        <div className="chart-row" style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h4>Trade Outcomes</h4>
            <div style={{ height: '200px' }}>
              <Doughnut data={winLossData} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <small>Total Trades: {metrics?.total_trades || 0}</small>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h4>Performance Metrics</h4>
            <div style={{ height: '200px' }}>
              <Bar data={performanceData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="additional-info" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
        <h4>Strategy Details</h4>
        <ul style={{ margin: '0.5rem 0' }}>
          <li>Final Equity: ${metrics?.final_equity?.toFixed(2) || 'N/A'}</li>
          <li>Trades Executed: {metrics?.total_trades || 0}</li>
          <li>Average Trade: {metrics?.total_trades > 0 ?
            ((metrics?.total_return / metrics?.total_trades) || 0).toFixed(2) + '%' : 'N/A'}</li>
        </ul>
      </div>
    </div>
  );
};

export default EffectivenessPanel;