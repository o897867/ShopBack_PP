import React, { useState, useEffect, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Brush, ReferenceArea } from 'recharts';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { API_BASE_URL } from '../config/api.js';
import './BrokerAnalytics.css';

const BrokerAnalytics = () => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  // 状态管理
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 图表显示状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSize, setChartSize] = useState('medium');

  // 图表缩放和选择状态
  const [zoomDomain, setZoomDomain] = useState({ x: [0, 100], y: [0, 100] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionArea, setSelectionArea] = useState(null);

  // 筛选器状态
  const [filters, setFilters] = useState({
    x_axis: 'Regulatory Strength',
    y_axis: 'Transparency & Compliance',
    bubble_metric: 'Composite Score',
    regulators: '',
    rating_min: '',
    rating_max: '',
    limit: 50
  });

  // 可用维度
  const [availableDimensions, setAvailableDimensions] = useState([]);

  // 获取象限分析数据
  const fetchQuadrantData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/quadrant-analysis?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || translate('analytics.error'));
      console.error('Failed to fetch quadrant data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 获取可用维度
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

  // 初始化数据
  useEffect(() => {
    fetchAvailableDimensions();
    fetchQuadrantData();
  }, []);

  // 当筛选器改变时重新获取数据
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuadrantData();
    }, 500); // 防抖

    return () => clearTimeout(timeoutId);
  }, [filters, fetchQuadrantData]);

  // 更新筛选器
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 获取散点颜色
  const getScatterColor = useCallback((rating) => {
    const colorMap = {
      'A++': '#00C851', 'A+': '#2E7D32', 'A': '#4CAF50', 'A-': '#66BB6A',
      'B+': '#FFB300', 'B': '#FF9800', 'B-': '#FF8A65',
      'C+': '#FF5722', 'C': '#F44336', 'C-': '#D32F2F',
      'D+': '#9E9E9E', 'D': '#757575', 'D-': '#424242'
    };
    return colorMap[rating] || '#9E9E9E';
  }, []);

  // 自定义悬停提示
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="quadrant-tooltip">
          <h4>{data.name}</h4>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">{translate('analytics.tooltip.overallRating')}</span>
              <span className="tooltip-value rating">{data.overall_rating || 'N/A'}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">{translateDimension(filters.x_axis)}:</span>
              <span className="tooltip-value">{data.x_score.toFixed(1)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">{translateDimension(filters.y_axis)}:</span>
              <span className="tooltip-value">{data.y_score.toFixed(1)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">{translate('analytics.tooltip.compositeScore')}</span>
              <span className="tooltip-value">{data.bubble_size.toFixed(1)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">{translate('analytics.tooltip.regulatorCount')}</span>
              <span className="tooltip-value">{data.regulator_count}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 处理散点点击
  const handleScatterClick = useCallback((data) => {
    // 这里可以集成现有的BrokerCompareModal或跳转到详情页
    console.log('Clicked broker:', data);
    // TODO: 集成BrokerCompareModal
  }, []);

  // 图表尺寸配置
  const getChartHeight = useCallback(() => {
    if (isFullscreen) {
      const sizeMap = {
        small: window.innerHeight * 0.6,
        medium: window.innerHeight * 0.75,
        large: window.innerHeight * 0.9
      };
      return sizeMap[chartSize] || sizeMap.medium;
    }

    // 根据屏幕尺寸调整基础高度
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
      return 400; // 小屏幕手机
    } else if (screenWidth <= 768) {
      return 500; // 平板和大屏手机
    } else {
      return 600; // 桌面端
    }
  }, [isFullscreen, chartSize]);

  // 全屏切换处理
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // 图表缩放功能
  const handleMouseDown = useCallback((e) => {
    if (e && e.activeLabel !== undefined) {
      setIsSelecting(true);
      setSelectionArea({
        x1: e.activeLabel,
        y1: e.activePayload ? e.activePayload[0].value : 0,
        x2: e.activeLabel,
        y2: e.activePayload ? e.activePayload[0].value : 0
      });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isSelecting && e && e.activeLabel !== undefined && selectionArea) {
      setSelectionArea(prev => ({
        ...prev,
        x2: e.activeLabel,
        y2: e.activePayload ? e.activePayload[0].value : prev.y2
      }));
    }
  }, [isSelecting, selectionArea]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionArea) {
      const { x1, y1, x2, y2 } = selectionArea;
      const newXDomain = [Math.min(x1, x2), Math.max(x1, x2)];
      const newYDomain = [Math.min(y1, y2), Math.max(y1, y2)];

      // 确保缩放区域有一定大小
      if (Math.abs(newXDomain[1] - newXDomain[0]) > 5 && Math.abs(newYDomain[1] - newYDomain[0]) > 5) {
        setZoomDomain({ x: newXDomain, y: newYDomain });
      }
    }
    setIsSelecting(false);
    setSelectionArea(null);
  }, [isSelecting, selectionArea]);

  // 重置缩放
  const resetZoom = useCallback(() => {
    setZoomDomain({ x: [0, 100], y: [0, 100] });
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (zoomDomain.x[0] !== 0 || zoomDomain.x[1] !== 100 || zoomDomain.y[0] !== 0 || zoomDomain.y[1] !== 100) {
          resetZoom();
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, zoomDomain, resetZoom]);

  // 翻译维度名称
  const translateDimension = useCallback((dimName) => {
    // 尝试从 dimensionNames 映射中查找翻译
    return translate(`analytics.dimensionNames.${dimName}`) !== `analytics.dimensionNames.${dimName}`
      ? translate(`analytics.dimensionNames.${dimName}`)
      : dimName;
  }, [translate]);

  // 渲染筛选器
  const renderFilters = () => (
    <div className="analytics-filters">
      <h3>{translate('analytics.configuration.title')}</h3>

      <div className="filter-grid">
        <div className="filter-group">
          <label>{translate('analytics.configuration.xAxis')}</label>
          <select
            value={filters.x_axis}
            onChange={(e) => updateFilter('x_axis', e.target.value)}
          >
            {availableDimensions.map(dim => (
              <option key={dim} value={dim}>{translateDimension(dim)}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{translate('analytics.configuration.yAxis')}</label>
          <select
            value={filters.y_axis}
            onChange={(e) => updateFilter('y_axis', e.target.value)}
          >
            {availableDimensions.map(dim => (
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
            <select
              value={filters.rating_min}
              onChange={(e) => updateFilter('rating_min', e.target.value)}
            >
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
            <select
              value={filters.rating_max}
              onChange={(e) => updateFilter('rating_max', e.target.value)}
            >
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

  // 渲染图表
  const renderChart = () => {
    if (!data || !data.data_points) return null;

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
              disabled={zoomDomain.x[0] === 0 && zoomDomain.x[1] === 100 && zoomDomain.y[0] === 0 && zoomDomain.y[1] === 100}
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
            <strong>{translate('analytics.chart.description.xAxis')}</strong> {translateDimension(data.x_axis_info.name)} - {data.x_axis_info.description}
          </p>
          <p>
            <strong>{translate('analytics.chart.description.yAxis')}</strong> {translateDimension(data.y_axis_info.name)} - {data.y_axis_info.description}
          </p>
          <p>
            <strong>{translate('analytics.chart.description.bubbleSize')}</strong> {translateDimension(data.bubble_info.name)} - {data.bubble_info.description}
          </p>
        </div>

        <div className="chart-interaction-hint">
          <p>{translate('analytics.chart.interaction.hint')}</p>
        </div>

        <ResponsiveContainer width="100%" height={getChartHeight()}>
          <ScatterChart
            margin={{ top: 20, right: 80, bottom: 60, left: 80 }}
            data={data.data_points}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x_score"
              name={translateDimension(data.x_axis_info.name)}
              domain={zoomDomain.x}
              label={{ value: translateDimension(data.x_axis_info.name), position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y_score"
              name={translateDimension(data.y_axis_info.name)}
              domain={zoomDomain.y}
              label={{ value: translateDimension(data.y_axis_info.name), angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 选择区域 */}
            {selectionArea && (
              <ReferenceArea
                x1={selectionArea.x1}
                x2={selectionArea.x2}
                y1={selectionArea.y1}
                y2={selectionArea.y2}
                stroke="#2563eb"
                strokeOpacity={0.5}
                fill="#2563eb"
                fillOpacity={0.1}
              />
            )}

            <Scatter
              dataKey="bubble_size"
              onClick={handleScatterClick}
              cursor="pointer"
            >
              {data.data_points.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getScatterColor(entry.overall_rating)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* 象限说明 */}
        <div className="quadrant-legends">
          <div className="legend-item q1">
            <strong>{translate('analytics.quadrants.q1.title')}</strong>
            <p>{translate('analytics.quadrants.q1.description', {
              xAxis: translateDimension(data.x_axis_info.name),
              yAxis: translateDimension(data.y_axis_info.name)
            })}</p>
          </div>
          <div className="legend-item q2">
            <strong>{translate('analytics.quadrants.q2.title')}</strong>
            <p>{translate('analytics.quadrants.q2.description', {
              xAxis: translateDimension(data.x_axis_info.name),
              yAxis: translateDimension(data.y_axis_info.name)
            })}</p>
          </div>
          <div className="legend-item q3">
            <strong>{translate('analytics.quadrants.q3.title')}</strong>
            <p>{translate('analytics.quadrants.q3.description', {
              xAxis: translateDimension(data.x_axis_info.name),
              yAxis: translateDimension(data.y_axis_info.name)
            })}</p>
          </div>
          <div className="legend-item q4">
            <strong>{translate('analytics.quadrants.q4.title')}</strong>
            <p>{translate('analytics.quadrants.q4.description', {
              xAxis: translateDimension(data.x_axis_info.name),
              yAxis: translateDimension(data.y_axis_info.name)
            })}</p>
          </div>
        </div>
      </div>
    );
  };

  // 渲染统计信息
  const renderStatistics = () => {
    if (!data || !data.statistics) return null;

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

  return (
    <div className="broker-analytics">
      <div className="analytics-header">
        <h1>{translate('analytics.title')}</h1>
        <p>{translate('analytics.subtitle')}</p>
      </div>

      {renderFilters()}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{translate('analytics.loading')}</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button onClick={fetchQuadrantData} className="retry-button">{translate('analytics.retry')}</button>
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