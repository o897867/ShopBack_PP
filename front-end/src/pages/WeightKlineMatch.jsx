import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations/index';
import Chart from 'chart.js/auto';
import './WeightKlineMatch.css';
import api from '../services/api';

const WeightKlineMatch = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedSymbol, setSelectedSymbol] = useState('AUTO');

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Mock user email
  const userEmail = 'user@example.com';

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/health/match-kline?user_email=${userEmail}`, {
        days: selectedDays,
        symbol: selectedSymbol,
        timeframe: '1h'
      });

      if (response.data.success && response.data.match) {
        setMatchResult(response.data.match);
        renderChart(response.data.match);
      }
    } catch (error) {
      console.error('Error matching K-line:', error);
      // Use mock data for demo
      const mockMatch = {
        symbol: 'BTC',
        matched_pattern: '2021 Bull Run',
        similarity_score: 87.5,
        market_performance: 156.7,
        weight_performance: -4.2,
        match_period_start: '2021-01-15',
        match_period_end: '2021-02-15',
        window_data: {
          weight: Array(30).fill(0).map(() => Math.random() * 4 - 2),
          market: Array(30).fill(0).map(() => Math.random() * 6 - 3)
        }
      };
      setMatchResult(mockMatch);
      renderChart(mockMatch);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (match) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const labels = Array(match.window_data.weight.length).fill(0).map((_, i) => `Day ${i + 1}`);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: translate('health.yourWeight'),
            data: match.window_data.weight,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: `${match.symbol} ${translate('health.market')}`,
            data: match.window_data.market,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: `${translate('health.matchTitle')}: ${match.similarity_score}% ${translate('health.similarity')}`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y.toFixed(2) + '%';
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: translate('health.weightChange')
            },
            grid: {
              drawOnChartArea: false
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: translate('health.marketChange')
            }
          }
        }
      }
    });
  };

  const handleShare = () => {
    setShareMode(true);
    // In production, would generate image and share link
    setTimeout(() => {
      alert(translate('health.shareCopied'));
      setShareMode(false);
    }, 1000);
  };

  const getMatchEmoji = (score) => {
    if (score >= 90) return '🔥';
    if (score >= 75) return '💎';
    if (score >= 60) return '⭐';
    return '📊';
  };

  const getPatternBadge = (pattern) => {
    const badges = {
      'Bull Run': { color: '#10b981', icon: '📈' },
      'Bear Market': { color: '#ef4444', icon: '📉' },
      'Consolidation': { color: '#f59e0b', icon: '➡️' },
      'Recovery': { color: '#667eea', icon: '🔄' }
    };

    const badge = Object.entries(badges).find(([key]) =>
      pattern?.toLowerCase().includes(key.toLowerCase())
    )?.[1] || { color: '#6b7280', icon: '📊' };

    return badge;
  };

  return (
    <div className="kline-match-container">
      {/* Header */}
      <div className="match-header">
        <button className="back-btn" onClick={() => onNavigate('health')}>
          ← {translate('common.back')}
        </button>
        <h1>{translate('health.klineMatch.title')}</h1>
        <p className="subtitle">{translate('health.klineMatch.subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="match-controls">
        <div className="control-group">
          <label>{translate('health.timeframe')}</label>
          <select value={selectedDays} onChange={(e) => setSelectedDays(Number(e.target.value))}>
            <option value={7}>7 {translate('health.days')}</option>
            <option value={14}>14 {translate('health.days')}</option>
            <option value={30}>30 {translate('health.days')}</option>
            <option value={60}>60 {translate('health.days')}</option>
            <option value={90}>90 {translate('health.days')}</option>
          </select>
        </div>

        <div className="control-group">
          <label>{translate('health.symbol')}</label>
          <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
            <option value="AUTO">{translate('health.autoBest')}</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="GOLD">Gold (GOLD)</option>
            <option value="SPY">S&P 500 (SPY)</option>
          </select>
        </div>

        <button
          className="match-btn"
          onClick={handleMatch}
          disabled={loading}
        >
          {loading ? translate('health.matching') : translate('health.findMatch')}
        </button>
      </div>

      {/* Chart Area */}
      {matchResult && (
        <div className="chart-container">
          <canvas ref={chartRef}></canvas>
        </div>
      )}

      {/* Result Card */}
      {matchResult && (
        <div className="match-result-card">
          <div className="result-header">
            <span className="match-emoji">{getMatchEmoji(matchResult.similarity_score)}</span>
            <h2>{translate('health.matchFound')}</h2>
          </div>

          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">{translate('health.matchedWith')}</span>
              <span className="stat-value">
                {matchResult.symbol}
                <span
                  className="pattern-badge"
                  style={{
                    background: getPatternBadge(matchResult.matched_pattern).color + '20',
                    color: getPatternBadge(matchResult.matched_pattern).color
                  }}
                >
                  {getPatternBadge(matchResult.matched_pattern).icon} {matchResult.matched_pattern}
                </span>
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">{translate('health.similarityScore')}</span>
              <span className="stat-value score">
                {matchResult.similarity_score}%
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">{translate('health.period')}</span>
              <span className="stat-value">
                {matchResult.match_period_start} → {matchResult.match_period_end}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">{matchResult.symbol} {translate('health.performance')}</span>
              <span className={`stat-value ${matchResult.market_performance > 0 ? 'positive' : 'negative'}`}>
                {matchResult.market_performance > 0 ? '+' : ''}{matchResult.market_performance}%
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">{translate('health.yourPerformance')}</span>
              <span className={`stat-value ${matchResult.weight_performance < 0 ? 'positive' : 'negative'}`}>
                {matchResult.weight_performance}% {translate('health.weightLoss')}
              </span>
            </div>
          </div>

          {/* Fun Message */}
          <div className="match-message">
            <p className="message-text">
              {matchResult.similarity_score >= 90 &&
                translate('health.messages.perfect').replace('{{symbol}}', matchResult.symbol)
              }
              {matchResult.similarity_score >= 75 && matchResult.similarity_score < 90 &&
                translate('health.messages.excellent').replace('{{symbol}}', matchResult.symbol)
              }
              {matchResult.similarity_score >= 60 && matchResult.similarity_score < 75 &&
                translate('health.messages.good').replace('{{symbol}}', matchResult.symbol)
              }
              {matchResult.similarity_score < 60 &&
                translate('health.messages.interesting').replace('{{symbol}}', matchResult.symbol)
              }
            </p>
          </div>

          {/* Share Button */}
          <div className="action-buttons">
            <button className="share-btn" onClick={handleShare}>
              {shareMode ? translate('health.generating') : translate('health.shareResult')}
            </button>
            <button className="try-again-btn" onClick={handleMatch}>
              {translate('health.tryAgain')}
            </button>
          </div>
        </div>
      )}

      {/* Match Tips */}
      {!matchResult && !loading && (
        <div className="match-tips">
          <h3>{translate('health.tips.title')}</h3>
          <ul>
            <li>{translate('health.tips.tip1')}</li>
            <li>{translate('health.tips.tip2')}</li>
            <li>{translate('health.tips.tip3')}</li>
            <li>{translate('health.tips.tip4')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WeightKlineMatch;