import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import './IndicatorTesting.css';
import { chartZoomPlugin, resetZoom, panChart } from '../utils/chartZoomPlugin';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import IndicatorHeroCard from '../components/IndicatorHeroCard.jsx';
import IndicatorDetailPanel from '../components/IndicatorDetailPanel.jsx';

const candlestickRenderer = {
  id: 'candlestickRenderer',
  defaults: {
    bodyWidth: 8,
    maxBodyWidth: 18,
    bullishColor: 'rgba(0, 180, 90, 1)',
    bullishFill: 'rgba(0, 180, 90, 0.35)',
    bearishColor: 'rgba(220, 60, 60, 1)',
    bearishFill: 'rgba(220, 60, 60, 0.35)'
  },
  afterDatasetsDraw(chart, args, pluginOptions) {
    const opts = { ...this.defaults, ...pluginOptions };
    const candles = opts.candles || [];
    if (!candles.length) return;

    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;

    if (!xScale || !yScale || !chartArea) return;

    const labels = chart.data.labels || [];

    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.clip();

    candles.forEach((candle, index) => {
      const timeLabel = labels[index];
      if (!timeLabel) return;

      const x = xScale.getPixelForValue(timeLabel);
      const prevLabel = labels[index - 1] ?? null;
      const nextLabel = labels[index + 1] ?? null;

      const prevX = prevLabel ? xScale.getPixelForValue(prevLabel) : null;
      const nextX = nextLabel ? xScale.getPixelForValue(nextLabel) : null;

      let width = opts.bodyWidth;
      if (prevX !== null && nextX !== null) {
        width = Math.min(
          opts.maxBodyWidth,
          Math.max(2, (nextX - prevX) * 0.5)
        );
      } else if (prevX !== null) {
        width = Math.min(opts.maxBodyWidth, Math.max(2, (x - prevX) * 0.8));
      } else if (nextX !== null) {
        width = Math.min(opts.maxBodyWidth, Math.max(2, (nextX - x) * 0.8));
      }

      const high = yScale.getPixelForValue(candle.high);
      const low = yScale.getPixelForValue(candle.low);
      const open = yScale.getPixelForValue(candle.open);
      const close = yScale.getPixelForValue(candle.close);

      const bullish = candle.close >= candle.open;
      const stroke = bullish ? opts.bullishColor : opts.bearishColor;
      const fill = bullish ? opts.bullishFill : opts.bearishFill;

      const bodyTop = Math.min(open, close);
      const bodyBottom = Math.max(open, close);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, high);
      ctx.lineTo(x, low);
      ctx.stroke();

      // Body
      ctx.fillStyle = fill;
      ctx.fillRect(x - width / 2, bodyTop, width, bodyHeight);
      ctx.strokeRect(x - width / 2, bodyTop, width, bodyHeight);
      ctx.restore();
    });

    ctx.restore();
  }
};

// Register Chart.js components and custom zoom plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  chartZoomPlugin,
  candlestickRenderer
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const IndicatorTesting = () => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [candles, setCandles] = useState([]);
  const [indicators, setIndicators] = useState({});
  const [validity, setValidity] = useState(null);
  const [selectedIndicators, setSelectedIndicators] = useState(['SMA14', 'EMA20', 'VWAP']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // days
  const [chartSettings, setChartSettings] = useState({
    showVolume: true,
    showGrid: true,
    candleCount: 500
  });
  const [validityParams, setValidityParams] = useState({
    ma_tol: 0.0015,
    ma_win: 8,
    ma_thr: 0.004,
    vwap_k: 2.0,
    vwap_win: 50,
    vwap_revert: 0.002,
    macd_win: 8,
    macd_thr: 0.005,
    macd_hist: 2
  });
  const chartRef = useRef(null);
  const [_, forceTick] = useState(0); // re-render trigger for theme changes
  const [selectedHeroId, setSelectedHeroId] = useState('VWAP'); // Default selected indicator
  const chartSectionRef = useRef(null);

  const indicatorOptions = useMemo(() => ([
    { value: 'MACD', label: 'MACD', color: '#C8102E', role: translate('indicators.roles.momentum') },
    { value: 'VWAP', label: 'VWAP', color: '#138B7B', role: translate('indicators.roles.volumePrice') },
    { value: 'SMA14', label: 'SMA14', color: '#D4A574', role: translate('indicators.roles.trend') },
    { value: 'EMA20', label: 'EMA20', color: '#8B4513', role: translate('indicators.roles.trend') },
    { value: 'RSI', label: 'RSI', color: '#2C5F2D', role: translate('indicators.roles.momentum') }
  ]), [translate]);

  const indicatorOptionMap = useMemo(() => {
    return indicatorOptions.reduce((acc, option) => {
      acc[option.value] = option;
      return acc;
    }, {});
  }, [indicatorOptions]);

  const coreIndicators = useMemo(() => ['SMA14', 'EMA20', 'VWAP'], []);

  // Re-render when theme attribute changes to refresh chart colors
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          forceTick(v => v + 1);
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const integerFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const decimalFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    []
  );

  const formatInteger = (value) => integerFormatter.format(Math.max(0, Math.round(value ?? 0)));
  const formatDecimal = (value) => decimalFormatter.format(value ?? 0);

  const indicatorMetrics = useMemo(() => {
    if (!validity?.indicators) {
      return {
        totalValid: 0,
        avgPerDay: 0,
        topIndicator: null,
        items: []
      };
    }

    const items = selectedIndicators.map((indicator) => {
      const option = indicatorOptionMap[indicator];
      const data = validity.indicators[indicator];
      if (!option || !data) return null;

      const events = Array.isArray(data.events) ? data.events : [];
      const eventCount = events.length;
      const validCount = Number(data.valid_count);
      const totalSignals = Number(data.total_signals);
      const count = Number.isFinite(validCount)
        ? validCount
        : (Number.isFinite(totalSignals) ? totalSignals : eventCount);

      const avgConfirmCandles = eventCount
        ? events.reduce((sum, event) => {
            const confirm =
              event?.bounce_candles ??
              event?.revert_candles ??
              event?.movement_candles ??
              event?.confirmation_candles ??
              0;
            return sum + (Number(confirm) || 0);
          }, 0) / eventCount
        : null;

      return {
        id: indicator,
        label: option.label,
        color: option.color,
        count,
        avgConfirmCandles,
        eventsCount: eventCount
      };
    }).filter(Boolean).sort((a, b) => b.count - a.count);

    const totalValid = items.reduce((sum, item) => sum + item.count, 0);
    const avgPerDay = timeRange > 0 ? totalValid / timeRange : 0;
    const topIndicator = items.reduce((best, item) => {
      if (!best || item.count > best.count) {
        return item;
      }
      return best;
    }, null);

    return {
      totalValid,
      avgPerDay,
      topIndicator,
      items
    };
  }, [validity, selectedIndicators, indicatorOptionMap, timeRange]);

  const heroCards = useMemo(() => {
    if (!validity?.indicators) {
      return coreIndicators.map(id => {
        const option = indicatorOptionMap[id];
        return {
          id,
          label: option?.label || id,
          color: option?.color || '#94a3b8',
          count: 0,
          avgConfirmCandles: null
        };
      });
    }

    return coreIndicators.map((indicator) => {
      const option = indicatorOptionMap[indicator];
      const data = validity.indicators[indicator];
      if (!option || !data) {
        return {
          id: indicator,
          label: option?.label || indicator,
          color: option?.color || '#94a3b8',
          count: 0,
          avgConfirmCandles: null
        };
      }

      const events = Array.isArray(data.events) ? data.events : [];
      const validCount = Number(data.valid_count);
      const totalSignals = Number(data.total_signals);
      const count = Number.isFinite(validCount)
        ? validCount
        : (Number.isFinite(totalSignals) ? totalSignals : events.length);

      const avgConfirmCandles = events.length
        ? events.reduce((sum, event) => {
            const confirm =
              event?.bounce_candles ??
              event?.revert_candles ??
              event?.movement_candles ??
              event?.confirmation_candles ??
              0;
            return sum + (Number(confirm) || 0);
          }, 0) / events.length
        : null;

      return {
        id: indicator,
        label: option.label,
        color: option.color,
        count,
        avgConfirmCandles
      };
    });
  }, [validity, coreIndicators, indicatorOptionMap]);

  const heroCardDescriptions = useMemo(() => ({
    SMA14: translate('indicators.cards.sma14Description'),
    EMA20: translate('indicators.cards.ema20Description'),
    VWAP: translate('indicators.cards.vwapDescription')
  }), [translate]);

  // Fetch indicators and validity
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch indicators
      const indicatorResponse = await fetch(
        `${API_BASE}/api/indicators/calculate?symbol=ETHUSDT&interval=3m&limit=${chartSettings.candleCount}`
      );

      if (!indicatorResponse.ok) {
        throw new Error(`HTTP error! status: ${indicatorResponse.status}`);
      }

      const indicatorData = await indicatorResponse.json();
      setCandles(indicatorData.candles || []);
      setIndicators(indicatorData.indicators || {});

      // Fetch validity signals
      const params = new URLSearchParams({
        symbol: 'ETHUSDT',
        interval: '3m',
        days: timeRange,
        limit: chartSettings.candleCount,
        ...validityParams
      });

      const validityResponse = await fetch(
        `${API_BASE}/api/indicators/validity?${params}`
      );

      if (!validityResponse.ok) {
        throw new Error(`HTTP error! status: ${validityResponse.status}`);
      }

      const validityData = await validityResponse.json();
      setValidity(validityData.validity_summary);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch when settings change
  useEffect(() => {
    fetchData();
  }, [chartSettings.candleCount, timeRange, validityParams]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!candles || candles.length === 0) return null;

    const labels = candles.map((c) => {
      const raw = c.open_time ?? c.timestamp ?? c.time;
      if (!raw && raw !== 0) return new Date();
      const numeric = Number(raw);
      if (!Number.isNaN(numeric)) {
        const msValue = numeric > 1e12 ? numeric : numeric * 1000;
        return new Date(msValue);
      }
      const parsed = Date.parse(raw);
      return Number.isNaN(parsed) ? new Date(raw) : new Date(parsed);
    });
    const prices = candles.map(c => c.close);

    const datasets = [];

    const closePoints = prices.map((price, idx) => ({
      x: labels[idx],
      y: price
    }));
    const formatSeries = (series) => series
      .map((value, idx) => (value == null ? null : {
        x: labels[idx],
        y: value
      }))
      .filter(Boolean);

    // Baseline close dataset (hidden) to anchor scales
    datasets.push({
      label: 'Candles',
      type: 'line',
      data: closePoints,
      borderColor: 'rgba(0,0,0,0)',
      backgroundColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      borderWidth: 0,
      tension: 0,
      parsing: false
    });

    // High/Low guard datasets for y-bound calculations (hidden)
    datasets.push({
      label: 'High',
      type: 'line',
      data: formatSeries(candles.map(c => c.high)),
      borderColor: 'rgba(0,0,0,0)',
      backgroundColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      borderWidth: 0,
      tension: 0,
      parsing: false,
      hidden: true
    });

    datasets.push({
      label: 'Low',
      type: 'line',
      data: formatSeries(candles.map(c => c.low)),
      borderColor: 'rgba(0,0,0,0)',
      backgroundColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      borderWidth: 0,
      tension: 0,
      parsing: false,
      hidden: true
    });

    // Add indicator lines
    selectedIndicators.forEach(ind => {
      const option = indicatorOptions.find(o => o.value === ind);
      if (!option) return;

      if (ind === 'SMA14' && indicators.sma14) {
        datasets.push({
          label: 'SMA14',
          type: 'line',
          data: formatSeries(indicators.sma14),
          borderColor: option.color,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          borderDash: [5, 5],
          parsing: false,
          spanGaps: true
        });
      } else if (ind === 'EMA20' && indicators.ema20) {
        datasets.push({
          label: 'EMA20',
          type: 'line',
          data: formatSeries(indicators.ema20),
          borderColor: option.color,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          parsing: false,
          spanGaps: true
        });
      } else if (ind === 'VWAP' && indicators.vwap) {
        // VWAP line
        datasets.push({
          label: 'VWAP',
          type: 'line',
          data: formatSeries(indicators.vwap),
          borderColor: option.color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          parsing: false,
          spanGaps: true
        });

        // VWAP Bands (1std and 2std)
        if (indicators.vwap_bands) {
          const vwapBands = indicators.vwap_bands;

          // 1std bands (darker, more prominent)
          if (vwapBands.upper_1std) {
            datasets.push({
              label: 'VWAP +1σ',
              type: 'line',
              data: formatSeries(vwapBands.upper_1std),
              borderColor: 'rgba(19, 139, 123, 0.6)',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [3, 3],
              pointRadius: 0,
              parsing: false,
              spanGaps: true
            });
          }

          if (vwapBands.lower_1std) {
            datasets.push({
              label: 'VWAP -1σ',
              type: 'line',
              data: formatSeries(vwapBands.lower_1std),
              borderColor: 'rgba(19, 139, 123, 0.6)',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [3, 3],
              pointRadius: 0,
              parsing: false,
              spanGaps: true
            });
          }

          // 2std bands (lighter, less prominent)
          if (vwapBands.upper_2std) {
            datasets.push({
              label: 'VWAP +2σ',
              type: 'line',
              data: formatSeries(vwapBands.upper_2std),
              borderColor: 'rgba(19, 139, 123, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderDash: [5, 5],
              pointRadius: 0,
              parsing: false,
              spanGaps: true
            });
          }

          if (vwapBands.lower_2std) {
            datasets.push({
              label: 'VWAP -2σ',
              type: 'line',
              data: formatSeries(vwapBands.lower_2std),
              borderColor: 'rgba(19, 139, 123, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderDash: [5, 5],
              pointRadius: 0,
              parsing: false,
              spanGaps: true
            });
          }
        }
      }
    });

    // Add validity markers
    if (validity && validity.indicators) {
      selectedIndicators.forEach(ind => {
        const validData = validity.indicators[ind];
        if (!validData || !validData.valid_indices) return;

        const option = indicatorOptions.find(o => o.value === ind);

        // Valid signal points
        const validPoints = validData.valid_indices
          .filter(idx => idx < candles.length)
          .map(idx => ({
            x: labels[idx],
            y: candles[idx].close
          }));

        if (validPoints.length > 0) {
          datasets.push({
            label: `${ind} Valid Signals`,
            data: validPoints,
            type: 'scatter',
            backgroundColor: option.color,
            borderColor: option.color,
            pointStyle: 'rectRot', // Diamond shape for valid signals
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            parsing: false
          });
        }
      });
    }

    if (chartSettings.showVolume) {
      datasets.push({
        label: 'Volume',
        type: 'bar',
        data: candles.map((c, idx) => ({
          x: labels[idx],
          y: c.volume
        })),
        backgroundColor: 'rgba(100, 149, 237, 0.25)',
        borderColor: 'rgba(100, 149, 237, 0.6)',
        borderWidth: 1,
        yAxisID: 'volume',
        parsing: false,
        order: 5
      });
    }

    return {
      labels,
      datasets
    };
  };

  const chartData = prepareChartData();

  const maxVolume = candles.reduce((max, c) => {
    const volume = Number(c.volume) || 0;
    return volume > max ? volume : max;
  }, 0);

  // Theme-aware chart palette for better contrast
  const theme = typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') || 'light')
    : 'light';
  const isDark = theme === 'dark';
  const palette = {
    text: isDark ? '#e5e7eb' : '#111827',
    muted: isDark ? '#cbd5e1' : '#334155',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.06)'
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: palette.text,
          usePointStyle: true,
          padding: 20,
          font: { weight: '600', size: 12 }
        }
      },
      title: {
        display: true,
        text: `ETH/USDT - 3 Minute Candles`,
        color: palette.text,
        font: { weight: '700', size: 14 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === 'High' || context.dataset.label === 'Low') {
              return null;
            }
            if (context.dataset.type === 'scatter') {
              return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
            }
            if (context.dataset.label === 'Volume') {
              return `Volume: ${(context.parsed.y / 1000).toFixed(2)}K`;
            }
            if (context.dataset.label === 'Candles') {
              const candle = candles[context.dataIndex];
              if (!candle) return '';
              return [
                `Open: $${candle.open?.toFixed(2)}`,
                `High: $${candle.high?.toFixed(2)}`,
                `Low: $${candle.low?.toFixed(2)}`,
                `Close: $${candle.close?.toFixed(2)}`,
                `Volume: ${(candle.volume / 1000).toFixed(2)}K`
              ];
            }
            const label = context.dataset.label || '';
            return `${label}: $${context.parsed.y?.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        grid: {
          display: chartSettings.showGrid,
          color: palette.grid
        },
        ticks: {
          color: palette.muted,
          font: { weight: '600' }
        }
      },
      y: {
        position: 'right',
        grid: {
          display: chartSettings.showGrid,
          color: palette.grid
        },
        ticks: {
          color: palette.text,
          font: { weight: '600' },
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      },
      volume: {
        type: 'linear',
        display: chartSettings.showVolume,
        position: 'left',
        grid: {
          display: false
        },
        ticks: {
          color: palette.muted,
          font: { weight: '600' },
          callback: function(value) {
            return (value / 1000).toFixed(1) + 'K';
          }
        },
        suggestedMax: maxVolume ? maxVolume * 2 : undefined
      }
    }
  };

  const handleIndicatorToggle = (indicator) => {
    if (selectedIndicators.includes(indicator)) {
      setSelectedIndicators(selectedIndicators.filter(i => i !== indicator));
    } else {
      setSelectedIndicators([...selectedIndicators, indicator]);
    }
  };

  const handlePan = (direction) => {
    if (chartRef.current) {
      panChart(chartRef.current, direction);
    }
  };

  const topIndicatorLabel = indicatorMetrics.topIndicator?.label ?? '—';
  const topIndicatorCount = indicatorMetrics.topIndicator?.count ?? 0;

  // Handler for viewing full chart analysis
  const handleViewChart = useCallback(() => {
    if (chartSectionRef.current) {
      chartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Get selected hero data
  const selectedHero = useMemo(() => {
    return heroCards.find(card => card.id === selectedHeroId) || heroCards[0];
  }, [selectedHeroId, heroCards]);

  if (loading && candles.length === 0) {
    return (
      <div className="indicators-loading">
        <div className="indicators-loading__spinner"></div>
        <p>{translate('indicators.loading')}</p>
      </div>
    );
  }

  return (
    <div className="indicators-page indicators-page--overwatch">
      <section className="indicators-hero indicators-hero--overwatch">
        <div className="indicators-hero__inner">
          <div className="indicators-top-controls">
            <ThemeToggle />
            <LanguageSelector />
          </div>

          {/* Overwatch-style hero selection layout */}
          <div className="overwatch-hero-section">
            {/* Header section */}
            <div className="overwatch-hero-header">
              <h1 className="overwatch-hero-title">
                {translate('indicators.hero.badge')}
              </h1>
              <p className="overwatch-hero-subtitle">
                {translate('indicators.hero.subtitle')}
              </p>
            </div>

            <div className="overwatch-hero-grid-new">
              {/* Left blank space (15%) */}
              <div className="hero-blank-left"></div>

              {/* Hero image section (30%) */}
              <div className="overwatch-hero-image-section">
                <div className="hero-image-container">
                  <img
                    src={`/images/indicators/${selectedHero.id === 'SMA14' ? 'sma' : selectedHero.id === 'EMA20' ? 'ema' : 'vwap'}.png`}
                    alt={`${selectedHero.label} indicator`}
                    className="hero-large-image"
                  />
                </div>
              </div>

              {/* Details panel (30%) */}
              <div className="overwatch-hero-detail-new">
                {/* Indicator name */}
                <h1 className="indicator-name-large" style={{ color: selectedHero.color }}>
                  {selectedHero.label}
                </h1>

                {/* Thumbnail selector */}
                <div className="thumbnail-selector">
                  {heroCards.map(card => (
                    <button
                      key={card.id}
                      className={`thumbnail-btn ${selectedHeroId === card.id ? 'active' : ''}`}
                      onClick={() => setSelectedHeroId(card.id)}
                      style={{ '--btn-accent': card.color }}
                    >
                      <img
                        src={`/images/indicators/${card.id === 'SMA14' ? 'sma' : card.id === 'EMA20' ? 'ema' : 'vwap'}.svg`}
                        alt={card.label}
                      />
                    </button>
                  ))}
                </div>

                {/* Type section */}
                <div className="type-section">
                  <div className="type-label">{translate('indicators.detail.typeLabel') || '指标类型 / INDICATOR TYPE'}</div>
                  <span className="type-value" style={{ borderColor: selectedHero.color, color: selectedHero.color }}>
                    {indicatorOptions.find(opt => opt.value === selectedHero.id)?.role || translate('indicators.roles.default')}
                  </span>
                </div>

                {/* Description section */}
                <div className="description-section">
                  <p className="indicator-description">
                    {selectedHero.id === 'SMA14' && (translate('indicators.cards.sma14Description') || '以过去14根K线为基础，构建最经典的指标')}
                    {selectedHero.id === 'EMA20' && (translate('indicators.cards.ema20Description') || '过滤不必要的噪音，传统指标的继任者')}
                    {selectedHero.id === 'VWAP' && (translate('indicators.cards.vwapDescription') || '结合量与价，新时代的挑战者')}
                  </p>
                </div>

                {/* Features section */}
                <div className="features-section">
                  <h3 className="features-title" style={{ color: selectedHero.color }}>
                    {translate('indicators.detail.keyFeatures') || '核心特性 / Key Features'}
                  </h3>
                  <div className="features-list">
                    {selectedHero.id === 'SMA14' && (
                      <>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.sma1') || 'Smooth trend identification'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.sma2') || 'Classic 14-period moving average'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.sma3') || 'Reliable support/resistance levels'}</span>
                        </div>
                      </>
                    )}
                    {selectedHero.id === 'EMA20' && (
                      <>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.ema1') || 'Faster response to price changes'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.ema2') || 'Reduces noise compared to SMA'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.ema3') || 'Ideal for short-term trend trading'}</span>
                        </div>
                      </>
                    )}
                    {selectedHero.id === 'VWAP' && (
                      <>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.vwap1') || 'Volume-weighted price analysis'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.vwap2') || 'Institutional trading reference'}</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-text">{translate('indicators.detail.vwap3') || 'Mean reversion opportunities'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  className="action-button-new"
                  onClick={handleViewChart}
                  style={{ '--button-bg': selectedHero.color }}
                >
                  {translate('indicators.detail.viewFullAnalysis') || 'View Full K-Line Analysis'} →
                </button>
              </div>

              {/* Right blank space (15%) */}
              <div className="hero-blank-right"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="indicators-content" ref={chartSectionRef}>
        {error && (
          <div className="indicators-alert" role="alert">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)}>{translate('indicators.alert.close')}</button>
          </div>
        )}

        <div className="indicators-card indicators-panel">
          <div className="indicators-panel__row">
            <div className="indicator-toggles">
              <span className="indicator-toggles__label">{translate('indicators.panel.selectIndicators')}</span>
              {indicatorOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`indicator-toggle ${selectedIndicators.includes(opt.value) ? 'active' : ''}`}
                  onClick={() => handleIndicatorToggle(opt.value)}
                  style={{
                    borderColor: opt.color,
                    backgroundColor: selectedIndicators.includes(opt.value) ? opt.color + '33' : 'transparent'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="indicators-panel__controls">
              <label className="time-controls__label" htmlFor="time-range">{translate('indicators.panel.timeRange')}</label>
              <select
                id="time-range"
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
              >
                <option value="1">{translate('indicators.panel.timeRangeDays', { count: 1 })}</option>
                <option value="3">{translate('indicators.panel.timeRangeDays', { count: 3 })}</option>
                <option value="7">{translate('indicators.panel.timeRangeDays', { count: 7 })}</option>
                <option value="14">{translate('indicators.panel.timeRangeDays', { count: 14 })}</option>
              </select>
              <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                {loading ? translate('indicators.panel.refreshLoading') : `🔄 ${translate('indicators.panel.refresh')}`}
              </button>
            </div>
          </div>
        </div>

        <div className="indicators-card indicators-chart-card">
          <div className="indicators-card__header">
            <div>
              <h3>{translate('indicators.chart.title')}</h3>
              <p>{translate('indicators.chart.subtitle')}</p>
            </div>
          </div>
          <div className="chart-wrapper">
            {chartData ? (
              <>
                <Chart
                  ref={chartRef}
                  type="line"
                  data={chartData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      candlestickRenderer: {
                        candles
                      }
                    }
                  }}
                />
              </>
            ) : (
              <div className="chart-placeholder">{translate('indicators.chart.noData')}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IndicatorTesting;
