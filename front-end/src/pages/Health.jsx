import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations/index';
import './Health.css';
import api from '../services/api';

const Health = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const [profile, setProfile] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [caloriesBudget, setCaloriesBudget] = useState({
    budget: 2000,
    spent: 0,
    remaining: 2000
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Mock user email (should come from auth context in production)
  const userEmail = 'user@example.com';

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      // Load profile
      const profileRes = await api.get(`/api/health/profile?user_email=${userEmail}`);
      if (profileRes.data.success && profileRes.data.profile) {
        setProfile(profileRes.data.profile);
        setTargetWeight(profileRes.data.profile.target_weight || '');
        setTargetDate(profileRes.data.profile.target_date || '');
      }

      // Load weight history
      const historyRes = await api.get(`/api/health/weight-history?user_email=${userEmail}&days=30`);
      if (historyRes.data.success) {
        setWeightHistory(historyRes.data.history || []);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightLog = async () => {
    if (!weightInput) return;

    try {
      const response = await api.post(`/api/health/weight-log?user_email=${userEmail}`, {
        weight_kg: parseFloat(weightInput),
        log_date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        setTodayLog({
          weight: parseFloat(weightInput),
          logged: true,
          analysis: response.data.market_analysis
        });
        loadHealthData(); // Reload data
        setWeightInput('');
      }
    } catch (error) {
      console.error('Error logging weight:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await api.post(`/api/health/profile?user_email=${userEmail}`, {
        target_weight: parseFloat(targetWeight),
        target_date: targetDate,
        target_type: parseFloat(targetWeight) < profile?.current_weight ? 'loss' : 'gain'
      });

      if (response.data.success) {
        loadHealthData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const calculateProgress = () => {
    if (!profile?.target_weight || !profile?.current_weight || weightHistory.length === 0) {
      return 0;
    }

    const startWeight = weightHistory[0]?.weight_kg || profile.current_weight;
    const currentWeight = weightHistory[weightHistory.length - 1]?.weight_kg || profile.current_weight;
    const targetDiff = Math.abs(profile.target_weight - startWeight);
    const currentDiff = Math.abs(currentWeight - startWeight);

    return targetDiff > 0 ? Math.min((currentDiff / targetDiff) * 100, 100) : 0;
  };

  const getMarketTrend = () => {
    if (weightHistory.length < 2) return 'Consolidating';

    const recent = weightHistory.slice(-7);
    const avgChange = recent.reduce((sum, log, i) => {
      if (i === 0) return sum;
      return sum + (log.weight_kg - recent[i-1].weight_kg);
    }, 0) / Math.max(recent.length - 1, 1);

    if (avgChange < -0.1) return translate('health.weight.bullish');
    if (avgChange > 0.1) return translate('health.weight.bearish');
    return translate('health.weight.consolidation');
  };

  const renderDashboard = () => (
    <div className="health-dashboard">
      {/* Market Status Card */}
      <div className="health-card market-status">
        <h3>{translate('health.marketStatus')}</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">{translate('health.currentPosition')}</span>
            <span className="value">{profile?.current_weight || '--'} kg</span>
          </div>
          <div className="status-item">
            <span className="label">{translate('health.targetPosition')}</span>
            <span className="value">{profile?.target_weight || '--'} kg</span>
          </div>
          <div className="status-item">
            <span className="label">{translate('health.trend')}</span>
            <span className={`value trend ${getMarketTrend().toLowerCase()}`}>
              {getMarketTrend()}
            </span>
          </div>
          <div className="status-item">
            <span className="label">{translate('health.daysToTarget')}</span>
            <span className="value">
              {profile?.target_date ?
                Math.max(0, Math.floor((new Date(profile.target_date) - new Date()) / (1000 * 60 * 60 * 24)))
                : '--'
              } days
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-label">
            {translate('health.progressToTarget')}: {calculateProgress().toFixed(1)}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Log Card */}
      <div className="health-card daily-log">
        <h3>{translate('health.dailyLog')}</h3>

        {!todayLog ? (
          <div className="log-form">
            <input
              type="number"
              step="0.1"
              placeholder={translate('health.enterWeight')}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="weight-input"
            />
            <button onClick={handleWeightLog} className="btn-primary">
              {translate('health.logWeight')}
            </button>
          </div>
        ) : (
          <div className="log-success">
            <div className="success-icon">✓</div>
            <p>{translate('health.weightLogged')}: {todayLog.weight} kg</p>
            {todayLog.analysis && (
              <div className="analysis-badge">
                {todayLog.analysis.signal}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calorie Budget Card */}
      <div className="health-card calorie-budget">
        <h3>{translate('health.calories.budget')}</h3>
        <div className="budget-display">
          <div className="budget-circle">
            <div className="budget-value">
              {caloriesBudget.remaining}
              <span className="budget-unit">kcal</span>
            </div>
            <div className="budget-label">{translate('health.calories.remaining')}</div>
          </div>

          <div className="budget-details">
            <div className="budget-item">
              <span>{translate('health.calories.dailyBudget')}</span>
              <span>{caloriesBudget.budget} kcal</span>
            </div>
            <div className="budget-item">
              <span>{translate('health.calories.burned')}</span>
              <span className="burned">{caloriesBudget.spent} kcal</span>
            </div>
            <div className="budget-item">
              <span>{translate('health.riskLevel')}</span>
              <span className={`risk ${caloriesBudget.remaining > 1000 ? 'safe' : 'warning'}`}>
                {caloriesBudget.remaining > 1000 ? 'Safe' : 'Warning'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="health-card quick-actions">
        <h3>{translate('health.quickActions')}</h3>
        <div className="action-buttons">
          <button
            className="action-btn match-game"
            onClick={() => onNavigate('health-match')}
          >
            <span className="action-icon">📊</span>
            <span className="action-label">{translate('health.matchKline')}</span>
            <span className="action-desc">{translate('health.matchDesc')}</span>
          </button>

          <button className="action-btn log-training">
            <span className="action-icon">💪</span>
            <span className="action-label">{translate('health.logTraining')}</span>
            <span className="action-desc">{translate('health.burnCalories')}</span>
          </button>

          <button className="action-btn view-stats">
            <span className="action-icon">📈</span>
            <span className="action-label">{translate('health.viewStats')}</span>
            <span className="action-desc">{translate('health.analytics')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTargets = () => (
    <div className="health-targets">
      <div className="health-card">
        <h3>{translate('health.setTargets')}</h3>

        <div className="target-form">
          <div className="form-group">
            <label>{translate('health.targetWeight')}</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="e.g., 70"
            />
          </div>

          <div className="form-group">
            <label>{translate('health.targetDate')}</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button onClick={handleProfileUpdate} className="btn-primary">
            {translate('health.updateTargets')}
          </button>
        </div>

        {profile?.target_weight && profile?.current_weight && (
          <div className="target-analysis">
            <h4>{translate('health.analysis')}</h4>
            <div className="analysis-grid">
              <div className="analysis-item">
                <span>{translate('health.requiredChange')}</span>
                <span className="value">
                  {Math.abs(profile.target_weight - profile.current_weight).toFixed(1)} kg
                </span>
              </div>
              <div className="analysis-item">
                <span>{translate('health.dailyTarget')}</span>
                <span className="value">
                  {profile.target_date ?
                    (Math.abs(profile.target_weight - profile.current_weight) /
                     Math.max(1, Math.floor((new Date(profile.target_date) - new Date()) / (1000 * 60 * 60 * 24))) * 1000).toFixed(0)
                    : '--'
                  } g/day
                </span>
              </div>
              <div className="analysis-item">
                <span>{translate('health.riskTolerance')}</span>
                <span className={`value ${profile.risk_tolerance}`}>
                  {translate(`health.risk.${profile.risk_tolerance || 'moderate'}`)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="health-loading">{translate('common.loading')}...</div>;
  }

  return (
    <div className="health-container">
      {/* Header */}
      <div className="health-header">
        <h1>{translate('health.title')}</h1>
        <p className="subtitle">{translate('health.subtitle')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="health-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {translate('health.tabs.dashboard')}
        </button>
        <button
          className={`tab ${activeTab === 'targets' ? 'active' : ''}`}
          onClick={() => setActiveTab('targets')}
        >
          {translate('health.tabs.targets')}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {translate('health.tabs.history')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="health-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'targets' && renderTargets()}
        {activeTab === 'history' && (
          <div className="health-history">
            <h3>{translate('health.weightHistory')}</h3>
            {/* Weight history chart would go here */}
            <p>Chart coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Health;