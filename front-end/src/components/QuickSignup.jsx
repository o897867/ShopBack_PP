import React, { useState, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './QuickSignup.css';

const QuickSignup = ({ onComplete }) => {
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    accountType: 'standard',
    tradeExperience: 'beginner'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      step: 1,
      title: translate('quickSignup.steps.contact.title'),
      description: translate('quickSignup.steps.contact.description')
    },
    {
      step: 2,
      title: translate('quickSignup.steps.preferences.title'),
      description: translate('quickSignup.steps.preferences.description')
    },
    {
      step: 3,
      title: translate('quickSignup.steps.verify.title'),
      description: translate('quickSignup.steps.verify.description')
    }
  ];

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\+?[\d\s\-()]+$/;
    return phone.length >= 10 && re.test(phone);
  };

  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = translate('quickSignup.errors.emailRequired');
      } else if (!validateEmail(formData.email)) {
        newErrors.email = translate('quickSignup.errors.emailInvalid');
      }

      if (!formData.phone) {
        newErrors.phone = translate('quickSignup.errors.phoneRequired');
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = translate('quickSignup.errors.phoneInvalid');
      }
    }

    if (step === 2) {
      if (!formData.accountType) {
        newErrors.accountType = translate('quickSignup.errors.accountTypeRequired');
      }
      if (!formData.tradeExperience) {
        newErrors.tradeExperience = translate('quickSignup.errors.experienceRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, translate]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);

    if (onComplete) {
      onComplete(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="quick-signup">
      <div className="quick-signup-header">
        <h2 className="quick-signup-title">
          {translate('quickSignup.title')}
        </h2>
        <p className="quick-signup-subtitle">{translate('quickSignup.subtitle')}</p>
      </div>

      <div className="signup-progress">
        {steps.map((step, index) => (
          <div
            key={step.step}
            className={`progress-step ${currentStep >= step.step ? 'progress-step--active' : ''} ${
              currentStep > step.step ? 'progress-step--completed' : ''
            }`}
          >
            <div className="progress-step-indicator">
              <span className="progress-step-number">
                {currentStep > step.step ? '✓' : step.step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`progress-line ${currentStep > step.step ? 'progress-line--completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="signup-steps-labels">
        {steps.map((step) => (
          <div
            key={step.step}
            className={`step-label ${currentStep === step.step ? 'step-label--active' : ''}`}
          >
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>

      <div className="signup-form-container">
        <div className="signup-form-header">
          <h3 className="form-step-title">{steps[currentStep - 1].title}</h3>
          <p className="form-step-description">{steps[currentStep - 1].description}</p>
        </div>

        <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
          {currentStep === 1 && (
            <div className="form-fields">
              <div className="form-field">
                <label className="form-label">{translate('quickSignup.fields.email')}</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'input--error' : ''}`}
                  placeholder={translate('quickSignup.placeholders.email')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">{translate('quickSignup.fields.phone')}</label>
                <input
                  type="tel"
                  className={`input ${errors.phone ? 'input--error' : ''}`}
                  placeholder={translate('quickSignup.placeholders.phone')}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-fields">
              <div className="form-field">
                <label className="form-label">{translate('quickSignup.fields.accountType')}</label>
                <div className="radio-group">
                  {['standard', 'ecn', 'vip'].map((type) => (
                    <label key={type} className="radio-option">
                      <input
                        type="radio"
                        name="accountType"
                        value={type}
                        checked={formData.accountType === type}
                        onChange={(e) => handleInputChange('accountType', e.target.value)}
                      />
                      <span className="radio-label">
                        {translate(`quickSignup.accountTypes.${type}`)}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.accountType && <span className="form-error">{errors.accountType}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">{translate('quickSignup.fields.experience')}</label>
                <select
                  className={`input ${errors.tradeExperience ? 'input--error' : ''}`}
                  value={formData.tradeExperience}
                  onChange={(e) => handleInputChange('tradeExperience', e.target.value)}
                >
                  <option value="beginner">{translate('quickSignup.experience.beginner')}</option>
                  <option value="intermediate">{translate('quickSignup.experience.intermediate')}</option>
                  <option value="advanced">{translate('quickSignup.experience.advanced')}</option>
                  <option value="professional">{translate('quickSignup.experience.professional')}</option>
                </select>
                {errors.tradeExperience && <span className="form-error">{errors.tradeExperience}</span>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-fields">
              <div className="signup-summary">
                <h4 className="summary-title">{translate('quickSignup.summary.title')}</h4>
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="summary-label">{translate('quickSignup.fields.email')}:</span>
                    <span className="summary-value">{formData.email}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{translate('quickSignup.fields.phone')}:</span>
                    <span className="summary-value">{formData.phone}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{translate('quickSignup.fields.accountType')}:</span>
                    <span className="summary-value">
                      {translate(`quickSignup.accountTypes.${formData.accountType}`)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{translate('quickSignup.fields.experience')}:</span>
                    <span className="summary-value">
                      {translate(`quickSignup.experience.${formData.tradeExperience}`)}
                    </span>
                  </div>
                </div>
                <div className="kyc-notice">
                  <p className="kyc-text">{translate('quickSignup.kycNotice')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                {translate('quickSignup.buttons.back')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? translate('quickSignup.buttons.submitting')
                : currentStep === 3
                ? translate('quickSignup.buttons.submit')
                : translate('quickSignup.buttons.next')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickSignup;
