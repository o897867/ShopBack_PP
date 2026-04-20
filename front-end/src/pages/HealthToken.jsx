import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations/index';
import './HealthToken.css';
import api from '../services/api';

const HealthToken = ({ onNavigate, onTokenValidated }) => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const [mode, setMode] = useState('validate'); // 'generate' or 'validate'
  const [loading, setLoading] = useState(false);

  // Generate mode states
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);

  // Validate mode states
  const [token, setToken] = useState('');
  const [validateHeight, setValidateHeight] = useState('');
  const [validateWeight, setValidateWeight] = useState('');
  const [validateAge, setValidateAge] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Check if token exists in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('healthToken');
    const savedMetrics = localStorage.getItem('healthMetrics');

    if (savedToken && savedMetrics) {
      const metrics = JSON.parse(savedMetrics);
      setToken(savedToken);
      setValidateHeight(metrics.height);
      setValidateWeight(metrics.weight);
      setValidateAge(metrics.age);
    }
  }, []);

  const handleGenerateToken = async () => {
    if (!height || !weight || !age) {
      alert(translate('health.token.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/health/token/generate', {
        height: parseInt(height),
        weight: parseInt(weight),
        age: parseInt(age)
      });

      if (response.success) {
        setGeneratedToken(response);

        // Save to localStorage
        localStorage.setItem('healthToken', response.token);
        localStorage.setItem('healthMetrics', JSON.stringify({
          height: parseInt(height),
          weight: parseInt(weight),
          age: parseInt(age)
        }));
      }
    } catch (error) {
      console.error('Error generating token:', error);
      alert(translate('health.token.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token || !validateHeight || !validateWeight || !validateAge) {
      alert(translate('health.token.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/health/token/validate', {
        token: token.toUpperCase(),
        height: parseInt(validateHeight),
        weight: parseInt(validateWeight),
        age: parseInt(validateAge)
      });

      setValidationResult(response);

      if (response.valid) {
        // Save validated token
        localStorage.setItem('healthToken', token.toUpperCase());
        localStorage.setItem('healthMetrics', JSON.stringify({
          height: parseInt(validateHeight),
          weight: parseInt(validateWeight),
          age: parseInt(validateAge)
        }));
        localStorage.setItem('healthUserEmail', response.user_email);

        // Navigate to health dashboard after 2 seconds
        setTimeout(() => {
          if (onTokenValidated) {
            onTokenValidated(token, response.user_email);
          }
          onNavigate('health');
        }, 2000);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setValidationResult({
        valid: false,
        message: translate('health.token.validateError')
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGenerateMode = () => (
    <div className="token-generate">
      <h2>{translate('health.token.generateTitle')}</h2>
      <p className="description">{translate('health.token.generateDesc')}</p>

      <div className="metrics-form">
        <div className="form-row">
          <div className="form-field">
            <label>{translate('health.token.height')}</label>
            <div className="input-group">
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="176"
                min="100"
                max="250"
              />
              <span className="unit">cm</span>
            </div>
          </div>

          <div className="form-field">
            <label>{translate('health.token.weight')}</label>
            <div className="input-group">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="89"
                min="30"
                max="200"
              />
              <span className="unit">kg</span>
            </div>
          </div>

          <div className="form-field">
            <label>{translate('health.token.age')}</label>
            <div className="input-group">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="26"
                min="10"
                max="100"
              />
              <span className="unit">years</span>
            </div>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerateToken}
          disabled={loading}
        >
          {loading ? translate('health.token.generating') : translate('health.token.generate')}
        </button>
      </div>

      {generatedToken && (
        <div className="token-result success">
          <h3>{translate('health.token.success')}</h3>
          <div className="token-display">
            <div className="token-value">{generatedToken.token}</div>
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(generatedToken.token);
                alert(translate('health.token.copied'));
              }}
            >
              📋 {translate('health.token.copy')}
            </button>
          </div>
          <div className="recovery-code">
            <span className="label">{translate('health.token.recoveryCode')}:</span>
            <span className="code">{generatedToken.recovery_code}</span>
          </div>
          <div className="token-note">
            <p>⚠️ {translate('health.token.saveNote')}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderValidateMode = () => (
    <div className="token-validate">
      <h2>{translate('health.token.validateTitle')}</h2>
      <p className="description">{translate('health.token.validateDesc')}</p>

      <div className="validate-form">
        <div className="token-input-section">
          <label>{translate('health.token.yourToken')}</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="76BBA1D4"
            maxLength="8"
            className="token-input"
          />
        </div>

        <div className="metrics-verification">
          <h4>{translate('health.token.verifyMetrics')}</h4>
          <div className="form-row">
            <div className="form-field">
              <label>{translate('health.token.height')}</label>
              <div className="input-group">
                <input
                  type="number"
                  value={validateHeight}
                  onChange={(e) => setValidateHeight(e.target.value)}
                  placeholder="176"
                  min="100"
                  max="250"
                />
                <span className="unit">cm</span>
              </div>
            </div>

            <div className="form-field">
              <label>{translate('health.token.weight')}</label>
              <div className="input-group">
                <input
                  type="number"
                  value={validateWeight}
                  onChange={(e) => setValidateWeight(e.target.value)}
                  placeholder="89"
                  min="30"
                  max="200"
                />
                <span className="unit">kg</span>
              </div>
            </div>

            <div className="form-field">
              <label>{translate('health.token.age')}</label>
              <div className="input-group">
                <input
                  type="number"
                  value={validateAge}
                  onChange={(e) => setValidateAge(e.target.value)}
                  placeholder="26"
                  min="10"
                  max="100"
                />
                <span className="unit">years</span>
              </div>
            </div>
          </div>
        </div>

        <button
          className="validate-btn"
          onClick={handleValidateToken}
          disabled={loading}
        >
          {loading ? translate('health.token.validating') : translate('health.token.validate')}
        </button>
      </div>

      {validationResult && (
        <div className={`validation-result ${validationResult.valid ? 'success' : 'error'}`}>
          <div className="result-icon">
            {validationResult.valid ? '✅' : '❌'}
          </div>
          <h3>{validationResult.message}</h3>
          {validationResult.valid && (
            <>
              <p>{translate('health.token.accessGranted')}</p>
              <div className="permissions">
                {validationResult.permissions?.map((perm, index) => (
                  <span key={index} className="permission-badge">{perm}</span>
                ))}
              </div>
              <p className="redirect-note">{translate('health.token.redirecting')}</p>
            </>
          )}
          {!validationResult.valid && (
            <p className="hint">{validationResult.hint}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="health-token-container">
      <div className="token-header">
        <button className="back-btn" onClick={() => onNavigate('home')}>
          ← {translate('common.back')}
        </button>
        <h1>{translate('health.token.title')}</h1>
        <p className="subtitle">{translate('health.token.subtitle')}</p>
      </div>

      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'validate' ? 'active' : ''}`}
          onClick={() => setMode('validate')}
        >
          {translate('health.token.enterToken')}
        </button>
        <button
          className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
          onClick={() => setMode('generate')}
        >
          {translate('health.token.newToken')}
        </button>
      </div>

      <div className="token-content">
        {mode === 'generate' ? renderGenerateMode() : renderValidateMode()}
      </div>

      <div className="token-info">
        <h3>{translate('health.token.howItWorks')}</h3>
        <ul>
          <li>{translate('health.token.info1')}</li>
          <li>{translate('health.token.info2')}</li>
          <li>{translate('health.token.info3')}</li>
          <li>{translate('health.token.info4')}</li>
        </ul>

        <div className="example-box">
          <h4>{translate('health.token.example')}</h4>
          <p>
            {translate('health.token.exampleText')
              .replace('{{height}}', '176')
              .replace('{{weight}}', '89')
              .replace('{{age}}', '26')
              .replace('{{token}}', '76BBA1D4')
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthToken;