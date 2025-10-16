import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

const formatPrice = (value) => `$${Number(value ?? 0).toFixed(2)}`;

const EthPredictionFan = ({ currentPrice, predictions }) => {
  const fanData = useMemo(() => {
    if (!currentPrice || !predictions?.horizons) return [];

    const base = [{
      minutes: 0,
      price: currentPrice,
      pi68_lower: currentPrice,
      pi68_upper: currentPrice,
      pi95_lower: currentPrice,
      pi95_upper: currentPrice
    }];

    const horizons = [3, 6, 9, 15, 30, 60];
    horizons.forEach((horizon) => {
      const key = `${horizon}m`;
      const prediction = predictions.horizons[key];
      if (prediction) {
        base.push({
          minutes: horizon,
          price: prediction.y_hat,
          pi68_lower: prediction.pi68?.[0],
          pi68_upper: prediction.pi68?.[1],
          pi95_lower: prediction.pi95?.[0],
          pi95_upper: prediction.pi95?.[1]
        });
      }
    });

    return base;
  }, [currentPrice, predictions]);

  if (!currentPrice || !predictions?.horizons || fanData.length <= 1) {
    return (
      <div
        style={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}
      >
        No prediction data available
      </div>
    );
  }

  const labels = fanData.map((point) => point.minutes);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: '95% Upper',
        data: fanData.map((point) => point.pi95_upper ?? null),
        borderColor: 'rgba(33, 150, 243, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        skipLegend: true,
        tension: 0.25,
        tooltip: { enabled: false }
      },
      {
        label: '95% Lower',
        data: fanData.map((point) => point.pi95_lower ?? null),
        borderColor: 'rgba(33, 150, 243, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(227, 242, 253, 0.5)',
        skipLegend: true,
        tension: 0.25,
        tooltip: { enabled: false }
      },
      {
        label: '68% Upper',
        data: fanData.map((point) => point.pi68_upper ?? null),
        borderColor: 'rgba(59, 130, 246, 0.4)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        skipLegend: true,
        tension: 0.25,
        tooltip: { enabled: false }
      },
      {
        label: '68% Lower',
        data: fanData.map((point) => point.pi68_lower ?? null),
        borderColor: 'rgba(59, 130, 246, 0.4)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(187, 222, 251, 0.55)',
        skipLegend: true,
        tension: 0.25,
        tooltip: { enabled: false }
      },
      {
        label: 'Kalman Prediction',
        data: fanData.map((point) => point.price ?? null),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.12)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#2196f3',
        pointHoverRadius: 5,
        fill: false,
        tension: 0.3
      },
      {
        label: 'Current Price',
        data: fanData.map(() => currentPrice),
        borderColor: '#6b7280',
        borderDash: [10, 6],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
        skipLegend: true,
        tooltip: { enabled: false }
      }
    ]
  }), [fanData, currentPrice, labels]);

  const yNumeric = fanData
    .flatMap((point) => [point.pi95_lower, point.pi95_upper, point.price])
    .filter((value) => Number.isFinite(value));

  let yMin = currentPrice * 0.9;
  let yMax = currentPrice * 1.1;

  if (yNumeric.length) {
    const min = Math.min(...yNumeric);
    const max = Math.max(...yNumeric);
    if (min === max) {
      const spread = Math.abs(min) * 0.05 || 5;
      yMin = min - spread;
      yMax = max + spread;
    } else {
      const padding = (max - min) * 0.08;
      yMin = min - padding;
      yMax = max + padding;
    }
  }

  const tooltipCallbacks = useMemo(() => ({
    title: (contexts) => {
      const label = contexts[0]?.label;
      if (label === 0) return 'Now';
      return `+${label} minutes`;
    },
    label: (context) => {
      const entry = fanData[context.dataIndex];
      if (!entry) return '';
      const priceLine = `Price: ${formatPrice(entry.price)}`;
      const change = ((entry.price - currentPrice) / currentPrice) * 100;
      const changeLine = context.label === 0
        ? null
        : `Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      const lines = [priceLine];
      if (changeLine) lines.push(changeLine);
      lines.push(`68% CI: ${formatPrice(entry.pi68_lower)} - ${formatPrice(entry.pi68_upper)}`);
      lines.push(`95% CI: ${formatPrice(entry.pi95_lower)} - ${formatPrice(entry.pi95_upper)}`);
      return lines;
    }
  }), [fanData, currentPrice]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          filter: (item, chart) => {
            const dataset = chart.data.datasets[item.datasetIndex];
            return !dataset?.skipLegend;
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        displayColors: false,
        callbacks: tooltipCallbacks
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: {
          color: 'var(--text)',
          font: { size: 12 },
          callback: (_, index, ticks, axis) => {
            const value = labels[index];
            return value === 0 ? 'Now' : `+${value}m`;
          }
        },
        title: {
          display: true,
          text: 'Minutes Ahead',
          color: 'var(--text)',
          font: { size: 13, weight: 600 }
        },
        border: { color: 'var(--border)' }
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: {
          color: 'var(--text)',
          font: { size: 12 },
          callback: (value) => formatPrice(value)
        },
        title: {
          display: true,
          text: 'ETH Price (USD)',
          color: 'var(--text)',
          font: { size: 13, weight: 600 }
        },
        border: { color: 'var(--border)' }
      }
    }
  }), [labels, tooltipCallbacks, yMin, yMax]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default EthPredictionFan;
