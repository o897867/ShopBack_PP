import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Info, RefreshCw } from 'lucide-react';
import './WithdrawalRate.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const WithdrawalRate = () => {
  const [currentRate, setCurrentRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 更新相关状态
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateKey, setUpdateKey] = useState('');
  const [newRate, setNewRate] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // 隐藏管理功能：连续点击标题7次 或 按快捷键 Ctrl+Shift+U
  const [clickCount, setClickCount] = useState(0);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    fetchCurrentRate();

    // 监听快捷键 Ctrl+Shift+U
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        setAdminMode(true);
        console.log('🔓 Admin mode activated');
      }
      // 按 Esc 退出管理模式
      if (e.key === 'Escape' && adminMode) {
        setAdminMode(false);
        setShowUpdateForm(false);
        console.log('🔒 Admin mode deactivated');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [adminMode]);

  // 处理标题点击（隐藏功能：连续点击7次激活管理模式）
  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 7) {
      setAdminMode(true);
      setClickCount(0);
      console.log('🔓 Admin mode activated by clicks');
    }

    // 3秒后重置点击计数
    setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  const fetchCurrentRate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/withdrawal-rate`);
      if (!response.ok) throw new Error('获取汇率失败');
      const data = await response.json();
      setCurrentRate(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawal-rate/history?limit=30`);
      if (!response.ok) throw new Error('获取历史记录失败');
      const data = await response.json();
      setHistory(data.history || []);
      setShowHistory(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!updateKey || !newRate) {
      alert('请填写更新密钥和汇率');
      return;
    }

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      alert('请输入有效的汇率值');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawal-rate/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Update-Key': updateKey
        },
        body: JSON.stringify({
          rate: rate,
          currency: 'USD',
          notes: notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '更新失败');
      }

      const result = await response.json();

      // 更新成功后刷新数据
      await fetchCurrentRate();
      alert('汇率更新成功！');

      // 清空表单
      setNewRate('');
      setNotes('');
      setShowUpdateForm(false);

      // 如果显示历史记录，也刷新它
      if (showHistory) {
        await fetchHistory();
      }
    } catch (err) {
      alert('更新失败: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="withdrawal-rate-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="withdrawal-rate-page">
      <div className="withdrawal-rate-container">
        {/* 管理模式提示 */}
        {adminMode && (
          <div className="admin-mode-banner">
            <Info size={16} />
            <span>🔓 管理模式已激活 (按 Esc 退出)</span>
          </div>
        )}

        {/* 页面标题 */}
        <div className="page-header">
          <h1
            className="page-title"
            onClick={handleTitleClick}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title={clickCount > 0 ? `${clickCount}/7` : ''}
          >
            <DollarSign size={32} />
            每日出金汇率
          </h1>
          <p className="subtitle">Daily Withdrawal Exchange Rate</p>
          <p className="subtitle poetic">利流无界，此消彼长见方圆。</p>
        </div>

        {error && (
          <div className="error-banner">
            <Info size={20} />
            {error}
          </div>
        )}

        {/* 当前汇率卡片 */}
        <div className="current-rate-card">
          <div className="card-header">
            <h2>当前汇率</h2>
            <button
              className="refresh-btn"
              onClick={fetchCurrentRate}
              title="刷新"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {currentRate ? (
            <div className="rate-content">
              <div className="rate-display">
                <span className="currency">{currentRate.currency}</span>
                <span className="rate-value">
                  {currentRate.rate ? currentRate.rate.toFixed(4) : '-'}
                </span>
              </div>

              <div className="rate-info">
                <div className="info-row">
                  <Calendar size={16} />
                  <span className="label">生效日期:</span>
                  <span className="value">{formatDate(currentRate.effective_date)}</span>
                </div>

                {currentRate.last_updated && (
                  <div className="info-row">
                    <Info size={16} />
                    <span className="label">更新时间:</span>
                    <span className="value">{formatDateTime(currentRate.last_updated)}</span>
                  </div>
                )}

                {currentRate.notes && (
                  <div className="info-row notes">
                    <span className="label">备注:</span>
                    <span className="value">{currentRate.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-data">
              <Info size={24} />
              <p>暂无汇率数据</p>
            </div>
          )}
        </div>

        {/* 历史记录按钮 */}
        <div className="action-buttons">
          <button
            className="secondary-btn"
            onClick={() => {
              if (showHistory) {
                setShowHistory(false);
              } else {
                fetchHistory();
              }
            }}
          >
            {showHistory ? '隐藏历史记录' : '查看历史记录'}
          </button>

          {/* 管理员更新按钮 - 只在管理模式下显示 */}
          {adminMode && (
            <button
              className="admin-btn"
              onClick={() => setShowUpdateForm(!showUpdateForm)}
            >
              {showUpdateForm ? '取消更新' : '管理员更新'}
            </button>
          )}
        </div>

        {/* 更新表单 (隐藏功能) */}
        {showUpdateForm && (
          <div className="update-form-card">
            <h3>更新汇率</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>更新密钥 *</label>
                <input
                  type="password"
                  value={updateKey}
                  onChange={(e) => setUpdateKey(e.target.value)}
                  placeholder="请输入更新密钥"
                  required
                />
              </div>

              <div className="form-group">
                <label>新汇率 *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="例如: 7.2345"
                  required
                />
              </div>

              <div className="form-group">
                <label>备注 (可选)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例如: 央行中间价"
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={updating}
              >
                {updating ? '更新中...' : '提交更新'}
              </button>
            </form>
          </div>
        )}

        {/* 历史记录 */}
        {showHistory && (
          <div className="history-card">
            <h3>历史汇率记录</h3>

            {history.length > 0 ? (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>生效日期</th>
                      <th>汇率</th>
                      <th>货币</th>
                      <th>备注</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, index) => (
                      <tr key={index}>
                        <td>{formatDate(record.effective_date)}</td>
                        <td className="rate-cell">{record.rate.toFixed(4)}</td>
                        <td>{record.currency}</td>
                        <td className="notes-cell">{record.notes || '-'}</td>
                        <td>{formatDateTime(record.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>暂无历史记录</p>
              </div>
            )}
          </div>
        )}

        {/* 说明信息 */}
        <div className="info-footer">
          <Info size={16} />
          <p>汇率数据仅供参考，实际出金汇率以银行实时汇率为准</p>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRate;
