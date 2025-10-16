import React, { useState, useMemo, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './RebateComparison.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const RebateComparison = ({ brokers = [] }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [tradeVolume, setTradeVolume] = useState(10); // in lots

  // Real rebate data for Gold (XAUUSD) - per lot
  const realRebateData = useMemo(() => ({
    'TMGM': {
      standard: { spread: 32, rebate: 20 },
      ecn: { spread: 9, rebate: 2 },
      vip: { spread: 9, rebate: 2 }
    },
    'IC Markets': {
      standard: { spread: 15, rebate: 4 },
      ecn: { spread: 5, rebate: 2 },
      vip: { spread: 5, rebate: 2 }
    },
    'Exness': {
      standard: { spread: 16, rebate: 6.4 },
      ecn: { spread: 3.7, rebate: 2 },
      vip: { spread: 3.7, rebate: 2 }
    }
    // Other brokers: use simulated data
  }), []);

  // Get highest rebate and lowest spread for broker
  const getBrokerMetrics = useCallback((broker) => {
    const brokerName = broker.name;
    let maxRebate = 0;
    let minSpread = Infinity;
    let hasRealData = false;

    // Check if we have real data for this broker
    if (realRebateData[brokerName]) {
      hasRealData = true;
      const accountTypes = ['standard', 'ecn', 'vip'];

      accountTypes.forEach(accType => {
        const data = realRebateData[brokerName][accType];
        if (data) {
          // Calculate rebate
          let rebate = 0;
          if (data.rebatePercent) {
            rebate = data.spread * (data.rebatePercent / 100);
          } else if (data.rebate !== undefined) {
            rebate = data.rebate;
          }
          maxRebate = Math.max(maxRebate, rebate);

          // Get minimum spread
          if (data.spread !== undefined) {
            minSpread = Math.min(minSpread, data.spread);
          }
        }
      });
    } else {
      // Fallback: simulate data for other brokers
      const baseScore = broker.ratingScore || broker.score || 75;
      const rebateScore = broker.breakdown?.find(item =>
        item.label?.toLowerCase().includes('rebate') ||
        item.label?.toLowerCase().includes('返佣') ||
        item.label?.toLowerCase().includes('commission')
      );

      let baseRebate = rebateScore ? rebateScore.score * 0.08 : baseScore * 0.06;
      maxRebate = Math.min(baseRebate * 1.6, 12); // Simulate VIP rate as highest
      minSpread = 3 + Math.random() * 12; // Simulate ECN spread as lowest
    }

    return {
      maxRebate: maxRebate || 0,
      minSpread: minSpread === Infinity ? null : minSpread,
      hasRealData
    };
  }, [realRebateData]);

  const chartData = useMemo(() => {
    return brokers
      .slice(0, 8)
      .map(broker => {
        const metrics = getBrokerMetrics(broker);
        const totalRebate = metrics.maxRebate * tradeVolume;

        return {
          name: broker.name,
          maxRebate: Number(metrics.maxRebate.toFixed(2)),
          totalRebate: Number(totalRebate.toFixed(2)),
          minSpread: metrics.minSpread ? Number(metrics.minSpread.toFixed(1)) : null,
          hasRealData: metrics.hasRealData,
          broker
        };
      })
      .sort((a, b) => b.totalRebate - a.totalRebate);
  }, [brokers, tradeVolume, getBrokerMetrics]);

  const bestRebate = chartData[0];
  const colorPalette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e'];

  const chartJsData = useMemo(() => {
    return {
      labels: chartData.map((item) => item.name),
      datasets: [
        {
          label: translate('rebateComparison.total'),
          data: chartData.map((item) => ({
            x: item.name,
            y: item.totalRebate,
            maxRebate: item.maxRebate,
            minSpread: item.minSpread,
            hasRealData: item.hasRealData
          })),
          backgroundColor: chartData.map((_, index) => colorPalette[index % colorPalette.length]),
          hoverBackgroundColor: chartData.map((_, index) => colorPalette[index % colorPalette.length]),
          borderRadius: 8,
          barPercentage: 0.65,
          categoryPercentage: 0.7
        }
      ]
    };
  }, [chartData, translate]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: (context) => context[0]?.label ?? '',
          label: (context) => {
            const total = typeof context.raw === 'object' && context.raw !== null
              ? context.raw.y
              : context.parsed.y;
            return `${translate('rebateComparison.total')}: $${Number(total ?? 0).toFixed(2)}`;
          },
          afterLabel: (context) => {
            const raw = typeof context.raw === 'object' && context.raw !== null ? context.raw : {};
            const lines = [];

            if (raw.maxRebate !== undefined) {
              lines.push(`${translate('rebateComparison.maxRebate')}: $${Number(raw.maxRebate).toFixed(2)}/lot`);
            }

            if (raw.minSpread !== null && raw.minSpread !== undefined) {
              lines.push(`${translate('rebateComparison.minSpread')}: ${raw.minSpread} pips`);
            }

            if (raw.hasRealData) {
              lines.push(`✓ ${translate('rebateComparison.realData')}`);
            }

            return lines.join('\n');
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'var(--text)',
          font: { size: 12 },
          maxRotation: 45,
          minRotation: 45
        },
        grid: { display: false },
        border: { color: 'var(--border)' }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'var(--text)',
          font: { size: 12 }
        },
        grid: {
          color: 'var(--border)',
          borderDash: [4, 4]
        },
        title: {
          display: true,
          text: translate('rebateComparison.yAxisLabel'),
          color: 'var(--text-muted)',
          font: { size: 12 }
        },
        border: { color: 'var(--border)' }
      }
    }
  }), [translate]);

  return (
    <div className="rebate-comparison">
      <div className="rebate-comparison-header">
        <div>
          <h2 className="rebate-comparison-title">
            <span className="rebate-icon">💰</span>
            {translate('rebateComparison.title')}
          </h2>
          <p className="rebate-comparison-subtitle">{translate('rebateComparison.subtitle')}</p>
        </div>
      </div>

      <div className="rebate-controls">
        <div className="rebate-control-group">
          <label className="rebate-control-label">
            {translate('rebateComparison.tradeVolume', { volume: tradeVolume })}
          </label>
          <div className="volume-slider-container">
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={tradeVolume}
              onChange={(e) => setTradeVolume(Number(e.target.value))}
              className="volume-slider"
            />
            <div className="volume-markers">
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {bestRebate && (
        <div className="best-rebate-card">
          <div className="best-rebate-badge">
            {translate('rebateComparison.bestOffer')}
          </div>
          <h3 className="best-rebate-broker">{bestRebate.name}</h3>
          <div className="best-rebate-values">
            <div className="best-rebate-value-item">
              <span className="best-rebate-label">{translate('rebateComparison.estimatedRebate')}</span>
              <span className="best-rebate-amount">${bestRebate.totalRebate.toFixed(2)}</span>
            </div>
            <div className="best-rebate-value-item">
              <span className="best-rebate-label">{translate('rebateComparison.maxRebate')}</span>
              <span className="best-rebate-per-lot">${bestRebate.maxRebate.toFixed(2)}/lot</span>
            </div>
            {bestRebate.minSpread !== null && (
              <div className="best-rebate-value-item">
                <span className="best-rebate-label">{translate('rebateComparison.minSpread')}</span>
                <span className="best-rebate-spread">{bestRebate.minSpread} pips</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rebate-chart-container">
        <div style={{ width: '100%', height: 400 }}>
          <Bar data={chartJsData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default RebateComparison;
