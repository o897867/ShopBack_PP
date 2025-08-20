import React, { useState } from 'react';
import './LeverageCalculator.css';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations';

const LeverageCalculator = () => {
  const { currentLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    symbol: 'BTCUSDT',
    direction: 'long',
    principal: 1000,
    leverage: 10,
    entryPrice: 50000,
    currentPrice: 50000,
    positionSize: '',
    useMaxPosition: true
  });

  const [targetLoss, setTargetLoss] = useState(200);
  const [analysis, setAnalysis] = useState(null);
  const [targetLossResult, setTargetLossResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'direction' ? value : (value === '' ? '' : parseFloat(value) || 0)
    }));
  };

  const calculateLeverage = async () => {
    setLoading(true);
    try {
      const requestBody = {
        symbol: formData.symbol,
        direction: formData.direction,
        principal: formData.principal,
        leverage: formData.leverage,
        entry_price: formData.entryPrice,
        current_price: formData.currentPrice
      };
      
      // 只有在使用自定义仓位时才添加position_size
      if (!formData.useMaxPosition && formData.positionSize) {
        requestBody.position_size = parseFloat(formData.positionSize);
      }
      
      const response = await fetch('http://localhost:8001/api/leverage/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('计算失败');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('计算错误:', error);
      alert('计算失败，请检查输入参数');
    } finally {
      setLoading(false);
    }
  };

  const calculateTargetLoss = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/leverage/target-loss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          direction: formData.direction,
          principal: formData.principal,
          leverage: formData.leverage,
          entry_price: formData.entryPrice,
          max_loss_amount: targetLoss
        })
      });

      if (!response.ok) throw new Error('计算失败');
      
      const data = await response.json();
      setTargetLossResult(data);
    } catch (error) {
      console.error('计算错误:', error);
      alert('计算失败，请检查输入参数');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  return (
    <div className="leverage-calculator">
      <div className="calculator-header">
        <h2>{t('leverage.title', currentLanguage)}</h2>
        <div className="tabs">
          <button 
            className={activeTab === 'calculator' ? 'active' : ''}
            onClick={() => setActiveTab('calculator')}
          >
            {t('leverage.comprehensiveAnalysis', currentLanguage)}
          </button>
          <button 
            className={activeTab === 'target-loss' ? 'active' : ''}
            onClick={() => setActiveTab('target-loss')}
          >
            {t('leverage.stopLossCalculation', currentLanguage)}
          </button>
        </div>
      </div>

      <div className="calculator-content">
        <div className="input-section">
          <h3>{t('leverage.tradingParameters', currentLanguage)}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('leverage.tradingPair', currentLanguage)}</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="例如: BTCUSDT"
              />
            </div>

            <div className="form-group">
              <label>{t('leverage.direction', currentLanguage)}</label>
              <select name="direction" value={formData.direction} onChange={handleInputChange}>
                <option value="long">{t('leverage.long', currentLanguage)}</option>
                <option value="short">{t('leverage.short', currentLanguage)}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('leverage.principal', currentLanguage)}</label>
              <input
                type="number"
                name="principal"
                value={formData.principal}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label>{t('leverage.leverage', currentLanguage)}</label>
              <input
                type="number"
                name="leverage"
                value={formData.leverage}
                onChange={handleInputChange}
                min="1"
                max="125"
                step="1"
              />
            </div>

            <div className="form-group">
              <label>{t('leverage.entryPrice', currentLanguage)}</label>
              <input
                type="number"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>{t('leverage.positionSize', currentLanguage)}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.useMaxPosition}
                    onChange={(e) => setFormData(prev => ({ ...prev, useMaxPosition: e.target.checked }))}
                    style={{ marginRight: '5px' }}
                  />
                  {t('leverage.useMaxPosition', currentLanguage)}
                </label>
              </div>
              {!formData.useMaxPosition && (
                <div>
                  <input
                    type="number"
                    name="positionSize"
                    value={formData.positionSize}
                    onChange={handleInputChange}
                    min="0"
                    step="0.0001"
                    placeholder={t('leverage.customPositionPlaceholder', currentLanguage)}
                    style={{ marginTop: '5px' }}
                  />
                  {formData.principal && formData.leverage && formData.entryPrice && (
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      {t('leverage.maxAvailable', currentLanguage)}: {(formData.principal * formData.leverage / formData.entryPrice).toFixed(4)}
                    </small>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'calculator' && (
              <div className="form-group">
                <label>{t('leverage.currentPrice', currentLanguage)}</label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {activeTab === 'target-loss' && (
              <div className="form-group">
                <label>{t('leverage.maxLossAmount', currentLanguage)}</label>
                <input
                  type="number"
                  value={targetLoss}
                  onChange={(e) => setTargetLoss(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="10"
                />
              </div>
            )}
          </div>

          <div className="button-group">
            {activeTab === 'calculator' && (
              <button 
                className="calculate-btn"
                onClick={calculateLeverage}
                disabled={loading}
              >
                {loading ? t('leverage.calculating', currentLanguage) : t('leverage.calculate', currentLanguage)}
              </button>
            )}
            {activeTab === 'target-loss' && (
              <button 
                className="calculate-btn"
                onClick={calculateTargetLoss}
                disabled={loading}
              >
                {loading ? t('leverage.calculating', currentLanguage) : t('leverage.calculateStopLoss', currentLanguage)}
              </button>
            )}
          </div>
        </div>

        {/* 综合分析结果 */}
        {activeTab === 'calculator' && analysis && (
          <div className="results-section">
            <h3>{t('leverage.analysisResults', currentLanguage)}</h3>
            
            {/* 持仓信息 */}
            <div className="result-card">
              <h4>{t('leverage.positionInfo', currentLanguage)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">总仓位价值:</span>
                  <span className="value">${formatNumber(analysis.position_info.total_position_value)}</span>
                </div>
                <div className="info-item">
                  <span className="label">仓位大小:</span>
                  <span className="value">{formatNumber(analysis.position_info.position_size)}</span>
                </div>
              </div>
            </div>

            {/* 强制平仓信息 */}
            <div className="result-card warning">
              <h4>强制平仓信息（保证金40%）</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">强平价格:</span>
                  <span className="value danger">${formatPrice(analysis.liquidation_info.liquidation_price)}</span>
                </div>
                <div className="info-item">
                  <span className="label">价格需要{analysis.liquidation_info.direction_description}:</span>
                  <span className="value">{formatNumber(analysis.liquidation_info.price_change_percentage)}%</span>
                </div>
                <div className="info-item">
                  <span className="label">价格变动:</span>
                  <span className="value">${formatNumber(analysis.liquidation_info.price_change)}</span>
                </div>
              </div>
            </div>

            {/* 当前盈亏 */}
            {analysis.current_pnl && (
              <div className={`result-card ${analysis.current_pnl.pnl_amount >= 0 ? 'success' : 'danger'}`}>
                <h4>当前盈亏</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">盈亏金额:</span>
                    <span className={`value ${analysis.current_pnl.pnl_amount >= 0 ? 'profit' : 'loss'}`}>
                      ${formatNumber(analysis.current_pnl.pnl_amount)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">盈亏比例:</span>
                    <span className={`value ${analysis.current_pnl.pnl_percentage >= 0 ? 'profit' : 'loss'}`}>
                      {formatNumber(analysis.current_pnl.pnl_percentage)}%
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">保证金比例:</span>
                    <span className="value">{formatNumber(analysis.current_pnl.margin_ratio * 100)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">当前权益:</span>
                    <span className="value">${formatNumber(analysis.current_pnl.current_equity)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 风险级别 */}
            <div className="result-card">
              <h4>风险级别参考</h4>
              <div className="risk-levels">
                {Object.entries(analysis.risk_levels).map(([level, info]) => (
                  <div key={level} className="risk-level-item">
                    <div className="risk-level-header">
                      <span className="level-name">{level === 'liquidation' ? '强制平仓' : level}</span>
                      <span className="level-price">${formatPrice(info.price)}</span>
                    </div>
                    <div className="risk-level-details">
                      <span>亏损: ${formatNumber(info.loss_amount)}</span>
                      <span>保证金: {formatNumber(info.margin_ratio * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 止损计算结果 */}
        {activeTab === 'target-loss' && targetLossResult && (
          <div className="results-section">
            <h3>止损计算结果</h3>
            
            <div className="result-card">
              <h4>目标止损位置</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">止损价格:</span>
                  <span className="value danger">${formatPrice(targetLossResult.target_price)}</span>
                </div>
                <div className="info-item">
                  <span className="label">最大亏损金额:</span>
                  <span className="value">${formatNumber(targetLossResult.max_loss_amount)}</span>
                </div>
                <div className="info-item">
                  <span className="label">价格变动:</span>
                  <span className="value">${formatNumber(targetLossResult.price_change)}</span>
                </div>
                <div className="info-item">
                  <span className="label">价格变动百分比:</span>
                  <span className="value">{formatNumber(targetLossResult.price_change_percentage)}%</span>
                </div>
              </div>
            </div>

            {targetLossResult.pnl_info && (
              <div className="result-card warning">
                <h4>该价格下的详细信息</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">保证金比例:</span>
                    <span className="value">{formatNumber(targetLossResult.pnl_info.margin_ratio * 100)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">剩余权益:</span>
                    <span className="value">${formatNumber(targetLossResult.pnl_info.current_equity)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">是否触发强平:</span>
                    <span className={`value ${targetLossResult.pnl_info.is_liquidated ? 'danger' : 'safe'}`}>
                      {targetLossResult.pnl_info.is_liquidated ? '是' : '否'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeverageCalculator;