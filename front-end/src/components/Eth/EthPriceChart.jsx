import React, { useMemo, useCallback } from 'react';
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

const EthPriceChart = ({ candles, predictions, showConfidenceBands }) => {
  const formatPrice = useCallback((value) => `$${Number(value ?? 0).toFixed(2)}`, []);

  const formatVolume = useCallback((value) => {
    const numeric = Number(value ?? 0);
    if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(2)}M`;
    if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(2)}K`;
    return numeric.toFixed(2);
  }, []);

  const points = useMemo(() => {
    if (!Array.isArray(candles)) return [];

    const base = candles.map((candle) => {
      const date = new Date(candle.timestamp * 1000);
      return {
        label: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timestamp: candle.timestamp,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
        predicted: null,
        pi68_lower: null,
        pi68_upper: null
      };
    });

    if (predictions && base.length) {
      const lastIndex = base.length - 1;
      const lastPoint = base[lastIndex];
      if (predictions.next_candle) {
        lastPoint.predicted = predictions.next_candle.y_hat;
        lastPoint.pi68_lower = predictions.next_candle.pi68?.[0] ?? null;
        lastPoint.pi68_upper = predictions.next_candle.pi68?.[1] ?? null;
      }
    }

    return base;
  }, [candles, predictions]);

  const labels = useMemo(() => points.map((point) => point.label), [points]);

  const yValues = points
    .flatMap((point) => [point.low, point.high, point.close, point.predicted, point.pi68_lower, point.pi68_upper])
    .filter((value) => Number.isFinite(value));

  let yMin = 0;
  let yMax = 1;
  if (yValues.length) {
    const min = Math.min(...yValues);
    const max = Math.max(...yValues);
    if (min === max) {
      const buffer = Math.abs(min) * 0.05 || 5;
      yMin = min - buffer;
      yMax = max + buffer;
    } else {
      const padding = (max - min) * 0.08;
      yMin = min - padding;
      yMax = max + padding;
    }
  }

  const datasets = useMemo(() => {
    const series = [];

    series.push({
      id: 'high-range',
      label: 'Session High',
      data: points.map((point) => point.high ?? null),
      borderColor: 'rgba(76, 175, 80, 0.35)',
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      tension: 0.25,
      skipLegend: true,
      tooltip: { enabled: false },
      spanGaps: true
    });

    series.push({
      id: 'low-range',
      label: 'Session Low',
      data: points.map((point) => point.low ?? null),
      borderColor: 'rgba(244, 67, 54, 0.35)',
      borderWidth: 1,
      pointRadius: 0,
      fill: '-1',
      backgroundColor: 'rgba(129, 199, 132, 0.12)',
      tension: 0.25,
      skipLegend: true,
      tooltip: { enabled: false },
      spanGaps: true
    });

    if (showConfidenceBands) {
      series.push({
        id: 'ci68-upper',
        label: '68% Upper',
        data: points.map((point) => point.pi68_upper ?? null),
        borderColor: 'rgba(255, 152, 0, 0.35)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.25,
        skipLegend: true,
        tooltip: { enabled: false },
        spanGaps: true
      });

      series.push({
        id: 'ci68-lower',
        label: '68% Lower',
        data: points.map((point) => point.pi68_lower ?? null),
        borderColor: 'rgba(255, 152, 0, 0.35)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(255, 193, 7, 0.18)',
        tension: 0.25,
        skipLegend: true,
        tooltip: { enabled: false },
        spanGaps: true
      });
    }

    series.push({
      id: 'close-price',
      label: 'Close Price',
      data: points.map((point) => point.close ?? null),
      borderColor: '#2196f3',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: false,
      tension: 0.3,
      spanGaps: true
    });

    series.push({
      id: 'kalman-prediction',
      label: 'Kalman Prediction',
      data: points.map((point) => point.predicted ?? null),
      borderColor: '#ff9800',
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.3,
      spanGaps: true
    });

    return series;
  }, [points, showConfidenceBands]);

  const tooltipCallbacks = useMemo(() => ({
    title: (contexts) => contexts[0]?.label ?? '',
    label: (context) => {
      const point = points[context.dataIndex];
      if (!point) return '';
      if (context.dataset.id === 'kalman-prediction') {
        return `Prediction: ${formatPrice(point.predicted)}`;
      }
      return `Close: ${formatPrice(point.close)}`;
    },
    afterLabel: (context) => {
      const point = points[context.dataIndex];
      if (!point || context.dataset.id !== 'close-price') return [];
      const lines = [];
      if (Number.isFinite(point.high)) lines.push(`High: ${formatPrice(point.high)}`);
      if (Number.isFinite(point.low)) lines.push(`Low: ${formatPrice(point.low)}`);
      if (Number.isFinite(point.volume)) lines.push(`Volume: ${formatVolume(point.volume)}`);
      if (Number.isFinite(point.predicted)) lines.push(`Prediction: ${formatPrice(point.predicted)}`);
      return lines;
    }
  }), [points, formatPrice, formatVolume]);

  const chartData = useMemo(() => ({
    labels,
    datasets
  }), [labels, datasets]);

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
          font: { size: 11 }
        },
        title: {
          display: false
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
  }), [formatPrice, tooltipCallbacks, yMin, yMax]);

  if (!points.length) {
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
        No price data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default EthPriceChart;

