// translations/index.js - 完整的多语言翻译文件
export const translations = {
  'en': {
    // Navigation & General
    'nav.dashboard': 'ShopBack Management',
    'nav.trading': 'TradingView',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',
    
    // Dashboard
    'dashboard.title': 'ShopBack Cashback Management Platform',
    'dashboard.subtitle': 'Comprehensive cashback monitoring and analysis',
    'dashboard.totalStores': 'Total Stores',
    'dashboard.totalRecords': 'Total Records',
    'dashboard.recentScrapes': '24h Scrapes',
    'dashboard.upsizedStores': 'Upsized Stores',
    'dashboard.avgCashback': 'Average Cashback Rate',
    'dashboard.rescrape': 'Rescrape & Refresh',
    'dashboard.rescraping': 'Rescaping...',
    'dashboard.alerts': 'Price Alert Management',
    'dashboard.closeAlerts': 'Close Price Alerts',
    'dashboard.deploySuccess': 'Congratulations! ShopBack Management Platform Deployed Successfully!',
    'dashboard.deployDesc': 'All functions are working properly, API connection is normal, data loading successful.',
    
    // Stores Management
    'stores.title': 'Store List',
    'stores.count': 'stores',
    'stores.addNew': 'Add New Store',
    'stores.addUrl': 'Enter ShopBack or CashRewards store URL...',
    'stores.adding': 'Adding...',
    'stores.add': 'Add',
    'stores.addSuccess': 'Store added successfully!',
    'stores.addError': 'Failed to add store',
    'stores.updateTime': 'Updated',
    'stores.noStores': 'No stores available',
    'stores.clickForDetails': 'Click for details',
    'stores.storeDetails': 'Store Details',
    'stores.cashbackHistory': 'Cashback History',
    'stores.noHistory': 'No historical data available',
    
    // Upsized Stores
    'upsized.title': 'Upsized Stores',
    'upsized.description': 'Stores currently offering enhanced cashback rates',
    'upsized.previous': 'Previous',
    'upsized.originalPrice': 'Original Price',
    'upsized.scraped': 'Scraped Time',
    'upsized.badge': 'UPSIZED',
    'upsized.noStores': 'No upsized stores currently',
    
    // Store Comparison
    'compare.title': 'Store Comparison',
    'compare.subtitle': 'Compare cashback rates across different platforms',
    'compare.available': 'Comparable Stores',
    'compare.description': 'These stores have data on multiple platforms, click to view rate comparison',
    'compare.platforms': 'Platforms',
    'compare.clickToCompare': 'Click to compare →',
    'compare.bestChoice': 'Best Choice',
    'compare.cashbackRate': 'Cashback Rate',
    'compare.lastUpdated': 'Updated',
    'compare.shopback': 'ShopBack',
    'compare.cashrewards': 'CashRewards',
    'compare.best': 'Best',
    'compare.suggestions': 'Usage Suggestions',
    'compare.tip1': 'Choose platforms with higher rates for more cashback',
    'compare.tip2': 'Check terms and conditions for each platform',
    'compare.tip3': 'UPSIZED indicates limited-time enhanced offers',
    'compare.tip4': 'Data is updated regularly, confirm before purchase',
    
    // Price Alerts
    'alerts.title': 'Price Alert Management',
    'alerts.description': 'Get notified when cashback rates meet your criteria',
    'alerts.email': 'Email Address',
    'alerts.emailPlaceholder': 'Enter your email address',
    'alerts.loadAlerts': 'Load My Alerts',
    'alerts.createNew': 'Create New Alert',
    'alerts.storeUrl': 'Store URL',
    'alerts.storeUrlPlaceholder': 'Enter ShopBack store URL...',
    'alerts.thresholdType': 'Alert Type',
    'alerts.threshold': 'Threshold (%)',
    'alerts.thresholdPlaceholder': 'Enter value',
    'alerts.create': 'Create Alert',
    'alerts.creating': 'Creating...',
    'alerts.myAlerts': 'My Alert List',
    'alerts.delete': 'Delete',
    'alerts.testEmail': 'Test Email',
    'alerts.testEmailSuccess': 'Test email sent successfully',
    'alerts.testEmailError': 'Failed to send test email',
    'alerts.createSuccess': 'Price alert created successfully!',
    'alerts.createError': 'Failed to create alert',
    'alerts.deleteSuccess': 'Alert deleted',
    'alerts.deleteError': 'Failed to delete alert',
    'alerts.noAlerts': 'No price alerts',
    'alerts.alertCondition': 'Alert Condition',
    'alerts.createdTime': 'Created',
    'alerts.website': 'Website',
    'alerts.fillAllFields': 'Please fill in all required fields',
    'alerts.enterEmail': 'Please enter email address',
    'alerts.loadError': 'Failed to load alerts',
    
    // Alert Types
    'alertTypes.aboveCurrent': 'Above Current Rate',
    'alertTypes.fixedValue': 'Reach Fixed Value',
    'alertTypes.percentageIncrease': 'Percentage Increase',
    
    // Statistics & History
    'stats.historicalData': 'Historical Data',
    'stats.highestRate': 'Highest Rate',
    'stats.lowestRate': 'Lowest Rate',
    'stats.currentIsHighest': 'Current rate is the highest!',
    'stats.currentIsLowest': 'Current rate is the lowest',
    'stats.differenceFromHigh': 'Difference from highest',
    'stats.mainOffer': 'Main Offer',
    'stats.category': 'Category',
    'stats.termsConditions': 'Terms & Conditions',
    
    // Trading Page
    'trading.title': 'TradingView Charts',
    'trading.selectSymbol': 'Select Trading Pair',
    'trading.theme': 'Theme',
    'trading.darkTheme': '🌙 Dark Theme',
    'trading.lightTheme': '☀️ Light Theme',
    'trading.quickSwitch': '🚀 Quick Switch',
    
    // Trading Symbols
    'symbols.bitcoin': 'Bitcoin (BTC/USDT)',
    'symbols.usdjpy': 'USDJPY',
    'symbols.gold': 'Gold (XAU/USD)',
    'symbols.eurjpy': 'EURJPY',
    'symbols.eurusd': 'EURUSD',
    'symbols.silver': 'Silver (XAG/USD)',
    
    // Messages & Status
    'messages.success': 'Success!',
    'messages.error': 'Error',
    'messages.warning': 'Warning',
    'messages.info': 'Information',
    'messages.loading': 'Loading data...',
    'messages.noData': 'No data available',
    'messages.connectionError': 'Connection Error',
    'messages.retry': 'Retry',
    'messages.networkError': 'Network connection failed',
    'messages.serverError': 'Server error, please try again later',
    'messages.dataLoadError': 'Failed to load data',
    'messages.operationSuccess': 'Operation completed successfully',
    'messages.operationFailed': 'Operation failed',
    
    // Platform Detection
    'platforms.shopback': 'ShopBack',
    'platforms.cashrewards': 'CashRewards',
    'platforms.rakuten': 'Rakuten',
    'platforms.topcashback': 'TopCashback',
    'platforms.unknown': 'Unknown Platform',
    
    // Time & Date
    'time.updated': 'Updated',
    'time.created': 'Created',
    'time.scraped': 'Scraped',
    'time.lastModified': 'Last Modified',
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.daysAgo': 'days ago',
    'time.hoursAgo': 'hours ago',
    'time.minutesAgo': 'minutes ago',
    'time.justNow': 'Just now',
    
    // Validation Messages
    'validation.required': 'This field is required',
    'validation.invalidEmail': 'Invalid email format',
    'validation.invalidUrl': 'Invalid URL format',
    'validation.mustBePositive': 'Value must be positive',
    'validation.tooLong': 'Text is too long',
    'validation.tooShort': 'Text is too short'
  },
  
  'zh-CN': {
    // Navigation & General
    'nav.dashboard': 'ShopBack管理',
    'nav.trading': '交易图表',
    'common.close': '关闭',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.loading': '加载中...',
    'common.success': '成功',
    'common.error': '错误',
    'common.warning': '警告',
    'common.info': '信息',
    
    // Dashboard
    'dashboard.title': 'ShopBack Cashback 管理平台',
    'dashboard.subtitle': '全面的返现监控和分析平台',
    'dashboard.totalStores': '总商家数',
    'dashboard.totalRecords': '总记录数',
    'dashboard.recentScrapes': '24小时抓取',
    'dashboard.upsizedStores': 'Upsized商家',
    'dashboard.avgCashback': '平均Cashback率',
    'dashboard.rescrape': '重新抓取并刷新',
    'dashboard.rescraping': '正在重新抓取...',
    'dashboard.alerts': '价格提醒管理',
    'dashboard.closeAlerts': '关闭价格提醒',
    'dashboard.deploySuccess': '恭喜！ShopBack管理平台部署成功！',
    'dashboard.deployDesc': '所有功能正常工作，API连接正常，数据加载成功。',
    
    // Stores Management
    'stores.title': '商家列表',
    'stores.count': '个商家',
    'stores.addNew': '添加新商家',
    'stores.addUrl': '输入ShopBack或CashRewards商家页面URL...',
    'stores.adding': '添加中...',
    'stores.add': '添加',
    'stores.addSuccess': '商家添加成功！',
    'stores.addError': '添加商家失败',
    'stores.updateTime': '更新时间',
    'stores.noStores': '暂无商家数据',
    'stores.clickForDetails': '点击查看详情',
    'stores.storeDetails': '商家详情',
    'stores.cashbackHistory': 'Cashback历史记录',
    'stores.noHistory': '暂无历史数据',
    
    // Upsized Stores
    'upsized.title': 'Upsized优惠商家',
    'upsized.description': '当前提供增强返现率的商家',
    'upsized.previous': '之前',
    'upsized.originalPrice': '原价',
    'upsized.scraped': '抓取时间',
    'upsized.badge': 'UPSIZED',
    'upsized.noStores': '当前没有Upsized商家',
    
    // Store Comparison
    'compare.title': '商家比较',
    'compare.subtitle': '比较不同平台的返现率',
    'compare.available': '可比较商家',
    'compare.description': '这些商家在多个平台都有数据，点击可查看费率比较',
    'compare.platforms': '平台',
    'compare.clickToCompare': '点击比较 →',
    'compare.bestChoice': '最佳选择',
    'compare.cashbackRate': 'Cashback率',
    'compare.lastUpdated': '更新时间',
    'compare.shopback': 'ShopBack',
    'compare.cashrewards': 'CashRewards',
    'compare.best': '最佳',
    'compare.suggestions': '使用建议',
    'compare.tip1': '选择费率更高的平台可以获得更多返现',
    'compare.tip2': '注意查看各平台的条款和限制',
    'compare.tip3': 'UPSIZED标签表示限时提升的优惠',
    'compare.tip4': '数据会定期更新，建议购买前再次确认',
    
    // Price Alerts
    'alerts.title': '价格提醒管理',
    'alerts.description': '当返现率达到您设定的条件时获得通知',
    'alerts.email': '邮箱地址',
    'alerts.emailPlaceholder': '输入您的邮箱地址',
    'alerts.loadAlerts': '加载我的提醒',
    'alerts.createNew': '创建新提醒',
    'alerts.storeUrl': '商家URL',
    'alerts.storeUrlPlaceholder': '输入ShopBack商家页面URL...',
    'alerts.thresholdType': '提醒类型',
    'alerts.threshold': '阈值 (%)',
    'alerts.thresholdPlaceholder': '输入数值',
    'alerts.create': '创建提醒',
    'alerts.creating': '创建中...',
    'alerts.myAlerts': '我的提醒列表',
    'alerts.delete': '删除',
    'alerts.testEmail': '测试邮件',
    'alerts.testEmailSuccess': '测试邮件发送成功',
    'alerts.testEmailError': '测试邮件发送失败',
    'alerts.createSuccess': '价格提醒创建成功！',
    'alerts.createError': '创建提醒失败',
    'alerts.deleteSuccess': '提醒已删除',
    'alerts.deleteError': '删除失败',
    'alerts.noAlerts': '暂无价格提醒',
    'alerts.alertCondition': '提醒条件',
    'alerts.createdTime': '创建时间',
    'alerts.website': '网址',
    'alerts.fillAllFields': '请填写所有必需字段',
    'alerts.enterEmail': '请输入邮箱地址',
    'alerts.loadError': '加载提醒失败',
    
    // Alert Types
    'alertTypes.aboveCurrent': '高于当前比例',
    'alertTypes.fixedValue': '达到固定值',
    'alertTypes.percentageIncrease': '涨幅百分比',
    
    // Statistics & History
    'stats.historicalData': '历史数据',
    'stats.highestRate': '史高',
    'stats.lowestRate': '史低',
    'stats.currentIsHighest': '当前为史高！',
    'stats.currentIsLowest': '当前为史低',
    'stats.differenceFromHigh': '史高差距',
    'stats.mainOffer': '主要优惠',
    'stats.category': '分类',
    'stats.termsConditions': '条款与条件',
    
    // Trading Page
    'trading.title': 'TradingView图表',
    'trading.selectSymbol': '选择交易对',
    'trading.theme': '主题',
    'trading.darkTheme': '🌙 深色主题',
    'trading.lightTheme': '☀️ 浅色主题',
    'trading.quickSwitch': '🚀 快速切换',
    
    // Trading Symbols
    'symbols.bitcoin': '比特币 (BTC/USDT)',
    'symbols.usdjpy': '美元日元',
    'symbols.gold': '黄金 (XAU/USD)',
    'symbols.eurjpy': '欧元日元',
    'symbols.eurusd': '欧元美元',
    'symbols.silver': '白银 (XAG/USD)',
    
    // Messages & Status
    'messages.success': '成功！',
    'messages.error': '错误',
    'messages.warning': '警告',
    'messages.info': '信息',
    'messages.loading': '正在加载数据...',
    'messages.noData': '暂无数据',
    'messages.connectionError': '连接错误',
    'messages.retry': '重试',
    'messages.networkError': '网络连接失败',
    'messages.serverError': '服务器错误，请稍后重试',
    'messages.dataLoadError': '数据加载失败',
    'messages.operationSuccess': '操作成功完成',
    'messages.operationFailed': '操作失败',
    
    // Platform Detection
    'platforms.shopback': 'ShopBack',
    'platforms.cashrewards': 'CashRewards',
    'platforms.rakuten': 'Rakuten',
    'platforms.topcashback': 'TopCashback',
    'platforms.unknown': '未知平台',
    
    // Time & Date
    'time.updated': '更新时间',
    'time.created': '创建时间',
    'time.scraped': '抓取时间',
    'time.lastModified': '最后修改',
    'time.today': '今天',
    'time.yesterday': '昨天',
    'time.daysAgo': '天前',
    'time.hoursAgo': '小时前',
    'time.minutesAgo': '分钟前',
    'time.justNow': '刚刚',
    
    // Validation Messages
    'validation.required': '此字段为必填项',
    'validation.invalidEmail': '邮箱格式不正确',
    'validation.invalidUrl': 'URL格式不正确',
    'validation.mustBePositive': '数值必须为正数',
    'validation.tooLong': '文本过长',
    'validation.tooShort': '文本过短'
  },
  

};

// 翻译函数 - 支持参数插值
export const t = (key, language = 'en', params = {}) => {
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  // 如果找不到翻译，尝试英文
  if (!value && language !== 'en') {
    value = t(key, 'en', params);
  }
  
  // 如果还是找不到，返回key
  if (!value) {
    return key;
  }
  
  // 参数替换
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] || match;
    });
  }
  
  return value;
};

// 获取当前语言的所有翻译
export const getTranslations = (language = 'en') => {
  return translations[language] || translations['en'];
};

// 获取支持的语言列表
export const getSupportedLanguages = () => {
  return Object.keys(translations);
};

// 检查是否支持某种语言
export const isLanguageSupported = (language) => {
  return translations