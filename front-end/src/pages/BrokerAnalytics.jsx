import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { API_BASE_URL } from '../config/api.js';
import './BrokerAnalytics.css';

ChartJS.register(LinearScale, PointElement, Filler, ChartTooltip, Legend);

const expandRange = (values, paddingRatio = 0.08, fallback = [0, 100]) => {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (!numeric.length) return fallback;
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
  if (min === max) {
    const delta = Math.abs(min) * 0.1 || 5;
    return [min - delta, max + delta];
  }
  const padding = (max - min) * paddingRatio;
  return [min - padding, max + padding];
};

const computeDomainFromPoints = (points) => {
  if (!Array.isArray(points) || points.length === 0) {
    return { x: [0, 100], y: [0, 100] };
  }

  const xValues = points.map((point) => Number(point?.x_score ?? point?.x ?? 0));
  const yValues = points.map((point) => Number(point?.y_score ?? point?.y ?? 0));

  return {
    x: expandRange(xValues),
    y: expandRange(yValues)
  };
};

const domainsAreEqual = (a, b, epsilon = 0.0001) => {
  if (!a || !b) return false;
  return (
    Math.abs(a.x[0] - b.x[0]) < epsilon &&
    Math.abs(a.x[1] - b.x[1]) < epsilon &&
    Math.abs(a.y[0] - b.y[0]) < epsilon &&
    Math.abs(a.y[1] - b.y[1]) < epsilon
  );
};

const BrokerAnalytics = () => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSize, setChartSize] = useState('medium');
  const [zoomDomain, setZoomDomain] = useState({ x: [0, 100], y: [0, 100] });
  const [defaultDomain, setDefaultDomain] = useState({ x: [0, 100], y: [0, 100] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionPixels, setSelectionPixels] = useState(null);

  const [filters, setFilters] = useState({
    x_axis: 'Regulatory Strength',
    y_axis: 'Transparency & Compliance',
    bubble_metric: 'Composite Score',
    regulators: '',
    rating_min: '',
    rating_max: '',
    limit: 50
  });

  const [availableDimensions, setAvailableDimensions] = useState([]);

  const chartRef = useRef(null);
  const selectionStateRef = useRef(null);
  const defaultDomainRef = useRef(defaultDomain);

  useEffect(() => {
    defaultDomainRef.current = defaultDomain;
  }, [defaultDomain]);

  const translateDimension = useCallback((dimName) => {
    const key = `analytics.dimensionNames.${dimName}`;
    const translated = translate(key);
    return translated === key ? dimName : translated;
  }, [translate]);

  const getScatterColor = useCallback((rating) => {
    const colorMap = {
      'A++': '#00C851', 'A+': '#2E7D32', A: '#4CAF50', 'A-': '#66BB6A',
      'B+': '#FFB300', B: '#FF9800', 'B-': '#FF8A65',
      'C+': '#FF5722', C: '#F44336', 'C-': '#D32F2F',
      'D+': '#9E9E9E', D: '#757575', 'D-': '#424242'
    };
    return colorMap[rating] || '#9E9E9E';
  }, []);

  const computePointRadius = useMemo(() => {
    const values = (data?.data_points ?? [])
      .map((point) => Number(point?.bubble_size ?? point?.composite_score ?? point?.rating_score))
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return () => 10;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return () => 12;
    }

    return (raw) => {
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return 10;
      const ratio = (numeric - min) / (max - min);
      return 6 + ratio * 12;
    };
  }, [data]);

  const fetchQuadrantData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/quadrant-analysis?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      const newDomain = computeDomainFromPoints(result?.data_points ?? []);
      setDefaultDomain(newDomain);
      setZoomDomain(newDomain);
      defaultDomainRef.current = newDomain;
    } catch (err) {
      console.error('Failed to fetch quadrant data:', err);
      setError(err.message || translate('analytics.error'));
    } finally {
      setLoading(false);
    }
  }, [filters, translate]);

  const fetchAvailableDimensions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/available-dimensions`);
      if (response.ok) {
        const result = await response.json();
        setAvailableDimensions(result.dimensions || []);
      }
    } catch (err) {
      console.error('Failed to fetch available dimensions:', err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableDimensions();
    fetchQuadrantData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchQuadrantData();
    }, 500);

    return () => clearTimeout(debounce);
  }, [filters, fetchQuadrantData]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetZoom = useCallback(() => {
    const domain = defaultDomainRef.current;
    if (domain) {
      setZoomDomain(domain);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const getChartHeight = useCallback(() => {
    if (typeof window === 'undefined') {
      return 600;
    }

    if (isFullscreen) {
      const sizeMap = {
        small: window.innerHeight * 0.6,
        medium: window.innerHeight * 0.75,
        large: window.innerHeight * 0.9
      };
      return sizeMap[chartSize] || sizeMap.medium;
    }

    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) return 400;
    if (screenWidth <= 768) return 500;
    return 600;
  }, [isFullscreen, chartSize]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (isFullscreen) {
        setIsFullscreen(false);
      } else if (!domainsAreEqual(zoomDomain, defaultDomainRef.current)) {
        resetZoom();
      }
    };

    if (typeof document === 'undefined') return undefined;

    document.addEventListener('keydown', onKeyDown);
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isFullscreen, zoomDomain, resetZoom]);

  const scatterPoints = useMemo(() => (
    (data?.data_points ?? []).map((point) => ({
      ...point,
      x: Number(point?.x_score ?? 0),
      y: Number(point?.y_score ?? 0)
    }))
  ), [data]);

  const scatterData = useMemo(() => {
    const labelKey = translate('analytics.chart.datasetLabel');
    const datasetLabel = labelKey === 'analytics.chart.datasetLabel' ? 'Brokers' : labelKey;

    return {
      datasets: [
        {
          label: datasetLabel,
          data: scatterPoints,
          pointRadius: (ctx) => computePointRadius(ctx.raw?.bubble_size),
          pointHoverRadius: (ctx) => computePointRadius(ctx.raw?.bubble_size) + 3,
          pointBackgroundColor: (ctx) => getScatterColor(ctx.raw?.overall_rating),
          pointBorderColor: 'rgba(255,255,255,0.85)',
          pointBorderWidth: 1.2,
          pointHoverBorderWidth: 2.2,
          pointHitRadius: 12,
          showLine: false
        }
      ]
    };
  }, [scatterPoints, translate, computePointRadius, getScatterColor]);

  const handleScatterClick = useCallback((point) => {
    if (!point) return;
    console.log('Clicked broker:', point);
    // TODO: integrate BrokerCompareModal here
  }, []);

  const handleChartClick = useCallback((event) => {
    const chart = chartRef.current;
    if (!chart) return;
    const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, true);
    if (!elements.length) return;
    const { datasetIndex, index } = elements[0];
    const dataset = chart.data.datasets?.[datasetIndex];
    if (!dataset) return;
    handleScatterClick(dataset.data?.[index]);
  }, [handleScatterClick]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    parsing: false,
    animation: false,
    interaction: {
      mode: 'nearest',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--panel)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        titleColor: 'var(--text)',
        bodyColor: 'var(--text-muted)',
        displayColors: false,
        callbacks: {
          title: (context) => context[0]?.raw?.name ?? '',
          label: (context) => {
            const ratingLabel = translate('analytics.tooltip.overallRating');
            return `${ratingLabel}: ${context.raw?.overall_rating ?? 'N/A'}`;
          },
          afterLabel: (context) => {
            const raw = context.raw ?? {};
            const lines = [];
            lines.push(`${translateDimension(filters.x_axis)}: ${Number(raw.x_score ?? raw.x ?? 0).toFixed(1)}`);
            lines.push(`${translateDimension(filters.y_axis)}: ${Number(raw.y_score ?? raw.y ?? 0).toFixed(1)}`);
            lines.push(`${translate('analytics.tooltip.compositeScore')}: ${Number(raw.bubble_size ?? raw.composite_score ?? 0).toFixed(1)}`);
            lines.push(`${translate('analytics.tooltip.regulatorCount')}: ${raw.regulator_count ?? 0}`);
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: zoomDomain.x[0],
        max: zoomDomain.x[1],
        title: {
          display: true,
          text: translateDimension(data?.x_axis_info?.name || filters.x_axis),
          color: 'var(--text)',
          font: { weight: 600 }
        },
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          color: 'var(--text)',
          font: { size: 12 }
        },
        border: { color: 'var(--border)' }
      },
      y: {
        type: 'linear',
        min: zoomDomain.y[0],
        max: zoomDomain.y[1],
        title: {
          display: true,
          text: translateDimension(data?.y_axis_info?.name || filters.y_axis),
          color: 'var(--text)',
          font: { weight: 600 }
        },
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          color: 'var(--text)',
          font: { size: 12 }
        },
        border: { color: 'var(--border)' }
      }
    }
  }), [zoomDomain, data, filters, translate, translateDimension]);

  useEffect(() => {
    const chart = chartRef.current;
    const canvas = chart?.canvas;
    if (!chart || !canvas) return undefined;

    const scaleForAxis = (value, scale, pixel, axis) => {
      if (Number.isFinite(value)) return value;
      if (!scale) return value;
      if (axis === 'x') {
        return pixel < scale.left ? scale.min : scale.max;
      }
      return pixel < scale.top ? scale.max : scale.min;
    };

    const getPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const scaleX = chart.scales.x;
      const scaleY = chart.scales.y;
      if (!scaleX || !scaleY) return null;
      const xValue = scaleForAxis(scaleX.getValueForPixel(x), scaleX, x, 'x');
      const yValue = scaleForAxis(scaleY.getValueForPixel(y), scaleY, y, 'y');
      return {
        pixel: { x, y },
        value: { x: xValue, y: yValue }
      };
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;
      const position = getPosition(event);
      if (!position) return;
      event.preventDefault();
      selectionStateRef.current = {
        start: position,
        end: position
      };
      setIsSelecting(true);
      setSelectionPixels({
        x1: position.pixel.x,
        y1: position.pixel.y,
        x2: position.pixel.x,
        y2: position.pixel.y
      });
    };

    const handlePointerMove = (event) => {
      if (!selectionStateRef.current) return;
      const position = getPosition(event);
      if (!position) return;
      selectionStateRef.current.end = position;
      const { start } = selectionStateRef.current;
      setSelectionPixels({
        x1: start.pixel.x,
        y1: start.pixel.y,
        x2: position.pixel.x,
        y2: position.pixel.y
      });
    };

    const completeSelection = () => {
      if (!selectionStateRef.current) {
        setSelectionPixels(null);
        setIsSelecting(false);
        return;
      }

      const { start, end } = selectionStateRef.current;
      selectionStateRef.current = null;
      setIsSelecting(false);

      const deltaX = Math.abs(end.pixel.x - start.pixel.x);
      const deltaY = Math.abs(end.pixel.y - start.pixel.y);
      setSelectionPixels(null);

      if (deltaX < 20 || deltaY < 20) {
        return;
      }

      const clampToDefault = (value, axis) => {
        const domain = defaultDomainRef.current?.[axis];
        if (!domain) return value;
        return Math.min(Math.max(value, domain[0]), domain[1]);
      };

      const newDomain = {
        x: [
          clampToDefault(Math.min(start.value.x, end.value.x), 'x'),
          clampToDefault(Math.max(start.value.x, end.value.x), 'x')
        ],
        y: [
          clampToDefault(Math.min(start.value.y, end.value.y), 'y'),
          clampToDefault(Math.max(start.value.y, end.value.y), 'y')
        ]
      };

      setZoomDomain(newDomain);
    };

    const handlePointerUp = () => {
      completeSelection();
    };

    const handlePointerLeave = () => {
      if (selectionStateRef.current) {
        completeSelection();
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      selectionStateRef.current = null;
      setIsSelecting(false);
      setSelectionPixels(null);
    };
  }, [defaultDomain]);

  const isZoomed = useMemo(() => !domainsAreEqual(zoomDomain, defaultDomainRef.current), [zoomDomain]);

  const renderFilters = () => (
    <div className="analytics-filters">
      <h3>{translate('analytics.configuration.title')}</h3>
      <div className="filter-grid">
        <div className="filter-group">
          <label>{translate('analytics.configuration.xAxis')}</label>
          <select value={filters.x_axis} onChange={(e) => updateFilter('x_axis', e.target.value)}>
            {availableDimensions.map((dim) => (
              <option key={dim} value={dim}>{translateDimension(dim)}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{translate('analytics.configuration.yAxis')}</label>
          <select value={filters.y_axis} onChange={(e) => updateFilter('y_axis', e.target.value)}>
            {availableDimensions.map((dim) => (
              <option key={dim} value={dim}>{translateDimension(dim)}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{translate('analytics.configuration.regulatorFilter')}</label>
          <input
            type="text"
            placeholder={translate('analytics.configuration.regulatorPlaceholder')}
            value={filters.regulators}
            onChange={(e) => updateFilter('regulators', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>{translate('analytics.configuration.ratingRange')}</label>
          <div className="rating-range">
            <select value={filters.rating_min} onChange={(e) => updateFilter('rating_min', e.target.value)}>
              <option value="">{translate('analytics.configuration.minRating')}</option>
              <option value="A++">A++</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="C-">C-</option>
            </select>
            <span>{translate('analytics.configuration.to')}</span>
            <select value={filters.rating_max} onChange={(e) => updateFilter('rating_max', e.target.value)}>
              <option value="">{translate('analytics.configuration.maxRating')}</option>
              <option value="A++">A++</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="C-">C-</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => {
    if (!data?.statistics) return null;
    return (
      <div className="analytics-stats">
        <h3>{translate('analytics.statistics.title')}</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">{translate('analytics.statistics.totalBrokers')}</span>
            <span className="stat-value">{data.statistics.total_brokers}</span>
          </div>
          {Object.entries(data.statistics.quadrants).map(([key, value]) => {
            const labels = {
              q1: translate('analytics.statistics.advantageZone'),
              q2: translate('analytics.statistics.potentialZone'),
              q3: translate('analytics.statistics.focusZone'),
              q4: translate('analytics.statistics.improvementZone')
            };
            return (
              <div key={key} className="stat-item">
                <span className="stat-label">{labels[key]}</span>
                <span className="stat-value">{value}{translate('analytics.statistics.brokers')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!data?.data_points || data.data_points.length === 0) return null;

    const chartHeight = getChartHeight();
    const selectionStyle = selectionPixels
      ? {
          left: `${Math.min(selectionPixels.x1, selectionPixels.x2)}px`,
          top: `${Math.min(selectionPixels.y1, selectionPixels.y2)}px`,
          width: `${Math.abs(selectionPixels.x2 - selectionPixels.x1)}px`,
          height: `${Math.abs(selectionPixels.y2 - selectionPixels.y1)}px`
        }
      : null;

    return (
      <div className={`chart-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="chart-header">
          <h3>{translate('analytics.chart.title')}</h3>
          <div className="chart-controls">
            {isFullscreen && (
              <div className="size-selector">
                <label>{translate('analytics.chart.controls.size')}</label>
                <select
                  value={chartSize}
                  onChange={(e) => setChartSize(e.target.value)}
                  className="size-select"
                >
                  <option value="small">{translate('analytics.chart.controls.sizeOptions.small')}</option>
                  <option value="medium">{translate('analytics.chart.controls.sizeOptions.medium')}</option>
                  <option value="large">{translate('analytics.chart.controls.sizeOptions.large')}</option>
                </select>
              </div>
            )}
            <button
              onClick={resetZoom}
              className="zoom-reset-btn"
              title={translate('analytics.chart.controls.resetZoom')}
              disabled={!isZoomed}
            >
              🔍︎
            </button>
            <button
              onClick={toggleFullscreen}
              className="fullscreen-btn"
              title={isFullscreen ? translate('analytics.chart.controls.exitFullscreen') : translate('analytics.chart.controls.fullscreen')}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          </div>
        </div>

        <div className="chart-description">
          <p>
            <strong>{translate('analytics.chart.description.xAxis')}</strong>{' '}
            {translateDimension(data.x_axis_info?.name)} - {data.x_axis_info?.description}
          </p>
          <p>
            <strong>{translate('analytics.chart.description.yAxis')}</strong>{' '}
            {translateDimension(data.y_axis_info?.name)} - {data.y_axis_info?.description}
          </p>
          <p>
            <strong>{translate('analytics.chart.description.bubbleSize')}</strong>{' '}
            {translateDimension(data.bubble_info?.name)} - {data.bubble_info?.description}
          </p>
        </div>

        <div className="chart-interaction-hint">
          <p>{translate('analytics.chart.interaction.hint')}</p>
        </div>

        <div className="chart-viewport" style={{ height: chartHeight }}>
          <div className={`chart-canvas-wrapper ${isSelecting ? 'is-selecting' : ''}`}>
            <Scatter
              ref={chartRef}
              data={scatterData}
              options={chartOptions}
              onClick={handleChartClick}
            />
            {selectionStyle && (
              <div className="chart-selection-rect" style={selectionStyle} />
            )}
          </div>
        </div>

        <div className="quadrant-legends">
          <div className="legend-item q1">
            <strong>{translate('analytics.quadrants.q1.title')}</strong>
            <p>{translate('analytics.quadrants.q1.description', {
              xAxis: translateDimension(data.x_axis_info?.name),
              yAxis: translateDimension(data.y_axis_info?.name)
            })}</p>
          </div>
          <div className="legend-item q2">
            <strong>{translate('analytics.quadrants.q2.title')}</strong>
            <p>{translate('analytics.quadrants.q2.description', {
              xAxis: translateDimension(data.x_axis_info?.name),
              yAxis: translateDimension(data.y_axis_info?.name)
            })}</p>
          </div>
          <div className="legend-item q3">
            <strong>{translate('analytics.quadrants.q3.title')}</strong>
            <p>{translate('analytics.quadrants.q3.description', {
              xAxis: translateDimension(data.x_axis_info?.name),
              yAxis: translateDimension(data.y_axis_info?.name)
            })}</p>
          </div>
          <div className="legend-item q4">
            <strong>{translate('analytics.quadrants.q4.title')}</strong>
            <p>{translate('analytics.quadrants.q4.description', {
              xAxis: translateDimension(data.x_axis_info?.name),
              yAxis: translateDimension(data.y_axis_info?.name)
            })}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="broker-analytics">
      <div className="analytics-header">
        <h1>{translate('analytics.title')}</h1>
        <p>{translate('analytics.subtitle')}</p>
      </div>

      {renderFilters()}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>{translate('analytics.loading')}</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button onClick={fetchQuadrantData} className="retry-button">
            {translate('analytics.retry')}
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {renderChart()}
          {renderStatistics()}
        </>
      )}
    </div>
  );
};

export default BrokerAnalytics;

