import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement
);

const CandlestickChart = ({ candles, settings = {} }) => {
  const chartRef = useRef(null);

  const formatCandles = () => {
    if (!candles || candles.length === 0) return { datasets: [] };

    // Format candlestick data for Chart.js
    const candleData = candles.map((candle, index) => ({
      x: index,
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
      v: candle.volume,
      timestamp: new Date(candle.open_time || candle.timestamp * 1000)
    }));

    // Create candlestick rectangles
    const candlestickData = {
      labels: candleData.map(d => d.timestamp),
      datasets: [
        {
          label: 'ETH/USDT',
          type: 'bar',
          data: candleData.map(d => ({
            x: d.timestamp,
            y: [d.l, d.h], // Low to High for the wick
          })),
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          borderColor: 'rgba(128, 128, 128, 0.8)',
          borderWidth: 1,
          barThickness: 1,
          categoryPercentage: 1.0,
          barPercentage: 1.0,
        },
        {
          label: 'Candle Body',
          type: 'bar',
          data: candleData.map(d => ({
            x: d.timestamp,
            y: [Math.min(d.o, d.c), Math.max(d.o, d.c)],
          })),
          backgroundColor: candleData.map(d =>
            d.c >= d.o ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)'
          ),
          borderColor: candleData.map(d =>
            d.c >= d.o ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'
          ),
          borderWidth: 1,
          barThickness: 6,
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        }
      ]
    };

    // Add volume bars if enabled
    if (settings.showVolume) {
      candlestickData.datasets.push({
        label: 'Volume',
        type: 'bar',
        data: candleData.map(d => d.v),
        backgroundColor: 'rgba(100, 149, 237, 0.3)',
        borderColor: 'rgba(100, 149, 237, 0.8)',
        yAxisID: 'volume',
        borderWidth: 1
      });
    }

    return candlestickData;
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
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        grid: {
          display: settings.showGrid,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#999',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          display: settings.showGrid,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#999',
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      },
      volume: {
        type: 'linear',
        display: settings.showVolume,
        position: 'left',
        grid: {
          display: false
        },
        ticks: {
          color: '#999',
          callback: function(value) {
            return (value / 1000).toFixed(1) + 'K';
          }
        },
        max: Math.max(...(candles?.map(c => c.volume) || [1])) * 5
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            if (context[0]?.raw?.timestamp) {
              return new Date(context[0].raw.timestamp).toLocaleString();
            }
            return '';
          },
          label: function(context) {
            const candle = candles[context.dataIndex];
            if (!candle) return '';

            const labels = [
              `Open: $${candle.open?.toFixed(2)}`,
              `High: $${candle.high?.toFixed(2)}`,
              `Low: $${candle.low?.toFixed(2)}`,
              `Close: $${candle.close?.toFixed(2)}`,
              `Volume: ${(candle.volume / 1000).toFixed(2)}K`
            ];

            return labels;
          }
        }
      }
    }
  };

  // Custom plugin to draw candlesticks
  const candlestickPlugin = {
    id: 'candlestickPlugin',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);

      if (!candles || candles.length === 0) return;

      candles.forEach((candle, index) => {
        if (meta.data[index]) {
          const x = meta.data[index].x;
          const yScale = chart.scales.y;

          const high = yScale.getPixelForValue(candle.high);
          const low = yScale.getPixelForValue(candle.low);
          const open = yScale.getPixelForValue(candle.open);
          const close = yScale.getPixelForValue(candle.close);

          // Determine color
          const bullish = candle.close >= candle.open;
          const color = bullish ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
          const fillColor = bullish ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';

          ctx.save();

          // Draw the high-low line (wick)
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, high);
          ctx.lineTo(x, low);
          ctx.stroke();

          // Draw the open-close rectangle (body)
          const width = 6;
          const bodyTop = Math.min(open, close);
          const bodyBottom = Math.max(open, close);
          const bodyHeight = bodyBottom - bodyTop;

          ctx.fillStyle = fillColor;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.fillRect(x - width / 2, bodyTop, width, bodyHeight || 1);
          ctx.strokeRect(x - width / 2, bodyTop, width, bodyHeight || 1);

          ctx.restore();
        }
      });
    }
  };

  // Use regular bar chart as fallback with custom rendering
  const chartData = formatCandles();

  return (
    <div className="candlestick-chart" style={{ height: '400px', width: '100%' }}>
      {candles && candles.length > 0 ? (
        <Chart
          ref={chartRef}
          type='bar'
          data={chartData}
          options={options}
          plugins={[candlestickPlugin]}
        />
      ) : (
        <div className="no-data">No candle data available</div>
      )}
    </div>
  );
};

export default CandlestickChart;