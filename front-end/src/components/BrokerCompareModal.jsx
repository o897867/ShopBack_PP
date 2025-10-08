import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { useBrokerComparisonContext } from '../hooks/useBrokerComparison.jsx';
import brokerComparisonService from '../services/brokerComparisonService.js';

const BrokerCompareModal = () => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const {
    showComparison,
    comparisonData,
    closeComparison,
    selectedBrokers,
    removeBroker,
    isLoading
  } = useBrokerComparisonContext();

  const [formattedData, setFormattedData] = useState(null);

  // 处理对比数据格式化
  useEffect(() => {
    if (comparisonData) {
      const formatted = brokerComparisonService.formatComparisonData(comparisonData);
      setFormattedData(formatted);
    }
  }, [comparisonData]);


  if (!showComparison) return null;

  const handleRemoveBroker = (brokerId) => {
    removeBroker(brokerId);
  };

  const renderComparisonTable = () => {
    if (!formattedData) return null;

    const { tableData, brokers } = formattedData;

    return (
      <div className="bh-comparison-table">
        {/* 表头 - Broker信息 */}
        <div className="bh-comparison-header">
          <div className="bh-comparison-label-col">{translate('brokerComparison.comparisonItems')}</div>
          {brokers.map(broker => (
            <div key={broker.id} className="bh-comparison-broker-col">
              <div className="bh-broker-header">
                <button
                  className="bh-remove-broker"
                  onClick={() => handleRemoveBroker(broker.id)}
                  title={translate('brokerComparison.removeBroker')}
                >
                  ×
                </button>
                {broker.logo_url && (
                  <img
                    src={broker.logo_url}
                    alt={`${broker.name} logo`}
                    className="bh-comparison-logo"
                  />
                )}
                <div className="bh-broker-info">
                  <h3>{broker.name}</h3>
                  <span className="bh-overall-rating">{broker.rating || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 对比表格内容 */}
        <div className="bh-comparison-content">
          {tableData.map(category => (
            <div key={category.category} className="bh-comparison-category">
              <div className="bh-comparison-category-header">
                <h4>{category.label}</h4>
              </div>

              {category.rows.map(row => (
                <div key={row.field} className="bh-comparison-row">
                  <div className="bh-comparison-label">
                    {row.label}
                  </div>
                  {row.values.map((value, index) => (
                    <div
                      key={`${row.field}-${value.brokerId}`}
                      className={`bh-comparison-value ${value.isBest ? 'bh-best-value' : ''}`}
                    >
                      {renderComparisonValue(value)}
                      {value.isBest && (
                        <span className="bh-best-indicator">🏆</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonValue = (valueData) => {
    const { value, isUrl, isScore, isNumber, isText, isGrade } = valueData;

    if (value === null || value === undefined || value === 'N/A') {
      return <span className="bh-na-value">N/A</span>;
    }

    if (isUrl && value !== 'N/A') {
      return (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bh-link-value"
        >
          {value}
        </a>
      );
    }

    if (isScore || isNumber) {
      return (
        <span className="bh-score-value">
          {parseFloat(value).toFixed(1)}
        </span>
      );
    }

    if (isGrade) {
      return (
        <span className="bh-grade-value">
          {value}
        </span>
      );
    }

    return <span className="bh-text-value">{value}</span>;
  };

  const renderSummary = () => {
    if (!formattedData) return null;

    const summary = brokerComparisonService.generateComparisonSummary(formattedData);

    return (
      <div className="bh-comparison-summary">
        <h4>{translate('brokerComparison.summary')}</h4>
        <p>{summary}</p>
      </div>
    );
  };

  return (
    <div className="bh-modal-overlay" onClick={closeComparison}>
      <div className="bh-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 弹窗头部 */}
        <div className="bh-modal-header">
          <div className="bh-modal-title">
            <h2>{translate('brokerComparison.title')}</h2>
            <span className="bh-modal-subtitle">
              {translate('brokerComparison.subtitle', { count: selectedBrokers.length })}
            </span>
          </div>
          <button
            className="bh-modal-close"
            onClick={closeComparison}
            aria-label={translate('brokerComparison.closeComparison')}
          >
            ×
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="bh-modal-body">
          {isLoading ? (
            <div className="bh-loading-container">
              <div className="bh-loading-spinner"></div>
              <p>{translate('brokerComparison.loading')}</p>
            </div>
          ) : comparisonData ? (
            <>
              {renderSummary()}
              {renderComparisonTable()}
            </>
          ) : (
            <div className="bh-empty-state">
              <p>{translate('brokerComparison.noData')}</p>
            </div>
          )}
        </div>

        {/* 弹窗底部 */}
        <div className="bh-modal-footer">
          <div className="bh-modal-actions">
            <button
              className="btn btn-ghost"
              onClick={closeComparison}
            >
              关闭
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                selectedBrokers.forEach(broker => removeBroker(broker.id));
                closeComparison();
              }}
            >
              清空选择
            </button>
          </div>
          <div className="bh-modal-tips">
            <span className="bh-tip">{translate('brokerComparison.tip')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerCompareModal;