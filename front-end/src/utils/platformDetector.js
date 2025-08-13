export const detectPlatform = (url) => {
  if (!url) return 'Unknown';
  
  const urlLower = url.toLowerCase();
  if (urlLower.includes('shopback.com')) {
    return 'ShopBack';
  } else if (urlLower.includes('cashrewards.com')) {
    return 'CashRewards';
  } else if (urlLower.includes('rakuten.com')) {
    return 'Rakuten';
  } else if (urlLower.includes('topcashback.com')) {
    return 'TopCashback';
  } else {
    return 'Unknown';
  }
};