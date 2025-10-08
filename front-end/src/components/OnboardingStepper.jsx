import React, { useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

const OnboardingStepper = ({ currentStep = 1, onStepClick }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const steps = [
    {
      number: 1,
      title: translate('brokerHub.onboarding.steps.step1.title'),
      description: translate('brokerHub.onboarding.steps.step1.description')
    },
    {
      number: 2,
      title: translate('brokerHub.onboarding.steps.step2.title'),
      description: translate('brokerHub.onboarding.steps.step2.description')
    },
    {
      number: 3,
      title: translate('brokerHub.onboarding.steps.step3.title'),
      description: translate('brokerHub.onboarding.steps.step3.description')
    }
  ];

  return (
    <div className="bh-onboarding-stepper">
      <h3 className="bh-onboarding-stepper__title">
        {translate('brokerHub.onboarding.stepperTitle')}
      </h3>
      <div className="bh-onboarding-stepper__steps">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`bh-step ${currentStep === step.number ? 'bh-step--active' : ''} ${currentStep > step.number ? 'bh-step--completed' : ''}`}
            onClick={() => onStepClick && onStepClick(step.number)}
          >
            <div className="bh-step__indicator">
              <span className="bh-step__number">{step.number}</span>
            </div>
            <div className="bh-step__content">
              <h4 className="bh-step__title">{step.title}</h4>
              <p className="bh-step__description">{step.description}</p>
            </div>
            {step.number < 3 && <div className="bh-step__connector"></div>}
          </div>
        ))}
      </div>
      <div className="bh-onboarding-stepper__action">
        <button
          className="btn btn-primary"
          onClick={() => onStepClick && onStepClick(currentStep)}
        >
          {translate('brokerHub.onboarding.ctaGo')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStepper;
