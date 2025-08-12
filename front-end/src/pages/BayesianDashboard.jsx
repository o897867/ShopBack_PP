import React, { useState, useEffect } from 'react';
import { useBayesianModel, useBayesianComparison, useModelAutoUpdate } from '../hooks/useBayesianModel';
import PredictionCard from '../components/PredictionCard';
import ProbabilityChart from '../components/ProbabilityChart';
import ModelConfidence from '../components/ModelConfidence';
import { formatPredictionSummary } from '../utils/dataProcessing';
import './BayesianDashboard.css';

const BayesianDashboard = () => {
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [insights, setInsights] = useState([]);
  const [viewMode, setViewMode] = useState('overview');
  
  const { 
    model, 
    predictions, 
    loading, 
    error, 
    updateModelWithNewData,
    modelConfidence 
  } = useBayesianModel(selectedStore);
  
  const { isUpdating, lastUpdate, updateCount } = useModelAutoUpdate(predictions);
  
  useEffect(() => {
    fetchStores();
  }, []);
  
  useEffect(() => {
    if (predictions) {
      const summary = formatPredictionSummary(predictions.predictions);
      setInsights(summary.recommendations);
    }
  }, [predictions]);
  
  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };
  
  const handleStoreChange = (storeId) => {
    setSelectedStore(storeId === 'all' ? null : parseInt(storeId));
  };
  
  const handleManualUpdate = async () => {
    try {
      const response = await fetch('/api/predictions/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: selectedStore })
      });
      
      if (response.ok) {
        // Refresh predictions after retraining
        setTimeout(() => {
          updateModelWithNewData();
        }, 2000);
      }
    } catch (err) {
      console.error('Manual update failed:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Bayesian prediction model...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error loading predictions: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="bayesian-dashboard">
      <div className="dashboard-header">
        <h1>Cashback Prediction Dashboard</h1>
        <p className="dashboard-subtitle">
          AI-powered predictions using self-adaptive Bayesian modeling
        </p>
      </div>
      
      <div className="dashboard-controls">
        <div className="store-selector">
          <label htmlFor="store-select">Select Store:</label>
          <select 
            id="store-select"
            value={selectedStore || 'all'}
            onChange={(e) => handleStoreChange(e.target.value)}
          >
            <option value="all">All Stores (Global Model)</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.platform})
              </option>
            ))}
          </select>
        </div>
        
        <div className="view-controls">
          <button 
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button 
            className={viewMode === 'detailed' ? 'active' : ''}
            onClick={() => setViewMode('detailed')}
          >
            Detailed Analysis
          </button>
          <button 
            className={viewMode === 'comparison' ? 'active' : ''}
            onClick={() => setViewMode('comparison')}
          >
            Compare Stores
          </button>
        </div>
        
        <button 
          className="update-button"
          onClick={handleManualUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Manual Update'}
        </button>
      </div>
      
      {predictions && viewMode === 'overview' && (
        <div className="dashboard-content">
          <div className="prediction-grid">
            <PredictionCard
              title="Next Rate Change"
              prediction={`${predictions.predictions.nextChange.expectedDays} days`}
              confidence={predictions.predictions.nextChange.probabilities.within14Days * 100}
              icon="📅"
              color="blue"
              details={[
                { 
                  label: '50% confidence', 
                  value: `${predictions.predictions.nextChange.confidenceIntervals.days50} days` 
                },
                { 
                  label: '95% confidence', 
                  value: `${predictions.predictions.nextChange.confidenceIntervals.days95} days` 
                },
                {
                  label: 'Predicted Date',
                  value: new Date(predictions.predictions.nextChange.predictedDate).toLocaleDateString()
                }
              ]}
            />
            
            <PredictionCard
              title="Expected Change"
              prediction={`${predictions.predictions.magnitude.expectedChange > 0 ? '+' : ''}${predictions.predictions.magnitude.expectedChange}%`}
              confidence={modelConfidence}
              icon="📊"
              color="green"
              details={[
                { 
                  label: 'Std Deviation', 
                  value: `±${predictions.predictions.magnitude.standardDeviation}%` 
                },
                { 
                  label: '95% CI Lower', 
                  value: `${predictions.predictions.magnitude.confidenceInterval95.lower}%` 
                },
                { 
                  label: '95% CI Upper', 
                  value: `${predictions.predictions.magnitude.confidenceInterval95.upper}%` 
                }
              ]}
            />
            
            <PredictionCard
              title="Upsize Probability"
              prediction={`${predictions.predictions.upsizeProbability.probability}%`}
              confidence={predictions.predictions.upsizeProbability.confidence}
              icon="🚀"
              color="purple"
              details={[
                { 
                  label: 'Confidence', 
                  value: `${predictions.predictions.upsizeProbability.confidence}%` 
                },
                { 
                  label: 'Historical Rate', 
                  value: `${Math.round(predictions.posteriors.upsizeProbability.alpha / (predictions.posteriors.upsizeProbability.alpha + predictions.posteriors.upsizeProbability.beta) * 100)}%` 
                }
              ]}
            />
          </div>
          
          <div className="charts-section">
            <ProbabilityChart 
              probabilities={predictions.predictions.nextChange.probabilities}
              title="Probability of Rate Change"
            />
            
            <ModelConfidence
              confidence={modelConfidence}
              observationCount={predictions.observationCount}
              lastUpdate={lastUpdate || predictions.lastUpdate}
              isUpdating={isUpdating}
            />
          </div>
          
          {insights.length > 0 && (
            <div className="insights-section">
              <h2>AI Insights & Recommendations</h2>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    <span className="insight-icon">💡</span>
                    <span className="insight-text">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="model-stats">
            <h3>Model Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Observations</span>
                <span className="stat-value">{predictions.observationCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Last Update</span>
                <span className="stat-value">
                  {new Date(predictions.lastUpdate).toLocaleString()}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Auto Updates</span>
                <span className="stat-value">{updateCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Model Version</span>
                <span className="stat-value">v1.0 Adaptive</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'detailed' && (
        <DetailedAnalysisView 
          predictions={predictions}
          model={model}
        />
      )}
      
      {viewMode === 'comparison' && (
        <StoreComparisonView 
          stores={stores}
        />
      )}
    </div>
  );
};

const DetailedAnalysisView = ({ predictions, model }) => {
  if (!predictions || !model) return null;
  
  return (
    <div className="detailed-analysis">
      <h2>Detailed Bayesian Analysis</h2>
      
      <div className="analysis-section">
        <h3>Prior Distributions</h3>
        <div className="distribution-grid">
          <div className="distribution-card">
            <h4>Time to Change (Gamma)</h4>
            <p>α = {predictions.posteriors.timeToChange.alpha.toFixed(2)}</p>
            <p>β = {predictions.posteriors.timeToChange.beta.toFixed(2)}</p>
          </div>
          <div className="distribution-card">
            <h4>Magnitude (Normal-Gamma)</h4>
            <p>μ₀ = {predictions.posteriors.magnitudeChange.mu0.toFixed(2)}</p>
            <p>κ₀ = {predictions.posteriors.magnitudeChange.kappa0.toFixed(2)}</p>
            <p>α₀ = {predictions.posteriors.magnitudeChange.alpha0.toFixed(2)}</p>
            <p>β₀ = {predictions.posteriors.magnitudeChange.beta0.toFixed(2)}</p>
          </div>
          <div className="distribution-card">
            <h4>Upsize (Beta)</h4>
            <p>α = {predictions.posteriors.upsizeProbability.alpha.toFixed(2)}</p>
            <p>β = {predictions.posteriors.upsizeProbability.beta.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Prediction Intervals</h3>
        <table className="intervals-table">
          <thead>
            <tr>
              <th>Confidence Level</th>
              <th>Days to Change</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>50%</td>
              <td>{predictions.predictions.nextChange.confidenceIntervals.days50} days</td>
              <td>{(predictions.predictions.nextChange.probabilities.within7Days * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>75%</td>
              <td>{predictions.predictions.nextChange.confidenceIntervals.days75} days</td>
              <td>{(predictions.predictions.nextChange.probabilities.within14Days * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>95%</td>
              <td>{predictions.predictions.nextChange.confidenceIntervals.days95} days</td>
              <td>{(predictions.predictions.nextChange.probabilities.within30Days * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StoreComparisonView = ({ stores }) => {
  const [selectedStores, setSelectedStores] = useState([]);
  const { comparisons, loading, error } = useBayesianComparison(selectedStores);
  
  const handleStoreSelect = (storeId) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter(id => id !== storeId));
    } else if (selectedStores.length < 5) {
      setSelectedStores([...selectedStores, storeId]);
    }
  };
  
  return (
    <div className="store-comparison">
      <h2>Store Comparison Analysis</h2>
      
      <div className="store-selection">
        <p>Select up to 5 stores to compare (selected: {selectedStores.length}/5)</p>
        <div className="store-chips">
          {stores.map(store => (
            <button
              key={store.id}
              className={`store-chip ${selectedStores.includes(store.id) ? 'selected' : ''}`}
              onClick={() => handleStoreSelect(store.id)}
              disabled={!selectedStores.includes(store.id) && selectedStores.length >= 5}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>
      
      {loading && <p>Loading comparisons...</p>}
      {error && <p>Error: {error}</p>}
      
      {Object.keys(comparisons).length > 0 && (
        <div className="comparison-grid">
          {Object.entries(comparisons).map(([storeId, data]) => {
            const store = stores.find(s => s.id === parseInt(storeId));
            return (
              <div key={storeId} className="comparison-card">
                <h3>{store?.name || `Store ${storeId}`}</h3>
                <div className="comparison-metrics">
                  <div className="metric">
                    <span>Next Change:</span>
                    <strong>{data.predictions.nextChange.expectedDays} days</strong>
                  </div>
                  <div className="metric">
                    <span>Expected:</span>
                    <strong>{data.predictions.magnitude.expectedChange > 0 ? '+' : ''}{data.predictions.magnitude.expectedChange}%</strong>
                  </div>
                  <div className="metric">
                    <span>Upsize Chance:</span>
                    <strong>{data.predictions.upsizeProbability.probability}%</strong>
                  </div>
                  <div className="metric">
                    <span>Confidence:</span>
                    <strong>{data.modelConfidence.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BayesianDashboard;