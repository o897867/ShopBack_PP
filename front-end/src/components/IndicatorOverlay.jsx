import React from 'react';
import { Line } from 'react-chartjs-2';

const IndicatorOverlay = ({ candles, indicators, selectedIndicator }) => {
  if (!candles || candles.length === 0 || !indicators) {
    return null;
  }

  const getIndicatorData = () => {
    const labels = candles.map((c, i) => i);
    const prices = candles.map(c => c.close);

    const datasets = [
      {
        label: 'Price',
        data: prices,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1
      }
    ];

    // Add selected indicator overlay
    switch (selectedIndicator) {
      case 'SMA14':
        if (indicators.sma14) {
          datasets.push({
            label: 'SMA (14)',
            data: indicators.sma14,
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            borderDash: [5, 5]
          });
        }
        break;

      case 'EMA20':
        if (indicators.ema20) {
          datasets.push({
            label: 'EMA (20)',
            data: indicators.ema20,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
          });
        }
        break;

      case 'VWAP':
        if (indicators.vwap) {
          datasets.push({
            label: 'VWAP',
            data: indicators.vwap,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            borderDash: [10, 5]
          });
        }
        break;

      case 'MACD':
        // MACD requires a separate scale as it's not price-based
        // We'll show it in a separate mini-chart below
        break;
    }

    return { labels, datasets };
  };

  const getMACDData = () => {
    if (selectedIndicator !== 'MACD' || !indicators.macd) {
      return null;
    }

    const labels = candles.map((c, i) => i);

    return {
      labels,
      datasets: [
        {
          label: 'MACD Line',
          data: indicators.macd.macd,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'Signal Line',
          data: indicators.macd.signal,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'Histogram',
          type: 'bar',
          data: indicators.macd.histogram,
          backgroundColor: indicators.macd.histogram?.map(h =>
            h > 0 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'
          ),
          borderWidth: 0
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#999',
          callback: function(value) {
            return selectedIndicator === 'MACD' ? value.toFixed(4) : '$' + value.toFixed(2);
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#999',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (value === null || isNaN(value)) return '';

            if (context.dataset.label === 'Price' ||
                context.dataset.label === 'SMA (14)' ||
                context.dataset.label === 'EMA (20)' ||
                context.dataset.label === 'VWAP') {
              return `${context.dataset.label}: $${value.toFixed(2)}`;
            } else {
              return `${context.dataset.label}: ${value.toFixed(4)}`;
            }
          }
        }
      }
    }
  };

  const macdOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        ticks: {
          color: '#999',
          callback: function(value) {
            return value.toFixed(4);
          }
        }
      }
    }
  };

  const chartData = getIndicatorData();
  const macdData = getMACDData();

  return (
    <div className="indicator-overlay">
      {selectedIndicator !== 'MACD' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <Line data={chartData} options={options} />
        </div>
      )}

      {selectedIndicator === 'MACD' && macdData && (
        <div className="macd-chart" style={{ marginTop: '20px', height: '200px' }}>
          <h4>MACD Indicator</h4>
          <Line data={macdData} options={macdOptions} />
        </div>
      )}

      <div className="indicator-info">
        <div className="indicator-description">
          {selectedIndicator === 'MACD' && (
            <p><strong>MACD:</strong> Shows the relationship between two moving averages. Buy when MACD crosses above signal line, sell when it crosses below.</p>
          )}
          {selectedIndicator === 'VWAP' && (
            <p><strong>VWAP:</strong> Volume Weighted Average Price. Price above VWAP suggests bullish sentiment, below suggests bearish.</p>
          )}
          {selectedIndicator === 'SMA14' && (
            <p><strong>SMA (14):</strong> 14-period Simple Moving Average. Price crossing above suggests uptrend, crossing below suggests downtrend.</p>
          )}
          {selectedIndicator === 'EMA20' && (
            <p><strong>EMA (20):</strong> 20-period Exponential Moving Average. More responsive to recent prices than SMA.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndicatorOverlay;