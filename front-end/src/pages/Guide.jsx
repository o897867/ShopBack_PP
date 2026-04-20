import React, { useState, useEffect } from 'react';
import './Guide.css';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

// 导入图片 - 返佣指南
import Desktop1 from '../assets/Guide/Desktop1.jpeg';
import Desktop2 from '../assets/Guide/Desktop2.jpeg';
import Desktop3 from '../assets/Guide/Desktop3.jpeg';
import Mobile1 from '../assets/Guide/Mobile1.jpeg';
import Mobile2 from '../assets/Guide/Mobile2.jpeg';
import Mobile3 from '../assets/Guide/Mobile3.jpeg';
import Mobile4 from '../assets/Guide/Mobile4.jpeg';
import Mobile5 from '../assets/Guide/Mobile5.jpeg';
import Mobile6 from '../assets/Guide/Mobile6.jpeg';
import Mobile7 from '../assets/Guide/Mobile7.jpeg';
// 导入图片 - 注册指南
import RegD1 from '../assets/Guide/regD1.png';
import RegD2 from '../assets/Guide/regD2.png';
import RegD3 from '../assets/Guide/regD3.png';
import RegD4 from '../assets/Guide/regD4.png';
import RegD5 from '../assets/Guide/regD5.png';
import RegM1 from '../assets/Guide/regM1.JPG';
import RegM2 from '../assets/Guide/regM2.JPG';
import RegM3 from '../assets/Guide/regM3.JPG';
import RegM4 from '../assets/Guide/regM4.JPG';
import RegM5 from '../assets/Guide/regM5.JPG';
// 导入图片 - 邀请码指南
import InvD1 from '../assets/Guide/invD1.JPG';
import InvD2 from '../assets/Guide/invD2.JPG';
import InvD3 from '../assets/Guide/invD3.JPG';
import InvD4 from '../assets/Guide/invD4.JPG';
import InvD5 from '../assets/Guide/invD5.JPG';
import InvM1 from '../assets/Guide/invM1.JPG';
import InvM2 from '../assets/Guide/invM2.JPG';
import InvM3 from '../assets/Guide/invM3.JPG';
import InvM4 from '../assets/Guide/invM4.JPG';

const PLATFORM_GUIDES = {
  rebate: {
    desktop: [Desktop1, Desktop2, Desktop3],
    mobile: [Mobile1, Mobile2, Mobile3, Mobile4, Mobile5, Mobile6, Mobile7]
  },
  registration: {
    desktop: [RegD1, RegD2, RegD3, RegD4, RegD5],
    mobile: [RegM1, RegM2, RegM3, RegM4, RegM5]
  },
  invitation: {
    desktop: [InvD1, InvD2, InvD3, InvD4, InvD5],
    mobile: [InvM1, InvM2, InvM3, InvM4]
  }
};

const REBATE_PASSWORD = 'tmgm';

const Guide = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const [guideType, setGuideType] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRebate, setShowRebate] = useState(() => sessionStorage.getItem('showRebate') === '1');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === REBATE_PASSWORD) {
      setShowRebate(true);
      sessionStorage.setItem('showRebate', '1');
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleGuideTypeSelect = (type) => {
    setGuideType(type);
    setSelectedPlatform(null);
    setCurrentStep(0);
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    const totalSteps = PLATFORM_GUIDES[guideType]?.[selectedPlatform]?.length || 0;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成所有步骤
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setSelectedPlatform(null);
    setCurrentStep(0);
  };

  const handleBackToGuideType = () => {
    setGuideType(null);
    setSelectedPlatform(null);
    setCurrentStep(0);
  };

  const handleRestartGuide = () => {
    setGuideType(null);
    setSelectedPlatform(null);
    setCurrentStep(0);
    setIsCompleted(false);
  };

  // 键盘导航支持
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && selectedPlatform && !isCompleted) {
        handleNextStep();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlatform, currentStep, isCompleted]);

  const currentImages = (selectedPlatform && guideType) ? (PLATFORM_GUIDES[guideType]?.[selectedPlatform] || []) : [];
  const totalSteps = currentImages.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="guide-container">
      <div className="page-header">
        <h1 className="title">{translate('guide.title')}</h1>
        <div className="controls">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </div>

      <div className="guide-content">
        {/* 完成状态 */}
        {isCompleted ? (
          <div className="guide-completion">
            <div className="completion-card">
              <div className="completion-icon">✓</div>
              <h2>{translate('guide.completed.title')}</h2>
              <p className="muted">{translate('guide.completed.message')}</p>
              <div className="completion-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onNavigate && onNavigate('home')}
                >
                  {translate('guide.completed.backToHome')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleRestartGuide}
                >
                  {translate('guide.completed.restart')}
                </button>
              </div>
            </div>
          </div>
        ) : !guideType ? (
          /* 指南类型选择界面 */
          <div className="platform-selection">
            <p className="guide-subtitle">{translate('guide.selectGuideType')}</p>
            <div className="platform-cards">
              <button
                className="platform-card"
                onClick={() => handleGuideTypeSelect('accountType')}
              >
                <div className="platform-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3>{translate('guide.guideType.accountType')}</h3>
                <p className="muted">{translate('guide.guideType.accountTypeDesc')}</p>
              </button>

              <button
                className="platform-card"
                onClick={() => handleGuideTypeSelect('registration')}
              >
                <div className="platform-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <h3>{translate('guide.guideType.registration')}</h3>
                <p className="muted">{translate('guide.guideType.registrationDesc')}</p>
              </button>

              {showRebate && (
                <>
                  <button
                    className="platform-card"
                    onClick={() => handleGuideTypeSelect('rebate')}
                  >
                    <div className="platform-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <h3>{translate('guide.guideType.rebate')}</h3>
                    <p className="muted">{translate('guide.guideType.rebateDesc')}</p>
                  </button>
                  <button
                    className="platform-card"
                    onClick={() => handleGuideTypeSelect('invitation')}
                  >
                    <div className="platform-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h3>{translate('guide.guideType.invitation')}</h3>
                    <p className="muted">{translate('guide.guideType.invitationDesc')}</p>
                  </button>
                </>
              )}
            </div>
            {!showRebate && (
              <button
                className="rebate-unlock-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {translate('guide.guideType.unlockMore')}
              </button>
            )}
          </div>
        ) : guideType === 'accountType' ? (
          /* 账户对比页面 */
          <div className="account-comparison-view">
            <div className="account-comparison-header">
              <h2>{translate('guide.accountComparison.title')}</h2>
              <p className="muted">{translate('guide.accountComparison.subtitle')}</p>
              <p className="account-example">{translate('guide.accountComparison.example')}</p>
            </div>

            {/* 账户对比卡片 */}
            <div className="account-cards">
              <div className="account-card standard-account">
                <h3>{translate('guide.accountComparison.standard.title')}</h3>
                <div className="account-details">
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.standard.spread')}</span>
                    <span className="value">{translate('guide.accountComparison.standard.spreadValue')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.standard.commission')}</span>
                    <span className="value">{translate('guide.accountComparison.standard.commissionValue')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.standard.rebate')}</span>
                    <span className="value highlight">{translate('guide.accountComparison.standard.rebateValue')}</span>
                  </div>
                  <div className="detail-row total">
                    <span className="label">{translate('guide.accountComparison.standard.tradingCost')}</span>
                    <span className="value">{translate('guide.accountComparison.standard.tradingCostValue')}</span>
                  </div>
                  <div className="detail-row net-cost">
                    <span className="label">{translate('guide.accountComparison.standard.netCost')}</span>
                    <span className="value net">{translate('guide.accountComparison.standard.netCostValue')}</span>
                  </div>
                </div>
                <div className="account-suit">
                  <div className="suit-label">{translate('guide.accountComparison.standard.suitFor')}</div>
                  <div className="suit-value">{translate('guide.accountComparison.standard.suitForValue')}</div>
                </div>
              </div>

              <div className="account-card raw-spread-account">
                <h3>{translate('guide.accountComparison.rawSpread.title')}</h3>
                <div className="account-details">
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.rawSpread.spread')}</span>
                    <span className="value">{translate('guide.accountComparison.rawSpread.spreadValue')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.rawSpread.commission')}</span>
                    <span className="value">{translate('guide.accountComparison.rawSpread.commissionValue')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{translate('guide.accountComparison.rawSpread.rebate')}</span>
                    <span className="value highlight">{translate('guide.accountComparison.rawSpread.rebateValue')}</span>
                  </div>
                  <div className="detail-row total">
                    <span className="label">{translate('guide.accountComparison.rawSpread.tradingCost')}</span>
                    <span className="value">{translate('guide.accountComparison.rawSpread.tradingCostValue')}</span>
                  </div>
                  <div className="detail-row net-cost">
                    <span className="label">{translate('guide.accountComparison.rawSpread.netCost')}</span>
                    <span className="value net">{translate('guide.accountComparison.rawSpread.netCostValue')}</span>
                  </div>
                </div>
                <div className="account-suit">
                  <div className="suit-label">{translate('guide.accountComparison.rawSpread.suitFor')}</div>
                  <div className="suit-value">{translate('guide.accountComparison.rawSpread.suitForValue')}</div>
                </div>
              </div>
            </div>

            {/* 建议框 */}
            <div className="recommendation-box">
              <h3>{translate('guide.accountComparison.recommendation.title')}</h3>
              <div className="recommendation-items">
                <div className="recommendation-item">
                  ✅ {translate('guide.accountComparison.recommendation.highFrequency')}
                </div>
                <div className="recommendation-item">
                  ✅ {translate('guide.accountComparison.recommendation.longTerm')}
                </div>
              </div>
              <div className="recommendation-key">
                {translate('guide.accountComparison.recommendation.key')}
              </div>
            </div>

            {/* 返回按钮 */}
            <div className="guide-actions">
              <button
                className="btn btn-secondary"
                onClick={handleBackToGuideType}
              >
                {translate('guide.accountComparison.backToType')}
              </button>
            </div>
          </div>
        ) : !selectedPlatform ? (
          /* 平台选择界面（代理返佣） */
          <div className="platform-selection">
            <p className="guide-subtitle">{translate('guide.selectPlatform')}</p>
            <div className="platform-cards">
              <button
                className="platform-card"
                onClick={() => handlePlatformSelect('desktop')}
              >
                <div className="platform-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3>{translate('guide.platform.desktop')}</h3>
                <p className="muted">{translate('guide.platform.desktopDesc')}</p>
              </button>

              <button
                className="platform-card"
                onClick={() => handlePlatformSelect('mobile')}
              >
                <div className="platform-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12" y2="18" />
                  </svg>
                </div>
                <h3>{translate('guide.platform.mobile')}</h3>
                <p className="muted">{translate('guide.platform.mobileDesc')}</p>
              </button>
            </div>
          </div>
        ) : (
          /* 步骤展示界面 */
          <div className="guide-steps">
            {/* 进度条 */}
            <div className="guide-progress-container">
              <div className="guide-progress-bar">
                <div
                  className="guide-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="guide-progress-text">
                {translate('guide.step')} {currentStep + 1} / {totalSteps}
              </div>
            </div>

            {/* 图片展示 */}
            <div className="guide-image-container">
              <img
                src={currentImages[currentStep]}
                alt={`${selectedPlatform} guide step ${currentStep + 1}`}
                className="guide-image"
              />
            </div>

            {/* 操作按钮 */}
            <div className="guide-actions">
              <button
                className="btn btn-secondary"
                onClick={handleBackToGuideType}
              >
                {translate('guide.backToPlatform')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                {currentStep < totalSteps - 1
                  ? translate('guide.completed.button')
                  : translate('guide.finishGuide')
                }
              </button>
            </div>

            {/* 键盘提示 */}
            <p className="guide-hint muted">
              {translate('guide.keyboardHint')}
            </p>
          </div>
        )}
      </div>

      {/* 密码弹窗 */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={() => { setShowPasswordModal(false); setPassword(''); setPasswordError(false); }}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{translate('guide.password.title')}</h3>
            <input
              type="password"
              className={`password-input ${passwordError ? 'error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder={translate('guide.password.placeholder')}
              autoFocus
            />
            {passwordError && (
              <p className="password-error">{translate('guide.password.error')}</p>
            )}
            <div className="password-modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setPassword(''); setPasswordError(false); }}>
                {translate('guide.password.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handlePasswordSubmit}>
                {translate('guide.password.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guide;
