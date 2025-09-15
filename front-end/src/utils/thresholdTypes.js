// Accept a translate function to localize labels
export const getThresholdTypeText = (type, translate) => {
  const t = translate || ((k) => k);
  switch(type) {
    case 'above_current': return t('alertTypes.aboveCurrent');
    case 'fixed_value': return t('alertTypes.fixedValue');
    case 'percentage_increase': return t('alertTypes.percentageIncrease');
    default: return type;
  }
};
