import React, { useState } from 'react';
import './LeverageCalculator.css';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations';
import { API_BASE_URL } from '../config/api.js';

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
      
      const response = await fetch(`${API_BASE_URL}/api/leverage/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('CALC_FAILED');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Calculation error:', error);
      alert(t('messages.operationFailed', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const calculateTargetLoss = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leverage/target-loss`, {
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

      if (!response.ok) throw new Error('CALC_FAILED');
      
      const data = await response.json();
      setTargetLossResult(data);
    } catch (error) {
      console.error('Calculation error:', error);
      alert(t('messages.operationFailed', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat(currentLanguage, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat(currentLanguage, {
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
                placeholder={t('leverage.symbolPlaceholder', currentLanguage)}
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

        {/* Analysis Results */}
        {activeTab === 'calculator' && analysis && (
          <div className="results-section">
            <h3>{t('leverage.analysisResults', currentLanguage)}</h3>
            
            {/* Position info */}
            <div className="result-card">
              <h4>{t('leverage.positionInfo', currentLanguage)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('leverage.totalPositionValue', currentLanguage)}:</span>
                  <span className="value">${formatNumber(analysis.position_info.total_position_value)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.positionSizeLots', currentLanguage)}:</span>
                  <span className="value">{formatNumber(analysis.position_info.position_size)}</span>
                </div>
              </div>
            </div>

            {/* Liquidation info */}
            <div className="result-card warning">
              <h4>{t('leverage.liquidationInfo', currentLanguage)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('leverage.liquidationPrice', currentLanguage)}:</span>
                  <span className="value danger">${formatPrice(analysis.liquidation_info.liquidation_price)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.priceNeedsToMove', currentLanguage)} {analysis.liquidation_info.price_change >= 0 ? t('leverage.up', currentLanguage) : t('leverage.down', currentLanguage)}:</span>
                  <span className="value">{formatNumber(analysis.liquidation_info.price_change_percentage)}%</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.priceChange', currentLanguage)}:</span>
                  <span className="value">${formatNumber(analysis.liquidation_info.price_change)}</span>
                </div>
              </div>
            </div>

            {/* Current P&L */}
            {analysis.current_pnl && (
              <div className={`result-card ${analysis.current_pnl.pnl_amount >= 0 ? 'success' : 'danger'}`}>
                <h4>{t('leverage.currentPnl', currentLanguage)}</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">{t('leverage.pnlAmount', currentLanguage)}:</span>
                    <span className={`value ${analysis.current_pnl.pnl_amount >= 0 ? 'profit' : 'loss'}`}>
                      ${formatNumber(analysis.current_pnl.pnl_amount)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">{t('leverage.pnlPercentage', currentLanguage)}:</span>
                    <span className={`value ${analysis.current_pnl.pnl_percentage >= 0 ? 'profit' : 'loss'}`}>
                      {formatNumber(analysis.current_pnl.pnl_percentage)}%
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">{t('leverage.marginLevel', currentLanguage)}:</span>
                    <span className="value">{formatNumber(analysis.current_pnl.margin_ratio * 100)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">{t('leverage.currentEquity', currentLanguage)}:</span>
                    <span className="value">${formatNumber(analysis.current_pnl.current_equity)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk levels */}
            <div className="result-card">
              <h4>{t('leverage.riskLevels', currentLanguage)}</h4>
              <div className="risk-levels">
                {Object.entries(analysis.risk_levels).map(([level, info]) => (
                  <div key={level} className="risk-level-item">
                    <div className="risk-level-header">
                      <span className="level-name">{level === 'liquidation' ? t('leverage.liquidation', currentLanguage) : level}</span>
                      <span className="level-price">${formatPrice(info.price)}</span>
                    </div>
                    <div className="risk-level-details">
                      <span>{t('leverage.pnlAmount', currentLanguage)}: ${formatNumber(info.loss_amount)}</span>
                      <span>{t('leverage.marginLevel', currentLanguage)}: {formatNumber(info.margin_ratio * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stop loss calculation results */}
        {activeTab === 'target-loss' && targetLossResult && (
          <div className="results-section">
            <h3>{t('leverage.stopLossResults', currentLanguage)}</h3>
            
            <div className="result-card">
              <h4>{t('leverage.targetStopLoss', currentLanguage)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('leverage.stopLossPrice', currentLanguage)}:</span>
                  <span className="value danger">${formatPrice(targetLossResult.target_price)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.maxLossAmountLabel', currentLanguage)}:</span>
                  <span className="value">${formatNumber(targetLossResult.max_loss_amount)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.priceChange', currentLanguage)}:</span>
                  <span className="value">${formatNumber(targetLossResult.price_change)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('leverage.priceChangePercentage', currentLanguage)}:</span>
                  <span className="value">{formatNumber(targetLossResult.price_change_percentage)}%</span>
                </div>
              </div>
            </div>

            {targetLossResult.pnl_info && (
              <div className="result-card warning">
                <h4>{t('leverage.detailsAtPrice', currentLanguage)}</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">{t('leverage.marginLevel', currentLanguage)}:</span>
                    <span className="value">{formatNumber(targetLossResult.pnl_info.margin_ratio * 100)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">{t('leverage.remainingEquity', currentLanguage)}:</span>
                    <span className="value">${formatNumber(targetLossResult.pnl_info.current_equity)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">{t('leverage.triggerLiquidation', currentLanguage)}:</span>
                    <span className={`value ${targetLossResult.pnl_info.is_liquidated ? 'danger' : 'safe'}`}>
                      {targetLossResult.pnl_info.is_liquidated ? t('leverage.yes', currentLanguage) : t('leverage.no', currentLanguage)}
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
