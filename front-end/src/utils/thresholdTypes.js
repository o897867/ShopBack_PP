export const getThresholdTypeText = (type) => {
  switch(type) {
    case 'above_current': return '高于当前';
    case 'fixed_value': return '达到固定值';
    case 'percentage_increase': return '涨幅百分比';
    default: return type;
  }
};