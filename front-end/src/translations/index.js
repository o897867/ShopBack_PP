// translations/index.js - 修复后的完整翻译文件（嵌套对象结构）
export const translations = {
  en: {
    // Navigation & General
    nav: {
      dashboard: 'ShopBack Management',
      trading: 'TradingView',
      donations: 'Donations'
    },
    common: {
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },
    
    // Dashboard
    dashboard: {
      title: 'ShopBack Cashback Management Platform',
      subtitle: 'Comprehensive cashback monitoring and analysis',
      totalStores: 'Total Stores',
      totalRecords: 'Total Records',
      recentScrapes: '24h Scrapes',
      upsizedStores: 'Upsized Stores',
      avgCashback: 'Average Cashback Rate',
      rescrape: 'Rescrape & Refresh',
      rescraping: 'Rescaping...',
      alerts: 'Price Alert Management',
      closeAlerts: 'Close Price Alerts',
      deploySuccess: 'Congratulations! ShopBack Management Platform Deployed Successfully!',
      deployDesc: 'All functions are working properly, API connection is normal, data loading successful.'
    },
    
    // Stores Management
    stores: {
      title: 'Store List',
      count: 'stores',
      addNew: 'Add New Store',
      addUrl: 'Enter ShopBack or CashRewards store URL...',
      adding: 'Adding...',
      add: 'Add',
      addSuccess: 'Store added successfully!',
      addError: 'Failed to add store',
      updateTime: 'Updated',
      noStores: 'No stores available',
      clickForDetails: 'Click for details',
      storeDetails: 'Store Details',
      cashbackHistory: 'Cashback History',
      noHistory: 'No historical data available'
    },
    
    // Upsized Stores
    upsized: {
      title: 'Upsized Stores',
      description: 'Stores currently offering enhanced cashback rates',
      previous: 'Previous',
      originalPrice: 'Original Price',
      scraped: 'Scraped Time',
      badge: 'UPSIZED',
      noStores: 'No upsized stores currently'
    },
    
    // Store Comparison
    compare: {
      title: 'Store Comparison',
      subtitle: 'Compare cashback rates across different platforms',
      available: 'Comparable Stores',
      description: 'These stores have data on multiple platforms, click to view rate comparison',
      platforms: 'Platforms',
      clickToCompare: 'Click to compare →',
      bestChoice: 'Best Choice',
      cashbackRate: 'Cashback Rate',
      lastUpdated: 'Updated',
      shopback: 'ShopBack',
      cashrewards: 'CashRewards',
      best: 'Best',
      suggestions: 'Usage Suggestions',
      tip1: 'Choose platforms with higher rates for more cashback',
      tip2: 'Check terms and conditions for each platform',
      tip3: 'UPSIZED indicates limited-time enhanced offers',
      tip4: 'Data is updated regularly, confirm before purchase'
    },
    
    // Price Alerts
    alerts: {
      title: 'Price Alert Management',
      description: 'Get notified when cashback rates meet your criteria',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      loadAlerts: 'Load My Alerts',
      createNew: 'Create New Alert',
      storeUrl: 'Store URL',
      storeUrlPlaceholder: 'Enter ShopBack store URL...',
      thresholdType: 'Alert Type',
      threshold: 'Threshold (%)',
      thresholdPlaceholder: 'Enter value',
      create: 'Create Alert',
      creating: 'Creating...',
      myAlerts: 'My Alert List',
      delete: 'Delete',
      testEmail: 'Test Email',
      testEmailSuccess: 'Test email sent successfully',
      testEmailError: 'Failed to send test email',
      createSuccess: 'Price alert created successfully!',
      createError: 'Failed to create alert',
      deleteSuccess: 'Alert deleted',
      deleteError: 'Failed to delete alert',
      noAlerts: 'No price alerts',
      alertCondition: 'Alert Condition',
      createdTime: 'Created',
      website: 'Website',
      fillAllFields: 'Please fill in all required fields',
      enterEmail: 'Please enter email address',
      loadError: 'Failed to load alerts'
    },
    
    // Alert Types
    alertTypes: {
      aboveCurrent: 'Above Current Rate',
      fixedValue: 'Reach Fixed Value',
      percentageIncrease: 'Percentage Increase'
    },
    
    // Statistics & History
    stats: {
      historicalData: 'Historical Data',
      highestRate: 'Highest Rate',
      lowestRate: 'Lowest Rate',
      currentIsHighest: 'Current rate is the highest!',
      currentIsLowest: 'Current rate is the lowest',
      differenceFromHigh: 'Difference from highest',
      mainOffer: 'Main Offer',
      category: 'Category',
      termsConditions: 'Terms & Conditions'
    },
    
    // Trading Page
    trading: {
      title: 'TradingView Charts',
      selectSymbol: 'Select Trading Pair',
      theme: 'Theme',
      darkTheme: '🌙 Dark Theme',
      lightTheme: 'Light Theme',
      quickSwitch: '🚀 Quick Switch'
    },
    
    // Trading Symbols
    symbols: {
      bitcoin: 'Bitcoin (BTC/USDT)',
      usdjpy: 'USDJPY',
      gold: 'Gold (XAU/USD)',
      eurjpy: 'EURJPY',
      eurusd: 'EURUSD',
      silver: 'Silver (XAG/USD)'
    },
    
    // Messages & Status
    messages: {
      success: 'Success!',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      loading: 'Loading data...',
      noData: 'No data available',
      connectionError: 'Connection Error',
      retry: 'Retry',
      networkError: 'Network connection failed',
      serverError: 'Server error, please try again later',
      dataLoadError: 'Failed to load data',
      operationSuccess: 'Operation completed successfully',
      operationFailed: 'Operation failed'
    },
    
    // Platform Detection
    platforms: {
      shopback: 'ShopBack',
      cashrewards: 'CashRewards',
      rakuten: 'Rakuten',
      topcashback: 'TopCashback',
      unknown: 'Unknown Platform'
    },
    
    // Time & Date
    time: {
      updated: 'Updated',
      created: 'Created',
      scraped: 'Scraped',
      lastModified: 'Last Modified',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: 'days ago',
      hoursAgo: 'hours ago',
      minutesAgo: 'minutes ago',
      justNow: 'Just now'
    },
    
    // Donation Page
    donation: {
      title: 'Support Our Project',
      subtitle: 'Help us maintain and improve the ShopBack management platform',
      chooseAmount: 'Choose Donation Amount',
      presetAmounts: 'Quick Amounts',
      customAmount: 'Custom Amount',
      amountPlaceholder: 'Enter amount (USD)',
      donorName: 'Your Name',
      namePlaceholder: 'Enter your name',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      message: 'Leave a Message',
      messagePlaceholder: 'Share your thoughts or suggestions...',
      optional: 'optional',
      paymentMethods: 'Payment Methods',
      total: 'Total Amount',
      payWithPayPal: 'Donate with PayPal',
      payWithCard: 'Donate with Credit Card',
      payWithCrypto: 'Donate with Cryptocurrency',
      processing: 'Processing your donation...',
      invalidAmount: 'Please enter a valid amount',
      thankYou: 'Thank you for your generous donation! ',
      error: 'Donation failed. Please try again.',
      aboutProject: 'About This Project',
      whatWeDo: 'What We Do',
      projectDescription: 'We provide a comprehensive cashback monitoring platform that helps users track and compare cashback rates across multiple platforms, ensuring you never miss the best deals.',
      howHelpUs: 'How Your Donation Helps',
      serverCosts: 'Server hosting and maintenance costs',
      development: 'Continuous development and improvement',
      maintenance: 'Bug fixes and security updates',
      newFeatures: 'Adding new features and platforms',
      transparency: 'Transparency',
      transparencyText: 'We believe in transparency. All donations are used exclusively for project development and maintenance. We regularly update our community on how funds are utilized.',
      topDonors: 'Top Supporters'
    },
    
    // Validation Messages
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      invalidUrl: 'Invalid URL format',
      mustBePositive: 'Value must be positive',
      tooLong: 'Text is too long',
      tooShort: 'Text is too short'
    }
  },
  
  'zh-CN': {
    // Navigation & General
    nav: {
      dashboard: 'ShopBack管理',
      trading: '交易图表',
      donations: '项目捐赠'
    },
    common: {
      close: '关闭',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '信息'
    },
    
    // Dashboard
    dashboard: {
      title: 'ShopBack Cashback 管理平台',
      subtitle: '全面的返现监控和分析平台',
      totalStores: '总商家数',
      totalRecords: '总记录数',
      recentScrapes: '24小时抓取',
      upsizedStores: 'Upsized商家',
      avgCashback: '平均Cashback率',
      rescrape: '重新抓取并刷新',
      rescraping: '正在重新抓取...',
      alerts: '价格提醒管理',
      closeAlerts: '关闭价格提醒',
      deploySuccess: '恭喜！ShopBack管理平台部署成功！',
      deployDesc: '所有功能正常工作，API连接正常，数据加载成功。'
    },
    
    // Stores Management
    stores: {
      title: '商家列表',
      count: '个商家',
      addNew: '添加新商家',
      addUrl: '输入ShopBack或CashRewards商家页面URL...',
      adding: '添加中...',
      add: '添加',
      addSuccess: '商家添加成功！',
      addError: '添加商家失败',
      updateTime: '更新时间',
      noStores: '暂无商家数据',
      clickForDetails: '点击查看详情',
      storeDetails: '商家详情',
      cashbackHistory: 'Cashback历史记录',
      noHistory: '暂无历史数据'
    },
    
    // Upsized Stores
    upsized: {
      title: 'Upsized优惠商家',
      description: '当前提供增强返现率的商家',
      previous: '之前',
      originalPrice: '原价',
      scraped: '抓取时间',
      badge: 'UPSIZED',
      noStores: '当前没有Upsized商家'
    },
    
    // Store Comparison
    compare: {
      title: '商家比较',
      subtitle: '比较不同平台的返现率',
      available: '可比较商家',
      description: '这些商家在多个平台都有数据，点击可查看费率比较',
      platforms: '平台',
      clickToCompare: '点击比较 →',
      bestChoice: '最佳选择',
      cashbackRate: 'Cashback率',
      lastUpdated: '更新时间',
      shopback: 'ShopBack',
      cashrewards: 'CashRewards',
      best: '最佳',
      suggestions: '使用建议',
      tip1: '选择费率更高的平台可以获得更多返现',
      tip2: '注意查看各平台的条款和限制',
      tip3: 'UPSIZED标签表示限时提升的优惠',
      tip4: '数据会定期更新，建议购买前再次确认'
    },
    
    // Price Alerts
    alerts: {
      title: '价格提醒管理',
      description: '当返现率达到您设定的条件时获得通知',
      email: '邮箱地址',
      emailPlaceholder: '输入您的邮箱地址',
      loadAlerts: '加载我的提醒',
      createNew: '创建新提醒',
      storeUrl: '商家URL',
      storeUrlPlaceholder: '输入ShopBack商家页面URL...',
      thresholdType: '提醒类型',
      threshold: '阈值 (%)',
      thresholdPlaceholder: '输入数值',
      create: '创建提醒',
      creating: '创建中...',
      myAlerts: '我的提醒列表',
      delete: '删除',
      testEmail: '测试邮件',
      testEmailSuccess: '测试邮件发送成功',
      testEmailError: '测试邮件发送失败',
      createSuccess: '价格提醒创建成功！',
      createError: '创建提醒失败',
      deleteSuccess: '提醒已删除',
      deleteError: '删除失败',
      noAlerts: '暂无价格提醒',
      alertCondition: '提醒条件',
      createdTime: '创建时间',
      website: '网址',
      fillAllFields: '请填写所有必需字段',
      enterEmail: '请输入邮箱地址',
      loadError: '加载提醒失败'
    },
    
    // Alert Types
    alertTypes: {
      aboveCurrent: '高于当前比例',
      fixedValue: '达到固定值',
      percentageIncrease: '涨幅百分比'
    },
    
    // Statistics & History
    stats: {
      historicalData: '历史数据',
      highestRate: '史高',
      lowestRate: '史低',
      currentIsHighest: '当前为史高！',
      currentIsLowest: '当前为史低',
      differenceFromHigh: '史高差距',
      mainOffer: '主要优惠',
      category: '分类',
      termsConditions: '条款与条件'
    },
    
    // Trading Page
    trading: {
      title: 'TradingView图表',
      selectSymbol: '选择交易对',
      theme: '主题',
      darkTheme: '🌙 深色主题',
      lightTheme: '浅色主题',
      quickSwitch: '🚀 快速切换'
    },
    
    // Trading Symbols
    symbols: {
      bitcoin: '比特币 (BTC/USDT)',
      usdjpy: '美元日元',
      gold: '黄金 (XAU/USD)',
      eurjpy: '欧元日元',
      eurusd: '欧元美元',
      silver: '白银 (XAG/USD)'
    },
    
    // Messages & Status
    messages: {
      success: '成功！',
      error: '错误',
      warning: '警告',
      info: '信息',
      loading: '正在加载数据...',
      noData: '暂无数据',
      connectionError: '连接错误',
      retry: '重试',
      networkError: '网络连接失败',
      serverError: '服务器错误，请稍后重试',
      dataLoadError: '数据加载失败',
      operationSuccess: '操作成功完成',
      operationFailed: '操作失败'
    },
    
    // Platform Detection
    platforms: {
      shopback: 'ShopBack',
      cashrewards: 'CashRewards',
      rakuten: 'Rakuten',
      topcashback: 'TopCashback',
      unknown: '未知平台'
    },
    
    // Time & Date
    time: {
      updated: '更新时间',
      created: '创建时间',
      scraped: '抓取时间',
      lastModified: '最后修改',
      today: '今天',
      yesterday: '昨天',
      daysAgo: '天前',
      hoursAgo: '小时前',
      minutesAgo: '分钟前',
      justNow: '刚刚'
    },
    
    // Donation Page
    donation: {
      title: '支持我们的项目',
      subtitle: '帮助我们维护和改进 ShopBack 管理平台',
      chooseAmount: '选择捐赠金额',
      presetAmounts: '快速金额',
      customAmount: '自定义金额',
      amountPlaceholder: '输入金额 (美元)',
      donorName: '您的姓名',
      namePlaceholder: '输入您的姓名',
      email: '邮箱地址',
      emailPlaceholder: '输入您的邮箱',
      message: '留言',
      messagePlaceholder: '分享您的想法或建议...',
      optional: '可选',
      paymentMethods: '支付方式',
      total: '总金额',
      payWithPayPal: '使用 PayPal 捐赠',
      payWithCard: '使用信用卡捐赠',
      payWithCrypto: '使用加密货币捐赠',
      processing: '正在处理您的捐赠...',
      invalidAmount: '请输入有效金额',
      thankYou: '感谢您的慷慨捐赠！',
      error: '捐赠失败，请重试。',
      aboutProject: '关于这个项目',
      whatWeDo: '我们的工作',
      projectDescription: '我们提供一个全面的返利监控平台，帮助用户跟踪和比较多个平台的返利率，确保您不错过任何优惠。',
      howHelpUs: '您的捐赠如何帮助我们',
      serverCosts: '服务器托管和维护成本',
      development: '持续开发和改进',
      maintenance: '错误修复和安全更新',
      newFeatures: '添加新功能和平台',
      transparency: '透明度',
      transparencyText: '我们相信透明度。所有捐赠都专门用于项目开发和维护。我们定期向社区更新资金使用情况。',
      topDonors: '主要支持者'
    },
    
    // Validation Messages
    validation: {
      required: '此字段为必填项',
      invalidEmail: '邮箱格式不正确',
      invalidUrl: 'URL格式不正确',
      mustBePositive: '数值必须为正数',
      tooLong: '文本过长',
      tooShort: '文本过短'
    }
  }
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
  return language in translations;
};