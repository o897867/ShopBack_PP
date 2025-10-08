import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const ONBOARDING_KEY = 'brokerhub_onboarding_completed';

const OnboardingTooltip = ({ step, children }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [isCompleted, setIsCompleted] = useState(false);
  const [currentTooltipStep, setCurrentTooltipStep] = useState(1);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed === 'true') {
      setIsCompleted(true);
    }
  }, []);

  const handleDismiss = () => {
    if (currentTooltipStep < 3) {
      setCurrentTooltipStep(currentTooltipStep + 1);
    } else {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setIsCompleted(true);
    }
  };

  const handleSkipAll = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
  };

  if (isCompleted || step !== currentTooltipStep) {
    return <>{children}</>;
  }

  const tooltipMessages = {
    1: translate('brokerHub.onboarding.firstVisit.tooltip1'),
    2: translate('brokerHub.onboarding.firstVisit.tooltip2'),
    3: translate('brokerHub.onboarding.firstVisit.tooltip3')
  };

  return (
    <div className="bh-tooltip-wrapper">
      {children}
      <div className="bh-tooltip-overlay">
        <div className="bh-tooltip-card">
          <div className="bh-tooltip-content">
            <p className="bh-tooltip-message">{tooltipMessages[step]}</p>
            <div className="bh-tooltip-progress">
              {[1, 2, 3].map((dotStep) => (
                <span
                  key={dotStep}
                  className={`bh-tooltip-dot ${dotStep === currentTooltipStep ? 'active' : ''} ${dotStep < currentTooltipStep ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="bh-tooltip-actions">
            <button className="btn btn-ghost btn-small" onClick={handleSkipAll}>
              {translate('brokerHub.onboarding.firstVisit.skipAll')}
            </button>
            <button className="btn btn-primary btn-small" onClick={handleDismiss}>
              {currentTooltipStep < 3
                ? translate('brokerHub.onboarding.firstVisit.dismiss')
                : translate('brokerHub.onboarding.firstVisit.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltip;
