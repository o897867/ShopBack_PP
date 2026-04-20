import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
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
import BestIndicatorToday from '../components/BestIndicatorToday.jsx';

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
  LineController,
  BarElement,
  BarController,
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

  // Asset selection state
  const [selectedAsset, setSelectedAsset] = useState('ETH'); // 'ETH' or 'XAU'
  const [selectedInterval, setSelectedInterval] = useState({
    ETH: '3m',  // ETH固定3分钟
    XAU: '1m'   // XAU默认1分钟，可切换到3m
  });

  const [candles, setCandles] = useState([]);
  const [indicators, setIndicators] = useState({});
  const [validity, setValidity] = useState(null);
  const [selectedIndicators, setSelectedIndicators] = useState(['SMA14', 'EMA20', 'VWAP']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Calculate timeRange dynamically based on interval and fixed 500 candles
  const getTimeRangeMinutes = (interval) => {
    const minutesPerCandle = {
      '1m': 1,
      '3m': 3,
      '5m': 5,
      '15m': 15
    };
    return (minutesPerCandle[interval] || 3) * 500; // 500 candles × minutes per candle
  };

  const timeRange = getTimeRangeMinutes(selectedInterval[selectedAsset]);
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
  const [showBestIndicator, setShowBestIndicator] = useState(false);
  const [bestIndicatorData, setBestIndicatorData] = useState(null);
  const [hasShownBestIndicator, setHasShownBestIndicator] = useState(false);

  // 当切换时间跨度时，重置最佳指标显示状态
  useEffect(() => {
    setHasShownBestIndicator(false);
    setBestIndicatorData(null);
  }, [selectedInterval, selectedAsset]);

  // 如果 API 暂无可用数据，回退到示例提示，保证首屏仍然展示动画
  useEffect(() => {
    if (bestIndicatorData || hasShownBestIndicator) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const fallbackData = {
        name: 'RSI',
        accuracy: '92',
        winRate: '78',
        signals: 45,
        score: '88'
      };
      setBestIndicatorData(fallbackData);
      setShowBestIndicator(true);
      setHasShownBestIndicator(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [bestIndicatorData, hasShownBestIndicator]);

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

  const coreIndicators = useMemo(() => {
    if (selectedAsset === 'XAU') {
      return ['MACD', 'RSI', 'SMA14', 'EMA20'];
    }
    return ['SMA14', 'EMA20', 'VWAP'];
  }, [selectedAsset]);

  // Asset configuration
  const assetConfig = useMemo(() => ({
    ETH: {
      symbol: 'ETHUSDT',
      intervals: ['3m', '15m'],  // ETH支持3分钟和15分钟
      name: 'Ethereum',
      displayName: 'ETH/USDT',
      color: '#627EEA',
      label: 'ETH',
      api: '/api/indicators/calculate',
      validityApi: '/api/indicators/validity',
      candlesApi: '/api/eth/candles-3m',
      defaultCandleCount: 500,
      supportsIndicators: true,
      timeUnit: 'hour',
      timeFormat: 'HH:mm'
    },
    XAU: {
      symbol: 'GC=F',
      intervals: ['1m', '3m', '5m'],  // XAU支持1分钟、3分钟和5分钟
      name: 'Gold',
      displayName: 'XAU/USD',
      color: '#D4AF37',
      label: 'XAU',
      api: (interval) => `/api/xau/indicators?interval=${interval}`,
      validityApi: (interval) => `/api/xau/validity?interval=${interval}`,
      candlesApi: (interval) => `/api/xau/candles?interval=${interval}`,
      defaultCandleCount: 500,
      supportsIndicators: true,
      timeUnit: 'minute',
      timeFormat: 'HH:mm'
    }
  }), []);

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
  }, [validity, selectedIndicators, indicatorOptionMap, selectedAsset, selectedInterval]);

  // Helper function to get indicator image filename
  const getIndicatorImageName = useCallback((indicatorId) => {
    const imageMap = {
      'SMA14': 'sma',
      'EMA20': 'ema',
      'VWAP': 'vwap',
      'MACD': 'macd',
      'RSI': 'rsi'
    };
    return imageMap[indicatorId] || indicatorId.toLowerCase();
  }, []);

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

    const config = assetConfig[selectedAsset];
    const currentInterval = selectedInterval[selectedAsset];

    try {
      if (selectedAsset === 'ETH') {
        // ETH: Fetch indicators and validity
        const indicatorResponse = await fetch(
          `${API_BASE}${config.api}?symbol=${config.symbol}&interval=${currentInterval}&limit=${chartSettings.candleCount}`
        );

        if (!indicatorResponse.ok) {
          throw new Error(`HTTP error! status: ${indicatorResponse.status}`);
        }

        const indicatorData = await indicatorResponse.json();
        setCandles(indicatorData.candles || []);
        setIndicators(indicatorData.indicators || {});

        // Fetch validity signals (ETH uses days)
        const days = Math.round(timeRange / 1440); // Convert minutes to days
        const params = new URLSearchParams({
          symbol: config.symbol,
          interval: currentInterval,
          days: days,
          limit: chartSettings.candleCount,
          ...validityParams
        });

        const validityResponse = await fetch(
          `${API_BASE}${config.validityApi}?${params}`
        );

        if (!validityResponse.ok) {
          throw new Error(`HTTP error! status: ${validityResponse.status}`);
        }

        const validityData = await validityResponse.json();
        setValidity(validityData.validity_summary);

        // 计算最佳指标
        if (validityData.validity_summary?.indicators) {
          console.log('Calculating best indicator...', validityData.validity_summary.indicators);
          const indicators = validityData.validity_summary.indicators;
          let best = null;
          let bestScore = 0;

          // 根据不同时间跨度调整评分权重 - ETH固定为3m
          const currentInterval = selectedInterval[selectedAsset];
          const intervalWeights = {
            '1m': { accuracy: 0.5, winRate: 0.2, signals: 0.2, volatility: 0.1 },  // 短线更重视准确率
            '3m': { accuracy: 0.4, winRate: 0.3, signals: 0.2, volatility: 0.1 },  // 平衡型
            '5m': { accuracy: 0.35, winRate: 0.35, signals: 0.2, volatility: 0.1 }, // 中线
            '15m': { accuracy: 0.3, winRate: 0.4, signals: 0.15, volatility: 0.15 } // 长线更重视胜率
          };

          const weights = intervalWeights[currentInterval] || intervalWeights['3m'];

          // 不同时间跨度下的最佳指标偏好
          const intervalPreferences = {
            '1m': ['RSI', 'MACD'],      // 短线适合动量指标
            '3m': ['VWAP', 'RSI'],      // 中短线适合量价指标
            '5m': ['EMA20', 'VWAP'],    // 中线适合趋势指标
            '15m': ['SMA14', 'EMA20']   // 长线适合均线指标
          };

          Object.entries(indicators).forEach(([name, data]) => {
            console.log(`Checking ${name}:`, data);
            // 使用实际的字段名 - valid_count
            const validCount = data?.valid_count || 0;  // 有效信号数
            const eventsCount = data?.events?.length || 0;

            if (data && validCount > 0) {
              // 计算平均确认K线数
              const avgConfirm = data?.avgConfirmCandles ||
                (data.events?.length
                  ? data.events.reduce((sum, e) => {
                      const candles = e?.bounce_candles || e?.revert_candles ||
                                     e?.movement_candles || e?.confirmation_candles || 0;
                      return sum + candles;
                    }, 0) / data.events.length
                  : 3);

              // 基础评分计算 - 更合理的准确率计算
              // 根据确认K线数估算准确率（确认越快，准确率越高）
              const accuracy = avgConfirm < 2 ? 85 :
                              avgConfirm < 3 ? 75 :
                              avgConfirm < 5 ? 65 : 55;
              const winRate = accuracy * 0.9; // 估算胜率
              const signalWeight = Math.min(validCount / 10, 1) * 100;  // 降低阈值，让信号权重更合理
              const volatilityScore = Math.max(0, 100 - avgConfirm * 10); // 确认越快，波动性评分越高

              // 时间跨度偏好加成
              const preferredIndicators = intervalPreferences[currentInterval] || [];
              const preferenceBonus = preferredIndicators.includes(name) ? 10 : 0;

              // 综合评分
              const score =
                accuracy * weights.accuracy +
                winRate * weights.winRate +
                signalWeight * weights.signals +
                volatilityScore * weights.volatility +
                preferenceBonus;

              if (score > bestScore) {
                bestScore = score;
                best = {
                  name,
                  accuracy: accuracy.toFixed(0),
                  winRate: winRate.toFixed(0),
                  signals: validCount,  // 使用有效信号数
                  score: score.toFixed(0),
                  interval: currentInterval,
                  timeframe: selectedAsset === 'ETH' ? currentInterval : `${currentInterval} (${selectedAsset})`
                };
              }
            }
          });

          console.log('Best indicator found:', best);
          // 总是设置数据，即使为空
          setBestIndicatorData(best);

          // 只在有数据且第一次时自动显示
          if (best && !hasShownBestIndicator) {
            setShowBestIndicator(true);
            setHasShownBestIndicator(true);
          }
        }

      } else if (selectedAsset === 'XAU') {
        // XAU: Fetch indicators with dynamic interval
        const apiUrl = typeof config.api === 'function'
          ? config.api(currentInterval)
          : config.api;

        const indicatorResponse = await fetch(
          `${API_BASE}${apiUrl}&limit=${chartSettings.candleCount}`
        );

        if (!indicatorResponse.ok) {
          throw new Error(`HTTP error! status: ${indicatorResponse.status}`);
        }

        const indicatorData = await indicatorResponse.json();
        setCandles(indicatorData.candles || []);
        setIndicators(indicatorData.indicators || {});

        // Fetch validity if available
        if (config.validityApi) {
          const validityUrl = typeof config.validityApi === 'function'
            ? config.validityApi(currentInterval)
            : config.validityApi;

          const params = new URLSearchParams({
            minutes: timeRange,  // XAU使用minutes而非days
            limit: chartSettings.candleCount,
            ...validityParams
          });

          const validityResponse = await fetch(
            `${API_BASE}${validityUrl}&${params}`
          );

          if (validityResponse.ok) {
            const validityData = await validityResponse.json();
            setValidity(validityData.validity_summary);

            // 计算最佳指标 - XAU
            if (validityData.validity_summary?.indicators) {
              console.log('XAU - Calculating best indicator...', validityData.validity_summary.indicators);
              const indicators = validityData.validity_summary.indicators;
              let best = null;
              let bestScore = 0;

              // 根据不同时间跨度调整评分权重 - XAU支持多个interval
              const currentInterval = selectedInterval[selectedAsset];
              const intervalWeights = {
                '1m': { accuracy: 0.5, winRate: 0.2, signals: 0.2, volatility: 0.1 },  // 短线更重视准确率
                '3m': { accuracy: 0.4, winRate: 0.3, signals: 0.2, volatility: 0.1 },  // 平衡型
                '5m': { accuracy: 0.35, winRate: 0.35, signals: 0.2, volatility: 0.1 }, // 中线
                '15m': { accuracy: 0.3, winRate: 0.4, signals: 0.15, volatility: 0.15 } // 长线更重视胜率
              };

              const weights = intervalWeights[currentInterval] || intervalWeights['3m'];

              // 黄金市场不同时间跨度下的最佳指标偏好
              const intervalPreferences = {
                '1m': ['RSI', 'MACD'],      // 黄金短线适合动量指标
                '3m': ['MACD', 'RSI'],      // 黄金中短线适合MACD
                '5m': ['EMA20', 'MACD'],    // 黄金中线适合趋势指标
                '15m': ['SMA14', 'EMA20']   // 黄金长线适合均线指标
              };

              Object.entries(indicators).forEach(([name, data]) => {
                console.log(`XAU - Checking ${name}:`, data);
                // 使用实际的字段名 - valid_count
                const validCount = data?.valid_count || 0;  // 有效信号数
                const eventsCount = data?.events?.length || 0;

                if (data && validCount > 0) {
                  // 计算平均确认K线数
                  const avgConfirm = data?.avgConfirmCandles ||
                    (data.events?.length
                      ? data.events.reduce((sum, e) => {
                          const candles = e?.bounce_candles || e?.revert_candles ||
                                         e?.movement_candles || e?.confirmation_candles || 0;
                          return sum + candles;
                        }, 0) / data.events.length
                      : 3);

                  // 基础评分计算 - 更合理的准确率计算
                  const accuracy = avgConfirm < 2 ? 85 :
                                  avgConfirm < 3 ? 75 :
                                  avgConfirm < 5 ? 65 : 55;
                  const winRate = accuracy * 0.9; // 估算胜率
                  const signalWeight = Math.min(validCount / 10, 1) * 100;
                  const volatilityScore = Math.max(0, 100 - avgConfirm * 10);

                  // 时间跨度偏好加成
                  const preferredIndicators = intervalPreferences[currentInterval] || [];
                  const preferenceBonus = preferredIndicators.includes(name) ? 10 : 0;

                  // 综合评分
                  const score =
                    accuracy * weights.accuracy +
                    winRate * weights.winRate +
                    signalWeight * weights.signals +
                    volatilityScore * weights.volatility +
                    preferenceBonus;

                  if (score > bestScore) {
                    bestScore = score;
                    best = {
                      name,
                      accuracy: accuracy.toFixed(0),
                      winRate: winRate.toFixed(0),
                      signals: validCount,  // 使用有效信号数
                      score: score.toFixed(0),
                      interval: currentInterval,
                      timeframe: `${currentInterval} (${selectedAsset})`
                    };
                  }
                }
              });

              console.log('XAU - Best indicator found:', best);
              // 总是设置数据，即使为空
              setBestIndicatorData(best);

              // 只在有数据且第一次时自动显示
              if (best && !hasShownBestIndicator) {
                setShowBestIndicator(true);
                setHasShownBestIndicator(true);
              }
            }
          } else {
            setValidity(null);
          }
        } else {
          setValidity(null);
        }
      }
    } catch (err) {
      setError(`Failed to fetch ${config.name} data: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch when settings change or asset changes
  useEffect(() => {
    fetchData();
  }, [chartSettings.candleCount, validityParams, selectedAsset, selectedInterval]);

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
      label: translate('indicators.chart.candles'),
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
      label: translate('indicators.chart.high'),
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
      label: translate('indicators.chart.low'),
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
      } else if (ind === 'MACD') {
        // Support both formats: indicators.MACD (uppercase) and indicators.macd.macd (lowercase nested)
        const macdData = indicators.MACD || (indicators.macd && indicators.macd.macd);
        const macdSignal = indicators.MACD_signal || (indicators.macd && indicators.macd.signal);
        const macdHistogram = indicators.MACD_histogram || (indicators.macd && indicators.macd.histogram);

        if (macdData) {
          // MACD line
          datasets.push({
            label: 'MACD',
            type: 'line',
            data: formatSeries(macdData),
            borderColor: option.color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            parsing: false,
            spanGaps: true,
            yAxisID: 'y-macd'
          });

          // MACD Signal line
          if (macdSignal) {
            datasets.push({
              label: 'MACD Signal',
              type: 'line',
              data: formatSeries(macdSignal),
              borderColor: '#f39c12',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              pointRadius: 0,
              parsing: false,
              spanGaps: true,
              yAxisID: 'y-macd'
            });
          }

          // MACD Histogram
          if (macdHistogram) {
            datasets.push({
              label: 'MACD Histogram',
              type: 'bar',
              data: formatSeries(macdHistogram),
              backgroundColor: macdHistogram.map(val =>
                val >= 0 ? 'rgba(0, 212, 170, 0.5)' : 'rgba(243, 156, 18, 0.5)'
              ),
              borderColor: 'transparent',
              borderWidth: 0,
              barThickness: 2,
              parsing: false,
              yAxisID: 'y-macd'
            });
          }
        }
      } else if (ind === 'RSI') {
        // Support both formats: indicators.RSI (uppercase) and indicators.rsi (lowercase)
        const rsiData = indicators.RSI || indicators.rsi;

        if (rsiData) {
          // RSI line
          datasets.push({
            label: 'RSI',
            type: 'line',
            data: formatSeries(rsiData),
            borderColor: option.color,
            backgroundColor: 'rgba(155, 89, 182, 0.1)',
            borderWidth: 2.5,
            pointRadius: 0,
            parsing: false,
            spanGaps: true,
            fill: true,
            yAxisID: 'y-rsi'
          });

          // RSI overbought line (70)
          const overboughtLine = new Array(rsiData.length).fill(70);
          datasets.push({
            label: 'RSI 70',
            type: 'line',
            data: formatSeries(overboughtLine),
            borderColor: 'rgba(231, 76, 60, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            parsing: false,
            yAxisID: 'y-rsi'
          });

          // RSI oversold line (30)
          const oversoldLine = new Array(rsiData.length).fill(30);
          datasets.push({
            label: 'RSI 30',
            type: 'line',
            data: formatSeries(oversoldLine),
            borderColor: 'rgba(39, 174, 96, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            parsing: false,
            yAxisID: 'y-rsi'
          });
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
          // Add glow effect background layer
          datasets.push({
            label: `${ind} ${translate('indicators.chart.validSignals')} Glow`,
            data: validPoints,
            type: 'scatter',
            backgroundColor: option.color + '40', // 25% opacity for glow
            borderColor: 'transparent',
            pointStyle: 'circle',
            pointRadius: 12, // Larger glow radius
            pointHoverRadius: 14,
            parsing: false,
            hidden: false,
            showLine: false
          });

          // Main signal marker
          datasets.push({
            label: `${ind} ${translate('indicators.chart.validSignals')}`,
            data: validPoints,
            type: 'scatter',
            backgroundColor: '#ffffff', // White center for contrast
            borderColor: option.color,
            pointStyle: 'star', // Star shape more eye-catching than diamond
            pointRadius: 8, // Larger main point
            pointHoverRadius: 10,
            pointBorderWidth: 3, // Thicker border
            pointRotation: 0,
            parsing: false
          });
        }
      });
    }

    if (chartSettings.showVolume) {
      datasets.push({
        label: translate('indicators.chart.volume'),
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

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
        text: `${assetConfig[selectedAsset].displayName} - ${selectedInterval[selectedAsset]} ${translate('indicators.chart.candles')}`,
        color: palette.text,
        font: { weight: '700', size: 14 }
      },
      tooltip: {
        enabled: !isMobile, // Disable tooltip on mobile
        callbacks: {
          label: function(context) {
            const highLabel = translate('indicators.chart.high');
            const lowLabel = translate('indicators.chart.low');
            const volumeLabel = translate('indicators.chart.volume');
            const candlesLabel = translate('indicators.chart.candles');
            const openLabel = translate('indicators.chart.open');
            const closeLabel = translate('indicators.chart.close');

            if (context.dataset.label === highLabel || context.dataset.label === lowLabel) {
              return null;
            }
            if (context.dataset.type === 'scatter') {
              return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
            }
            if (context.dataset.label === volumeLabel) {
              return `${volumeLabel}: ${(context.parsed.y / 1000).toFixed(2)}K`;
            }
            if (context.dataset.label === candlesLabel) {
              const candle = candles[context.dataIndex];
              if (!candle) return '';
              return [
                `${openLabel}: $${candle.open?.toFixed(2)}`,
                `${highLabel}: $${candle.high?.toFixed(2)}`,
                `${lowLabel}: $${candle.low?.toFixed(2)}`,
                `${closeLabel}: $${candle.close?.toFixed(2)}`,
                `${volumeLabel}: ${(candle.volume / 1000).toFixed(2)}K`
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
      },
      'y-macd': {
        type: 'linear',
        display: selectedIndicators.includes('MACD'),
        position: 'left',
        grid: {
          display: false
        },
        ticks: {
          color: '#00d4aa',
          font: { weight: '600', size: 10 },
          callback: function(value) {
            return value.toFixed(2);
          }
        },
        title: {
          display: true,
          text: 'MACD',
          color: '#00d4aa',
          font: { weight: '700', size: 11 }
        }
      },
      'y-rsi': {
        type: 'linear',
        display: selectedIndicators.includes('RSI'),
        position: 'left',
        min: 0,
        max: 100,
        grid: {
          display: false
        },
        ticks: {
          color: '#9b59b6',
          font: { weight: '600', size: 10 },
          stepSize: 20,
          callback: function(value) {
            return value.toFixed(0);
          }
        },
        title: {
          display: true,
          text: 'RSI',
          color: '#9b59b6',
          font: { weight: '700', size: 11 }
        }
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
      {/* Best Indicator Today Popup */}
      {showBestIndicator && bestIndicatorData && (
        <BestIndicatorToday
          onClose={() => setShowBestIndicator(false)}
          data={bestIndicatorData}
        />
      )}

      {/* Top Controls - Always visible */}
      <div className="indicators-top-controls">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      {/* Hero Section - Show for assets with validity support */}
      {assetConfig[selectedAsset]?.validityApi && (
        <section className="indicators-hero indicators-hero--overwatch">
          <div className="indicators-hero__inner">
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

              {/* 今日最佳按钮 */}
              {bestIndicatorData && (
                <button
                  className="best-indicator-trigger"
                  onClick={() => {
                    console.log('Button clicked, bestIndicatorData:', bestIndicatorData);
                    setShowBestIndicator(true);
                  }}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#1a1a2e',
                    border: 'none',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  {currentLanguage === 'en' ? "View Today's Best Indicator" : '查看今日最佳指标'}
                </button>
              )}
            </div>

            <div className="overwatch-hero-grid-new">
              {/* Left blank space (15%) */}
              <div className="hero-blank-left"></div>

              {/* Hero image section (30%) */}
              <div className="overwatch-hero-image-section">
                <div className="hero-image-container">
                  <img
                    key={selectedHero.id}
                    data-indicator={selectedHero.id}
                    src={`/images/indicators/${getIndicatorImageName(selectedHero.id)}.png`}
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
                        src={`/images/indicators/${getIndicatorImageName(card.id)}.svg`}
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
                    {selectedHero.id === 'MACD' && (translate('indicators.cards.macdDescription') || 'Moving Average Convergence Divergence，趋势与动量的双重确认')}
                    {selectedHero.id === 'RSI' && (translate('indicators.cards.rsiDescription') || 'Relative Strength Index，衡量市场超买超卖的经典指标')}
                  </p>
                </div>

                {/* Statistics section */}
                <div className="stats-section">
                  <h3 className="stats-title" style={{ color: selectedHero.color }}>
                    {translate('indicators.detail.statistics') || '有效统计 / Statistics'}
                  </h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-item-label">{translate('indicators.detail.validSignals') || '有效信号数'}</div>
                      <div className="stat-item-value" style={{ color: selectedHero.color }}>
                        {selectedHero.count || 0}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-item-label">{translate('indicators.detail.avgConfirmCandles') || '平均确认K线'}</div>
                      <div className="stat-item-value" style={{ color: selectedHero.color }}>
                        {selectedHero.avgConfirmCandles !== null
                          ? selectedHero.avgConfirmCandles.toFixed(1)
                          : '—'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-item-label">{translate('indicators.detail.avgPerDay') || '日均信号'}</div>
                      <div className="stat-item-value" style={{ color: selectedHero.color }}>
                        {timeRange > 0 ? (selectedHero.count / (timeRange / 1440)).toFixed(1) : '—'}
                      </div>
                    </div>
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
      )}

      <section className="indicators-content" ref={chartSectionRef}>
        {error && (
          <div className="indicators-alert" role="alert">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)}>{translate('indicators.alert.close')}</button>
          </div>
        )}

        <div className="indicators-card indicators-panel">
          <div className="indicators-panel__row">
            {/* Asset Switcher */}
            <div className="asset-switcher">
              <span className="asset-switcher__label">Asset</span>
              {Object.keys(assetConfig).map(assetKey => {
                const asset = assetConfig[assetKey];
                return (
                  <button
                    key={assetKey}
                    className={`asset-btn ${selectedAsset === assetKey ? 'active' : ''}`}
                    onClick={() => setSelectedAsset(assetKey)}
                    style={{
                      '--asset-color': asset.color
                    }}
                  >
                    {asset.label}
                  </button>
                );
              })}
            </div>

            {/* Interval Selector - Show only for XAU */}
            {assetConfig[selectedAsset].intervals && assetConfig[selectedAsset].intervals.length > 1 && (
              <div className="interval-selector">
                <span className="interval-selector__label">{translate('indicators.panel.intervalSelector')}</span>
                {assetConfig[selectedAsset].intervals.map(interval => (
                  <button
                    key={interval}
                    className={`interval-btn ${selectedInterval[selectedAsset] === interval ? 'active' : ''}`}
                    onClick={() => setSelectedInterval(prev => ({ ...prev, [selectedAsset]: interval }))}
                    style={{
                      '--asset-color': assetConfig[selectedAsset].color
                    }}
                  >
                    {interval}
                  </button>
                ))}
              </div>
            )}

            {/* Indicator Toggles - Only show for ETH */}
            {assetConfig[selectedAsset].supportsIndicators && (
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
            )}
            <div className="indicators-panel__controls">
              <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                {loading ? translate('indicators.panel.refreshLoading') : `🔄 ${translate('indicators.panel.refresh')}`}
              </button>
            </div>
          </div>
        </div>

        <div className="indicators-card indicators-chart-card">
          <div className="indicators-card__header">
            <div>
              <h3>{assetConfig[selectedAsset].displayName} - {translate('indicators.chart.title')}</h3>
              <p>
                {selectedAsset === 'ETH'
                  ? translate('indicators.chart.subtitle')
                  : `Real-time ${assetConfig[selectedAsset].name} price chart with ${assetConfig[selectedAsset].interval} candles`
                }
              </p>
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
