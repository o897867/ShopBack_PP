import React, { useState, useEffect } from 'react';
import './LeverageCalculator.css';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const LeverageCalculator = () => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  // Contract size constant
  const CONTRACT_SIZE = 100;

  // Scenario selection state
  const [scenario, setScenario] = useState(1); // 1, 2, or 3

  // Real-time gold price state
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);
  const [goldPriceLoading, setGoldPriceLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Input states with default values
  const [totalFunds, setTotalFunds] = useState(10000);
  const [marketPrice, setMarketPrice] = useState(2650); // Default gold price
  const [lots, setLots] = useState(1);
  const [priceChange, setPriceChange] = useState(10);
  const [leverage, setLeverage] = useState(100);

  // Multi-position management
  const [positions, setPositions] = useState([
    { id: 1, direction: 'long', lots: 1, entryPrice: 2650, leverage: 100 }
  ]);
  const [showMultiPosition, setShowMultiPosition] = useState(false);

  // Smart guide system
  const [showGuide, setShowGuide] = useState(true);
  const [knownConditions, setKnownConditions] = useState({
    totalFunds: false,
    marketPrice: true, // Default to true since we have real-time price
    lots: false,
    priceChange: false,
    leverage: false
  });
  const [recommendedScenarios, setRecommendedScenarios] = useState([]);

  // Calculated states
  const [margin, setMargin] = useState(0);
  const [originalEquity, setOriginalEquity] = useState(0);
  const [actualEquity, setActualEquity] = useState(0);
  const [marginRatio, setMarginRatio] = useState(0);
  const [liquidationLine, setLiquidationLine] = useState(0);
  const [priceChangeToLiquidation, setPriceChangeToLiquidation] = useState(0);

  // Additional calculated states for scenarios
  const [maxLots, setMaxLots] = useState(0);
  const [requiredFunds, setRequiredFunds] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);

  // Multi-position calculated states
  const [multiLiquidationPrice, setMultiLiquidationPrice] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  // Calculate recommended scenarios based on known conditions
  useEffect(() => {
    const scenarios = [];

    // Scenario 1: Calculate maximum lots
    // Needs: totalFunds, marketPrice, priceChange, leverage
    if (knownConditions.totalFunds && knownConditions.marketPrice &&
        knownConditions.priceChange && knownConditions.leverage) {
      scenarios.push({
        id: 1,
        name: '最大手数计算',
        description: '计算在可承受风险下的最大开仓手数',
        icon: '📈',
        needs: ['账户资金', '市场价格', '预期价格波动', '杠杆倍数'],
        canCalculate: ['最大手数', '所需保证金', '爆仓线']
      });
    }

    // Scenario 2: Calculate required funds
    // Needs: marketPrice, lots, priceChange, leverage
    if (knownConditions.marketPrice && knownConditions.lots &&
        knownConditions.priceChange && knownConditions.leverage) {
      scenarios.push({
        id: 2,
        name: '所需资金计算',
        description: '计算开仓指定手数所需的最低资金',
        icon: '💰',
        needs: ['市场价格', '开仓手数', '预期价格波动', '杠杆倍数'],
        canCalculate: ['所需资金', '所需保证金', '爆仓线']
      });
    }

    // Scenario 3: Calculate liquidation price
    // Needs: totalFunds, marketPrice, lots, leverage
    if (knownConditions.totalFunds && knownConditions.marketPrice &&
        knownConditions.lots && knownConditions.leverage) {
      scenarios.push({
        id: 3,
        name: '爆仓价格计算',
        description: '计算当前持仓的爆仓价格点位',
        icon: '⚠️',
        needs: ['账户资金', '市场价格', '持仓手数', '杠杆倍数'],
        canCalculate: ['爆仓价格', '距离爆仓的价格变动', '保证金率']
      });
    }

    setRecommendedScenarios(scenarios);
  }, [knownConditions]);

  // Fetch real-time gold price on mount
  useEffect(() => {
    const fetchGoldPrice = async () => {
      setGoldPriceLoading(true);
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/xau/current-price`);
        if (response.ok) {
          const data = await response.json();
          if (data.current_price) {
            setCurrentGoldPrice(data.current_price);
            setMarketPrice(data.current_price);
            setLastUpdateTime(new Date().toLocaleTimeString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch gold price:', error);
      } finally {
        setGoldPriceLoading(false);
      }
    };

    fetchGoldPrice();
    // Refresh price every 30 seconds
    const interval = setInterval(fetchGoldPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate multi-position liquidation
  useEffect(() => {
    if (!showMultiPosition || positions.length === 0) return;

    let totalMarginUsed = 0;
    let totalProfitLoss = 0;

    positions.forEach(pos => {
      const posMargin = (pos.entryPrice * CONTRACT_SIZE * pos.lots) / pos.leverage;
      totalMarginUsed += posMargin;

      // Calculate PnL at current market price
      const priceDiff = marketPrice - pos.entryPrice;
      const positionPnL = pos.direction === 'long'
        ? priceDiff * CONTRACT_SIZE * pos.lots
        : -priceDiff * CONTRACT_SIZE * pos.lots;

      totalProfitLoss += positionPnL;
    });

    setTotalMargin(totalMarginUsed);
    setTotalPnL(totalProfitLoss);

    // Calculate liquidation price for multi-position
    // Net value = Total funds + Total PnL
    // Liquidation occurs when: Net value = 0.4 * Total margin
    // totalFunds + totalPnL(at price P) = 0.4 * totalMargin

    // Calculate net position (long lots - short lots)
    let netLongLots = 0;
    let weightedEntryPrice = 0;

    positions.forEach(pos => {
      if (pos.direction === 'long') {
        netLongLots += pos.lots;
        weightedEntryPrice += pos.entryPrice * pos.lots;
      } else {
        netLongLots -= pos.lots;
        weightedEntryPrice -= pos.entryPrice * pos.lots;
      }
    });

    if (netLongLots !== 0) {
      const avgEntryPrice = Math.abs(weightedEntryPrice / netLongLots);
      const liquidationLine = 0.4 * totalMarginUsed;
      const maxLoss = totalFunds - liquidationLine;
      const priceMove = maxLoss / (Math.abs(netLongLots) * CONTRACT_SIZE);

      const calculatedLiquidationPrice = netLongLots > 0
        ? avgEntryPrice - priceMove  // Net long position
        : avgEntryPrice + priceMove; // Net short position

      setMultiLiquidationPrice(calculatedLiquidationPrice);
    } else {
      // Positions are perfectly hedged
      setMultiLiquidationPrice(0);
    }

  }, [positions, marketPrice, totalFunds, showMultiPosition]);

  // Calculate values based on scenario
  useEffect(() => {
    const actualMarketPrice = marketPrice * CONTRACT_SIZE; // Apply contract size

    if (scenario === 1) {
      // Scenario 1: Calculate maximum lots
      // 计算最大手数，需要满足两个条件：
      // 1. 保证金要求：总保证金 <= 总资金
      // 2. 风险控制：即使价格波动，净值也要大于爆仓线

      // 每手所需保证金 = (市价 × 合约大小) / 杠杆
      const marginPerLot = actualMarketPrice / leverage;

      // 方法：找出在价格波动后，净值刚好等于爆仓线时的手数
      // 净值 = 总资金 - 价格波动损失
      // 爆仓线 = 0.4 × 总保证金 = 0.4 × (marginPerLot × 手数)
      // 总资金 - priceChange × CONTRACT_SIZE × lots = 0.4 × marginPerLot × lots
      // 总资金 = lots × (priceChange × CONTRACT_SIZE + 0.4 × marginPerLot)
      // lots = 总资金 / (priceChange × CONTRACT_SIZE + 0.4 × marginPerLot)

      const lossPerLot = priceChange * CONTRACT_SIZE;
      const liquidationPerLot = 0.4 * marginPerLot;
      const totalRiskPerLot = lossPerLot + liquidationPerLot;

      // 最大手数（基于风险）- 保留小数
      const maxLotsBasedOnRisk = totalFunds / totalRiskPerLot;

      // 最大手数（基于保证金）- 理论上的极限
      const maxLotsBasedOnMargin = totalFunds / marginPerLot;

      // 取两者中的较小值
      const calculatedMaxLots = Math.min(maxLotsBasedOnRisk, maxLotsBasedOnMargin);


      setMaxLots(calculatedMaxLots);

      // Use maxLots for other calculations
      const calculatedMargin = (actualMarketPrice * calculatedMaxLots) / leverage;
      setMargin(calculatedMargin);

      // 净值 = 总资金（保证金不是损失，只是冻结）
      const calculatedOriginalEquity = totalFunds;
      setOriginalEquity(calculatedOriginalEquity);

      // 爆仓净值 = 保证金的40%（爆仓线）
      const calculatedLiquidationEquity = calculatedMargin * 0.4;
      setActualEquity(calculatedLiquidationEquity);

      const calculatedMarginRatio = calculatedMargin !== 0
        ? (calculatedLiquidationEquity / calculatedMargin) * 100
        : 0;
      setMarginRatio(calculatedMarginRatio);

      const calculatedLiquidationLine = 0.4 * calculatedMargin;
      setLiquidationLine(calculatedLiquidationLine);

      const calculatedPriceChangeToLiquidation = calculatedMaxLots !== 0
        ? (totalFunds - calculatedLiquidationLine) / (calculatedMaxLots * CONTRACT_SIZE)
        : 0;
      setPriceChangeToLiquidation(calculatedPriceChangeToLiquidation);

    } else if (scenario === 2) {
      // Scenario 2: Calculate required funds
      // 所需资金需要满足：即使价格反向波动，净值也要大于爆仓线
      const calculatedMargin = (actualMarketPrice * lots) / leverage;

      // 爆仓线 = 0.4 × 保证金
      const liquidationLine = 0.4 * calculatedMargin;

      // 价格波动造成的潜在损失
      const potentialLoss = priceChange * CONTRACT_SIZE * lots;

      // 所需资金 = 潜在损失 + 爆仓线
      // 这样即使损失了potentialLoss，剩余资金仍然 >= 爆仓线
      const calculatedRequiredFunds = potentialLoss + liquidationLine;



      setRequiredFunds(calculatedRequiredFunds);

      // Standard calculations
      setMargin(calculatedMargin);

      // 净值 = 所需资金（保证金不是损失）
      const calculatedOriginalEquity = calculatedRequiredFunds;
      setOriginalEquity(calculatedOriginalEquity);

      // 爆仓净值 = 保证金的40%
      const calculatedLiquidationEquity = calculatedMargin * 0.4;
      setActualEquity(calculatedLiquidationEquity);

      const calculatedMarginRatio = calculatedMargin !== 0
        ? (calculatedLiquidationEquity / calculatedMargin) * 100
        : 0;
      setMarginRatio(calculatedMarginRatio);

      const calculatedLiquidationLine = liquidationLine;
      setLiquidationLine(calculatedLiquidationLine);

      const calculatedPriceChangeToLiquidation = lots !== 0
        ? (calculatedRequiredFunds - liquidationLine) / (lots * CONTRACT_SIZE)
        : 0;
      setPriceChangeToLiquidation(calculatedPriceChangeToLiquidation);

    } else if (scenario === 3) {
      // Scenario 3: Calculate liquidation price
      const calculatedMargin = (actualMarketPrice * lots) / leverage;
      setMargin(calculatedMargin);

      // 净值 = 总资金（保证金不是损失）
      const calculatedOriginalEquity = totalFunds;
      setOriginalEquity(calculatedOriginalEquity);

      // 爆仓线 = 0.4 × 保证金
      const calculatedLiquidationLine = 0.4 * calculatedMargin;
      setLiquidationLine(calculatedLiquidationLine);

      // 爆仓时的价格变动 = (原始净值 - 爆仓线) / (手数 × 合约大小)
      const maxPriceChange = (calculatedOriginalEquity - calculatedLiquidationLine) / (lots * CONTRACT_SIZE);

      // 爆仓价格 = 当前价格 - 最大价格变动（做多时下跌爆仓）
      const calculatedLiquidationPrice = marketPrice - maxPriceChange;
      setLiquidationPrice(calculatedLiquidationPrice);

      // 距离爆仓的价格变动
      setPriceChangeToLiquidation(maxPriceChange);

      // 爆仓净值 = 保证金的40%
      const calculatedLiquidationEquity = calculatedMargin * 0.4;
      setActualEquity(calculatedLiquidationEquity);

      const calculatedMarginRatio = calculatedMargin !== 0
        ? (calculatedLiquidationEquity / calculatedMargin) * 100
        : 0;
      setMarginRatio(calculatedMarginRatio);
    }
  }, [totalFunds, marketPrice, lots, priceChange, leverage, scenario]);

  // Helper function to determine risk level
  const getRiskLevel = () => {
    if (marginRatio < 100) return 'critical';
    if (marginRatio < 150) return 'high';
    if (marginRatio < 300) return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel();
  const marginRatioClamped = Math.min(Math.max(marginRatio, 0), 100);

  // Quick leverage presets
  const leveragePresets = [500, 1000];

  // Multi-position handlers
  const addPosition = () => {
    const newId = Math.max(...positions.map(p => p.id), 0) + 1;
    setPositions([...positions, {
      id: newId,
      direction: 'long',
      lots: 1,
      entryPrice: marketPrice,
      leverage: 100
    }]);
  };

  const removePosition = (id) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const updatePosition = (id, field, value) => {
    setPositions(positions.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Toggle condition and close guide
  const toggleCondition = (condition) => {
    setKnownConditions(prev => ({
      ...prev,
      [condition]: !prev[condition]
    }));
  };

  // Select scenario from guide
  const selectScenarioFromGuide = (scenarioId) => {
    setScenario(scenarioId);
    setShowGuide(false);
    setShowMultiPosition(false);
  };

  return (
    <div className="leverage-page">
      {/* Hero Section */}
      <div className="leverage-hero">
        <div className="leverage-hero__content">
          <div className="leverage-badge">
            <span>📊</span>
            <span>{translate('leverageCalculator.badge')}</span>
          </div>
          <h1 className="leverage-hero__title">
            {translate('leverageCalculator.title')}
          </h1>
          <p className="leverage-hero__subtitle">
            {translate('leverageCalculator.subtitle')}
          </p>

          {/* Real-time Gold Price Display */}
          <div className="leverage-price-display">
            {goldPriceLoading ? (
              <span className="leverage-price-loading">{translate('leverageCalculator.loadingPrice')}</span>
            ) : currentGoldPrice ? (
              <>
                <span className="leverage-price-label">{translate('leverageCalculator.currentGoldPrice')}</span>
                <span className="leverage-price-value">${currentGoldPrice.toFixed(2)}</span>
                <span className="leverage-price-time">{lastUpdateTime}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Scenario Selection Section */}
      <div className="leverage-scenario-section">
        <div className="leverage-container">
          <h2 className="leverage-scenario-title">{translate('leverageCalculator.scenarios.title')}</h2>
          <div className="leverage-scenario-cards">
            <div
              className={`leverage-scenario-card ${scenario === 1 ? 'active' : ''}`}
              onClick={() => setScenario(1)}
            >
              <div className="leverage-scenario-icon">📈</div>
              <h3>{translate('leverageCalculator.scenarios.scenario1.title')}</h3>
              <p>{translate('leverageCalculator.scenarios.scenario1.description')}</p>
              <div className="leverage-scenario-inputs">
                <span>• {translate('leverageCalculator.scenarios.scenario1.input1')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario1.input2')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario1.input3')}</span>
              </div>
              <div className="leverage-scenario-output">
                <strong>{translate('leverageCalculator.scenarios.scenario1.output')}</strong>
              </div>
            </div>

            <div
              className={`leverage-scenario-card ${scenario === 2 ? 'active' : ''}`}
              onClick={() => setScenario(2)}
            >
              <div className="leverage-scenario-icon">💰</div>
              <h3>{translate('leverageCalculator.scenarios.scenario2.title')}</h3>
              <p>{translate('leverageCalculator.scenarios.scenario2.description')}</p>
              <div className="leverage-scenario-inputs">
                <span>• {translate('leverageCalculator.scenarios.scenario2.input1')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario2.input2')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario2.input3')}</span>
              </div>
              <div className="leverage-scenario-output">
                <strong>{translate('leverageCalculator.scenarios.scenario2.output')}</strong>
              </div>
            </div>

            <div
              className={`leverage-scenario-card ${scenario === 3 ? 'active' : ''}`}
              onClick={() => setScenario(3)}
            >
              <div className="leverage-scenario-icon">⚠️</div>
              <h3>{translate('leverageCalculator.scenarios.scenario3.title')}</h3>
              <p>{translate('leverageCalculator.scenarios.scenario3.description')}</p>
              <div className="leverage-scenario-inputs">
                <span>• {translate('leverageCalculator.scenarios.scenario3.input1')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario3.input2')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario3.input3')}</span>
                <span>• {translate('leverageCalculator.scenarios.scenario3.input4')}</span>
              </div>
              <div className="leverage-scenario-output">
                <strong>{translate('leverageCalculator.scenarios.scenario3.output')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Guide Section */}
      {showGuide && (
        <div className="leverage-guide-section">
          <div className="leverage-container">
            <div className="leverage-guide-card">
              <div className="leverage-guide-header">
                <div>
                  <h2 className="leverage-guide-title">🎯 智能计算引导</h2>
                  <p className="leverage-guide-subtitle">选择您已知的条件，系统将为您推荐可以计算的内容</p>
                </div>
                <button className="leverage-guide-close" onClick={() => setShowGuide(false)}>
                  ✕ 关闭引导
                </button>
              </div>

              {/* Known Conditions */}
              <div className="leverage-guide-conditions">
                <h3>请勾选您已知的条件：</h3>
                <div className="leverage-conditions-grid">
                  <label className={`leverage-condition-item ${knownConditions.totalFunds ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={knownConditions.totalFunds}
                      onChange={() => toggleCondition('totalFunds')}
                    />
                    <span className="leverage-condition-icon">💰</span>
                    <span className="leverage-condition-label">账户资金</span>
                    <span className="leverage-condition-desc">我的账户有多少资金</span>
                  </label>

                  <label className={`leverage-condition-item ${knownConditions.marketPrice ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={knownConditions.marketPrice}
                      onChange={() => toggleCondition('marketPrice')}
                    />
                    <span className="leverage-condition-icon">📊</span>
                    <span className="leverage-condition-label">市场价格</span>
                    <span className="leverage-condition-desc">当前或开仓时的价格</span>
                  </label>

                  <label className={`leverage-condition-item ${knownConditions.lots ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={knownConditions.lots}
                      onChange={() => toggleCondition('lots')}
                    />
                    <span className="leverage-condition-icon">📦</span>
                    <span className="leverage-condition-label">持仓手数</span>
                    <span className="leverage-condition-desc">已开仓或计划开仓的手数</span>
                  </label>

                  <label className={`leverage-condition-item ${knownConditions.priceChange ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={knownConditions.priceChange}
                      onChange={() => toggleCondition('priceChange')}
                    />
                    <span className="leverage-condition-icon">📉</span>
                    <span className="leverage-condition-label">预期价格波动</span>
                    <span className="leverage-condition-desc">能承受的价格变动范围</span>
                  </label>

                  <label className={`leverage-condition-item ${knownConditions.leverage ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={knownConditions.leverage}
                      onChange={() => toggleCondition('leverage')}
                    />
                    <span className="leverage-condition-icon">⚡</span>
                    <span className="leverage-condition-label">杠杆倍数</span>
                    <span className="leverage-condition-desc">使用的杠杆倍数</span>
                  </label>
                </div>
              </div>

              {/* Recommended Scenarios */}
              <div className="leverage-guide-recommendations">
                <h3>
                  {recommendedScenarios.length > 0
                    ? `✅ 根据您的条件，可以计算以下内容：`
                    : `⚠️ 请至少选择足够的条件以获取计算建议`}
                </h3>

                {recommendedScenarios.length > 0 ? (
                  <div className="leverage-recommendations-grid">
                    {recommendedScenarios.map(scenario => (
                      <div key={scenario.id} className="leverage-recommendation-card">
                        <div className="leverage-recommendation-header">
                          <span className="leverage-recommendation-icon">{scenario.icon}</span>
                          <h4>{scenario.name}</h4>
                        </div>
                        <p className="leverage-recommendation-desc">{scenario.description}</p>

                        <div className="leverage-recommendation-needs">
                          <strong>需要条件：</strong>
                          <div className="leverage-recommendation-tags">
                            {scenario.needs.map((need, idx) => (
                              <span key={idx} className="leverage-recommendation-tag">{need}</span>
                            ))}
                          </div>
                        </div>

                        <div className="leverage-recommendation-output">
                          <strong>可以计算：</strong>
                          <div className="leverage-recommendation-tags output">
                            {scenario.canCalculate.map((calc, idx) => (
                              <span key={idx} className="leverage-recommendation-tag output">{calc}</span>
                            ))}
                          </div>
                        </div>

                        <button
                          className="leverage-recommendation-btn"
                          onClick={() => selectScenarioFromGuide(scenario.id)}
                        >
                          选择此方案 →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="leverage-guide-hint">
                    <p>💡 提示：</p>
                    <ul>
                      <li>想知道能开多少手？请勾选：账户资金 + 市场价格 + 预期价格波动 + 杠杆倍数</li>
                      <li>想知道需要多少资金？请勾选：市场价格 + 持仓手数 + 预期价格波动 + 杠杆倍数</li>
                      <li>想知道爆仓价格？请勾选：账户资金 + 市场价格 + 持仓手数 + 杠杆倍数</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Guide Button */}
      {!showGuide && (
        <div className="leverage-container" style={{ paddingTop: '20px' }}>
          <button className="leverage-show-guide-btn" onClick={() => setShowGuide(true)}>
            🎯 显示智能引导
          </button>
        </div>
      )}

      {/* Multi-Position Toggle */}
      <div className="leverage-container" style={{ paddingTop: '20px' }}>
        <div className="leverage-multi-toggle">
          <button
            className={`leverage-toggle-button ${!showMultiPosition ? 'active' : ''}`}
            onClick={() => { setShowMultiPosition(false); setShowGuide(false); }}
          >
            单订单模式
          </button>
          <button
            className={`leverage-toggle-button ${showMultiPosition ? 'active' : ''}`}
            onClick={() => { setShowMultiPosition(true); setShowGuide(false); }}
          >
            多订单管理
          </button>
        </div>
      </div>

      {/* Multi-Position Panel */}
      {showMultiPosition && (
        <div className="leverage-shell" style={{ paddingTop: '20px' }}>
          <div className="leverage-container">
            <div className="leverage-card leverage-card--multi">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="leverage-card__title">订单管理</h2>
                <button className="leverage-add-position-btn" onClick={addPosition}>
                  ➕ 添加订单
                </button>
              </div>

              {/* Account Funds Input */}
              <div className="leverage-input-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="totalFundsMulti">账户资金</label>
                <input
                  id="totalFundsMulti"
                  type="number"
                  value={totalFunds}
                  onChange={(e) => setTotalFunds(parseFloat(e.target.value) || 0)}
                  step="1000"
                />
              </div>

              {/* Position List */}
              <div className="leverage-positions-list">
                {positions.map((pos, index) => (
                  <div key={pos.id} className="leverage-position-item">
                    <div className="leverage-position-header">
                      <span className="leverage-position-number">订单 #{index + 1}</span>
                      {positions.length > 1 && (
                        <button
                          className="leverage-remove-position-btn"
                          onClick={() => removePosition(pos.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="leverage-position-inputs">
                      <div className="leverage-input-group">
                        <label>方向</label>
                        <select
                          value={pos.direction}
                          onChange={(e) => updatePosition(pos.id, 'direction', e.target.value)}
                          className="leverage-select"
                        >
                          <option value="long">做多 (买入)</option>
                          <option value="short">做空 (卖出)</option>
                        </select>
                      </div>

                      <div className="leverage-input-group">
                        <label>手数</label>
                        <input
                          type="number"
                          value={pos.lots}
                          onChange={(e) => updatePosition(pos.id, 'lots', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0.01"
                        />
                      </div>

                      <div className="leverage-input-group">
                        <label>开仓价格</label>
                        <input
                          type="number"
                          value={pos.entryPrice}
                          onChange={(e) => updatePosition(pos.id, 'entryPrice', parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>

                      <div className="leverage-input-group">
                        <label>杠杆</label>
                        <input
                          type="number"
                          value={pos.leverage}
                          onChange={(e) => updatePosition(pos.id, 'leverage', parseFloat(e.target.value) || 1)}
                          step="1"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Position Info */}
                    <div className="leverage-position-info">
                      <div className="leverage-position-info-item">
                        <span>保证金:</span>
                        <strong>${((pos.entryPrice * CONTRACT_SIZE * pos.lots) / pos.leverage).toFixed(2)}</strong>
                      </div>
                      <div className="leverage-position-info-item">
                        <span>盈亏:</span>
                        <strong className={
                          (pos.direction === 'long'
                            ? (marketPrice - pos.entryPrice) * CONTRACT_SIZE * pos.lots
                            : (pos.entryPrice - marketPrice) * CONTRACT_SIZE * pos.lots
                          ) >= 0 ? 'profit' : 'loss'
                        }>
                          ${(pos.direction === 'long'
                            ? (marketPrice - pos.entryPrice) * CONTRACT_SIZE * pos.lots
                            : (pos.entryPrice - marketPrice) * CONTRACT_SIZE * pos.lots
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi-Position Summary */}
              <div className="leverage-multi-summary">
                <h3>综合统计</h3>
                <div className="leverage-multi-summary-grid">
                  <div className="leverage-result-item">
                    <span className="leverage-result-label">总保证金</span>
                    <span className="leverage-result-value">${totalMargin.toFixed(2)}</span>
                  </div>
                  <div className="leverage-result-item">
                    <span className="leverage-result-label">账户资金</span>
                    <span className="leverage-result-value">${totalFunds.toFixed(2)}</span>
                  </div>
                  <div className="leverage-result-item">
                    <span className="leverage-result-label">总盈亏</span>
                    <span className={`leverage-result-value ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
                      ${totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="leverage-result-item">
                    <span className="leverage-result-label">净值</span>
                    <span className="leverage-result-value">${(totalFunds + totalPnL).toFixed(2)}</span>
                  </div>
                  <div className="leverage-result-item leverage-result-item--primary">
                    <span className="leverage-result-label">爆仓价格</span>
                    <span className="leverage-result-value leverage-result-value--large">
                      {multiLiquidationPrice > 0
                        ? `$${multiLiquidationPrice.toFixed(2)}`
                        : '完全对冲'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Section */}
      {!showMultiPosition && (
      <div className="leverage-shell">
        <div className="leverage-container">
          <div className="leverage-grid">
            <div className="leverage-stack">
              {/* Input Panel */}
              <div className="leverage-card leverage-card--inputs">
                <h2 className="leverage-card__title">{translate('leverageCalculator.inputs.title')}</h2>
                <div className="leverage-inputs">
                  {/* Show/hide inputs based on scenario */}
                  {(scenario === 1 || scenario === 3) && (
                    <div className="leverage-input-group">
                      <label htmlFor="totalFunds">{translate('leverageCalculator.inputs.totalFunds')}</label>
                      <input
                        id="totalFunds"
                        type="number"
                        value={totalFunds}
                        onChange={(e) => setTotalFunds(parseFloat(e.target.value) || 0)}
                        step="1000"
                      />
                    </div>
                  )}

                  <div className="leverage-input-group">
                    <label htmlFor="marketPrice">
                      {translate('leverageCalculator.inputs.marketPrice')}
                      <span className="leverage-input-hint">{translate('leverageCalculator.inputs.contractSize')}: {CONTRACT_SIZE}</span>
                    </label>
                    <div className="leverage-input-with-button">
                      <input
                        id="marketPrice"
                        type="number"
                        value={marketPrice}
                        onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                      {currentGoldPrice && (
                        <button
                          className="leverage-input-button"
                          onClick={() => setMarketPrice(currentGoldPrice)}
                        >
                          {translate('leverageCalculator.inputs.useLatest')}
                        </button>
                      )}
                    </div>
                  </div>

                  {(scenario === 2 || scenario === 3) && (
                    <div className="leverage-input-group">
                      <label htmlFor="lots">{translate('leverageCalculator.inputs.lots')}</label>
                      <input
                        id="lots"
                        type="number"
                        value={lots}
                        onChange={(e) => setLots(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0.01"
                      />
                    </div>
                  )}

                  {(scenario === 1 || scenario === 2) && (
                    <div className="leverage-input-group">
                      <label htmlFor="priceChange">{translate('leverageCalculator.inputs.priceChange')}</label>
                      <input
                        id="priceChange"
                        type="number"
                        value={priceChange}
                        onChange={(e) => setPriceChange(parseFloat(e.target.value) || 0)}
                        step="0.1"
                      />
                    </div>
                  )}

                  <div className="leverage-input-group">
                    <label htmlFor="leverage">{translate('leverageCalculator.inputs.leverage')}</label>
                    <div className="leverage-input-with-presets">
                      <input
                        id="leverage"
                        type="number"
                        value={leverage}
                        onChange={(e) => setLeverage(parseFloat(e.target.value) || 1)}
                        step="1"
                        min="1"
                      />
                      <div className="leverage-presets">
                        {leveragePresets.map(preset => (
                          <button
                            key={preset}
                            className={`leverage-preset-button ${leverage === preset ? 'active' : ''}`}
                            onClick={() => setLeverage(preset)}
                          >
                            {preset}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Results Panel */}
            <div className="leverage-stack leverage-stack--results">
              <div className="leverage-card leverage-card--results">
                <h2 className="leverage-card__title">{translate('leverageCalculator.results.title')}</h2>
                <div className="leverage-results">
                  {/* Scenario-specific primary results */}
                  {scenario === 1 && (
                    <div className="leverage-result-item leverage-result-item--primary">
                      <span className="leverage-result-label">{translate('leverageCalculator.results.maxLots')}</span>
                      <span className="leverage-result-value leverage-result-value--large">{maxLots.toFixed(2)}</span>
                    </div>
                  )}

                  {scenario === 2 && (
                    <div className="leverage-result-item leverage-result-item--primary">
                      <span className="leverage-result-label">{translate('leverageCalculator.results.requiredFunds')}</span>
                      <span className="leverage-result-value leverage-result-value--large">${requiredFunds.toFixed(2)}</span>
                    </div>
                  )}

                  {scenario === 3 && (
                    <div className="leverage-result-item leverage-result-item--primary">
                      <span className="leverage-result-label">{translate('leverageCalculator.results.liquidationPrice')}</span>
                      <span className="leverage-result-value leverage-result-value--large">${liquidationPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Common results - 只显示保证金和净值 */}
                  <div className="leverage-result-item">
                    <span className="leverage-result-label">{translate('leverageCalculator.results.margin')}</span>
                    <span className="leverage-result-value">${margin.toFixed(2)}</span>
                  </div>

                  <div className="leverage-result-item">
                    <span className="leverage-result-label">{translate('leverageCalculator.results.actualEquity')}</span>
                    <span className="leverage-result-value">${actualEquity.toFixed(2)}</span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default LeverageCalculator;
