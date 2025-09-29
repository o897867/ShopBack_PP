// translations/index.js - 修复后的完整翻译文件（嵌套对象结构）
export const translations = {
  en: {
    // Navigation & General
    nav: {
      dashboard: 'ShopBack Management',
      brokerHub: 'Broker Hub',
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

    // Broker Hub
    brokerHub: {
      brand: 'ShopBack Intelligence Lab',
      back: '← Back to main',
      pageTitle: 'Broker Hub',
      nav: {
        brokers: 'Brokers',
        ranking: 'Ranking',
        community: 'Community'
      },
      hero: {
        eyebrow: 'Daily radar for serious traders',
        title: 'Build clarity with our broker, ranking & community hub.',
        description: 'A lightweight control room inspired by WikiFX, reimagined with our tone and visual language.',
        explore: 'Explore brokers',
        joinCommunity: 'Join the community',
        metricsTitle: 'Live oversight'
      },
      actions: {
        retry: 'Try again',
        refresh: 'Refresh data'
      },
      loading: 'Pulling fresh intelligence…',
      errors: {
        loadFailed: 'Unable to load broker data right now.'
      },
      metrics: {
        brokers: {
          label: 'Brokers tracked',
          helper: '{{count}} listings monitored'
        },
        alerts: {
          label: 'News updates this week',
          helper: '{{count}} curated items'
        },
        sentiment: {
          label: 'Active community voices',
          helper: '{{count}} unique contributors'
        }
      },
      sections: {
        brokers: {
          title: 'Broker Intelligence',
          subtitle: 'Curated insights on the most active brokers in our universe.',
          ratingLabel: 'Risk score',
          metrics: {
            regulators: 'Regulators',
            rating: 'Rating',
            website: 'Official site',
            noData: 'Not available'
          },
          featureTemplate: '{{label}} · {{score}}',
          regulatorTooltipLicense: 'License: {{value}}',
          regulatorTooltipNote: 'Note: {{value}}',
          actions: {
            visitSite: 'Visit website',
            compare: 'Compare soon'
          },
          empty: 'No broker profiles available yet.'
        },
        ranking: {
          title: 'Broker Ranking',
          subtitle: 'Real-time movement based on trust score, liquidity and user momentum.',
          compositeLabel: 'Composite score',
          updatesTitle: 'Market Signals',
          summaryTemplate: 'Highlight: {{feature}} ({{score}}). Grade {{rating}}.',
          summaryFallback: 'Grade {{rating}}.',
          updateTemplate: '{{broker}} • {{tag}}',
          updateFallback: 'Update from {{broker}}',
          empty: 'No ranking data yet.',
          emptyUpdates: 'No market signals yet.'
        },
        community: {
          title: 'Community Pulse',
          subtitle: 'Stay on top of conversations, verified feedback and collaboration opportunities.',
          trendingTitle: 'Trending Discussions',
          statsTitle: 'Community Stats',
          eventsTitle: 'Latest Signals',
          remindMe: 'Remind me',
          defaultTag: 'Forum',
          threadSummary: 'Started by {{author}}',
          threadSummaryNoAuthor: 'Latest activity {{time}}',
          participantCount: '{{count}} participants',
          commentCount: '{{count}} replies',
          stats: {
            activeContributors: 'Active contributors',
            threadsThisWeek: 'Threads this week',
            totalPosts: 'Posts analysed'
          },
          eventsFromNews: 'Update from {{broker}}',
          emptyFeed: 'No community conversations yet.',
          emptyEvents: 'No recent signals.'
        }
      },
      ratingBreakdown: {
        regulation: 'Regulation strength',
        transparency: 'Transparency & compliance',
        tradingCost: 'Trading cost',
        execution: 'Execution & liquidity',
        platform: 'Platform & products',
        service: 'Service & education',
        stability: 'Stability & reputation'
      }
    },
    
    // Forum
    forum: {
      title: 'Forum',
      subtitle: 'Supports basic formatting (bold, italics, lists, quotes, links). Image uploads are currently disabled and posts may require moderation.',
      common: {
        loggedIn: 'Logged in: {{name}}',
        namePlaceholder: 'Your name (optional)',
        refresh: 'Refresh',
        anonymous: 'anonymous',
        loading: 'Loading…',
        counter: '{{current}}/{{limit}}',
        status: {
          pending: 'pending',
          published: 'published'
        }
      },
      newThread: {
        title: 'New Thread',
        titlePlaceholder: 'Title (max {{limit}} characters)',
        contentPlaceholder: 'Content (basic HTML supported; images disabled)',
        hint: 'Tip: Be respectful. Posts containing sensitive words or suspicious links may be held for moderation.',
        loginRequired: 'Login required to post → go to “Login”',
        create: 'Create Thread',
        creating: 'Creating…'
      },
      threadList: {
        title: 'Threads',
        badge: 'thread',
        empty: 'No threads yet—be the first to post!',
        by: 'by {{author}}'
      },
      threadDetail: {
        selectPrompt: 'Select a thread to view posts',
        by: 'by {{author}}',
        noPosts: 'No visible posts yet. If you just created the thread, the first post may still be under review.'
      },
      reply: {
        title: 'Reply',
        placeholder: 'Reply content (basic HTML supported; images disabled)',
        loginRequired: 'Login required to reply → go to “Login”',
        send: 'Send Reply'
      },
      metrics: {
        liveThreads: 'Threads live',
        activeMembers: 'Active members',
        newActivity: 'Updates today'
      },
      errors: {
        loadThreads: 'Failed to load threads',
        createThread: 'Failed to create thread',
        sendReply: 'Failed to reply',
        openThread: 'Failed to load thread'
      }
    },

    // Auth
    auth: {
      login: {
        nav: 'Login',
        title: 'Login',
        subtitle: 'Access the forum and broker hub with your credentials.',
        usernameLabel: 'Username',
        usernamePlaceholder: '3–20 characters, letters/numbers/underscore',
        passwordLabel: 'Password',
        passwordPlaceholder: 'At least 8 characters with letters and numbers',
        submit: 'Login',
        submitting: 'Logging in…',
        error: 'Unable to login right now.'
      },
      register: {
        nav: 'Register',
        title: 'Create account',
        subtitle: 'Join the community and manage your broker intelligence.',
        usernameLabel: 'Username',
        usernamePlaceholder: '3–20 characters, letters/numbers/underscore',
        passwordLabel: 'Password',
        passwordPlaceholder: 'At least 8 characters with letters and numbers',
        roleLabel: 'Account role',
        brokerLabel: 'Linked broker',
        roles: {
          trader: 'Trader',
          agent: 'Introducing broker'
        },
        submit: 'Register',
        submitting: 'Submitting…',
        success: 'Registration successful. You can now login.',
        error: 'Unable to register right now.'
      }
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
      previous: 'Previous',
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
      darkTheme: 'Dark Theme',
      lightTheme: 'Light Theme',
      quickSwitch: 'Quick Switch'
    },
    
    // Leverage Calculator
    leverage: {
      title: 'Leverage Trading Calculator',
      comprehensiveAnalysis: 'Comprehensive Analysis',
      stopLossCalculation: 'Stop Loss Calculation',
      tradingParameters: 'Trading Parameters',
      tradingPair: 'Trading Pair',
      direction: 'Direction',
      long: 'Long',
      short: 'Short',
      principal: 'Principal (USDT)',
      leverage: 'Leverage',
      entryPrice: 'Entry Price',
      currentPrice: 'Current Price',
      positionSize: 'Position Size',
      useMaxPosition: 'Use Max Position',
      customPositionPlaceholder: 'Enter custom position',
      maxAvailable: 'Max Available',
      symbolPlaceholder: 'e.g., BTCUSDT',
      maxLossAmount: 'Max Loss Amount (USDT)',
      calculating: 'Calculating...',
      calculate: 'Calculate Analysis',
      calculateStopLoss: 'Calculate Stop Loss',
      analysisResults: 'Analysis Results',
      positionInfo: 'Position Information',
      totalPositionValue: 'Total Position Value',
      positionSizeLots: 'Position Size',
      liquidationInfo: 'Liquidation Information (40% Margin)',
      liquidationPrice: 'Liquidation Price',
      priceNeedsToMove: 'Price needs to move',
      priceChange: 'Price Change',
      currentPnl: 'Current P&L',
      pnlAmount: 'P&L Amount',
      pnlPercentage: 'P&L Percentage',
      marginLevel: 'Margin Level',
      currentEquity: 'Current Equity',
      riskLevels: 'Risk Level Reference',
      liquidation: 'Liquidation',
      stopLossResults: 'Stop Loss Calculation Results',
      targetStopLoss: 'Target Stop Loss Position',
      stopLossPrice: 'Stop Loss Price',
      maxLossAmountLabel: 'Max Loss Amount',
      priceChangePercentage: 'Price Change Percentage',
      detailsAtPrice: 'Details at This Price',
      remainingEquity: 'Remaining Equity',
      triggerLiquidation: 'Trigger Liquidation',
      yes: 'Yes',
      no: 'No',
      up: 'up',
      down: 'down'
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
    
    // Performance Metrics
    performance: {
      title: 'System Performance Metrics',
      scraping: 'Scraping Performance',
      dataScale: 'Data Scale',
      alertLatency: 'Alert Latency',
      concurrency: 'Concurrency',
      requestsPerMinute: 'Requests/Min',
      avgResponseTime: 'Avg Response Time',
      successRate: 'Success Rate',
      totalStores: 'Total Stores',
      totalRecords: 'History Records',
      dailyNewRecords: 'Daily New Records',
      p95Latency: '95th Percentile Latency',
      minutes: 'minutes',
      latencyDesc: 'From rate change to email delivery'
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
    
    // Showcase Page
    showcase: {
      title: 'Showcase',
      categories: 'Categories',
      events: 'Events',
      submittedBy: 'Submitted by',
      createdAt: 'Created',
      back: 'Back',
      sections: {
        stocks: 'Stocks',
        crypto: 'Crypto'
      },
      noBrokers: 'No brokers available',
      overallScore: 'Overall Score',
      basicInfo: 'Basic Information',
      name: 'Name',
      category: 'Category',
      regulators: 'Regulators',
      rating: 'Rating',
      website: 'Official Website',
      ratingBreakdown: 'Rating Breakdown',
      weight: 'Weight',
      score: 'Score',
      companyNews: 'Company News',
      noNews: 'No news',
      update: 'Update',
      placeholderContent: 'Placeholder Content',
      comingSoon: 'Coming Soon',
      cfdBroker: 'CFD Broker',
      breakdownKeys: {
        regulation: 'Regulation & Safety',
        fees: 'Fees',
        spreads: 'Spreads',
        platform: 'Platform & Tools',
        products: 'Products & Markets',
        execution: 'Execution',
        reliability: 'Reliability',
        support: 'Customer Support',
        education: 'Education',
        research: 'Research',
        'education-research': 'Education & Research',
        funding: 'Funding & Withdrawals',
        overall: 'Overall'
      }
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
      brokerHub: '经纪商控制台',
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

    // Broker Hub
    brokerHub: {
      brand: 'ShopBack 情报实验室',
      back: '← 返回主页面',
      pageTitle: '经纪商控制台',
      nav: {
        brokers: '经纪商',
        ranking: '榜单',
        community: '社区'
      },
      hero: {
        eyebrow: '严肃交易者的每日雷达',
        title: '用我们的经纪商、榜单与社区枢纽构建清晰视角。',
        description: '参考 WikiFX 灵感，以我们的语气与视觉重新演绎的轻量控制室。',
        explore: '浏览经纪商',
        joinCommunity: '加入社区',
        metricsTitle: '实时监控面板'
      },
      actions: {
        retry: '重新尝试',
        refresh: '刷新数据'
      },
      loading: '正在获取最新情报…',
      errors: {
        loadFailed: '当前无法加载经纪商数据。'
      },
      metrics: {
        brokers: {
          label: '监控中的经纪商',
          helper: '当前追踪 {{count}} 家'
        },
        alerts: {
          label: '本周新闻更新',
          helper: '共整理 {{count}} 条'
        },
        sentiment: {
          label: '社区活跃声音',
          helper: '过去 7 天 {{count}} 位贡献者'
        }
      },
      sections: {
        brokers: {
          title: '经纪商情报',
          subtitle: '甄选我们生态中最活跃的经纪商洞察。',
          ratingLabel: '风险评分',
          metrics: {
            regulators: '监管机构',
            rating: '评级',
            website: '官方网址',
            noData: '暂无数据'
          },
          featureTemplate: '{{label}} · {{score}}',
          regulatorTooltipLicense: '许可证号：{{value}}',
          regulatorTooltipNote: '备注：{{value}}',
          actions: {
            visitSite: '访问官网',
            compare: '对比功能即将上线'
          },
          empty: '暂未上线经纪商档案。'
        },
        ranking: {
          title: '经纪商榜单',
          subtitle: '基于信任度、流动性与用户动量的实时变动。',
          compositeLabel: '综合评分',
          updatesTitle: '市场信号',
          summaryTemplate: '亮点：{{feature}}（{{score}}）。评级 {{rating}}。',
          summaryFallback: '评级 {{rating}}。',
          updateTemplate: '{{broker}} • {{tag}}',
          updateFallback: '{{broker}} 最新动态',
          empty: '暂无榜单数据。',
          emptyUpdates: '暂无市场信号。'
        },
        community: {
          title: '社区脉动',
          subtitle: '掌握讨论热点、验证反馈与协作机会。',
          trendingTitle: '热议话题',
          statsTitle: '社区数据',
          eventsTitle: '最新信号',
          remindMe: '提醒我',
          defaultTag: '社区',
          threadSummary: '发帖人：{{author}}',
          threadSummaryNoAuthor: '最新活动 {{time}}',
          participantCount: '{{count}} 位参与者',
          commentCount: '{{count}} 条回复',
          stats: {
            activeContributors: '活跃贡献者',
            threadsThisWeek: '本周主题',
            totalPosts: '分析帖子数'
          },
          eventsFromNews: '{{broker}} 最新动态',
          emptyFeed: '暂无社区讨论。',
          emptyEvents: '暂无最新提醒。'
        }
      },
      ratingBreakdown: {
        regulation: '监管强度',
        transparency: '透明度与合规',
        tradingCost: '交易成本',
        execution: '执行与流动性',
        platform: '平台与产品',
        service: '服务与教育',
        stability: '稳定性与口碑'
      }
    },

    // Forum
    forum: {
      title: '社区论坛',
      subtitle: '支持基础格式（粗体、斜体、列表、引用、链接）。暂不支持图片上传，内容可能进入人工审核。',
      common: {
        loggedIn: '已登录：{{name}}',
        namePlaceholder: '昵称（可选）',
        refresh: '刷新',
        anonymous: '匿名',
        loading: '加载中…',
        counter: '{{current}}/{{limit}}',
        status: {
          pending: '待审核',
          published: '已发布'
        }
      },
      newThread: {
        title: '发表主题',
        titlePlaceholder: '标题（最多 {{limit}} 字）',
        contentPlaceholder: '内容（支持基础 HTML；不支持图片）',
        hint: '提示：请文明发言，包含敏感词或异常链接的内容将进入审核。',
        loginRequired: '登录后才能发帖 → 前往“Login”',
        create: '发布主题',
        creating: '发布中…'
      },
      threadList: {
        title: '主题列表',
        badge: '主题',
        empty: '暂无主题，快来发布第一条帖子吧！',
        by: '作者：{{author}}'
      },
      threadDetail: {
        selectPrompt: '选择一个主题查看内容',
        by: '作者：{{author}}',
        noPosts: '该主题暂无可见帖子。若你刚刚创建了主题，首帖可能仍在审核中。'
      },
      reply: {
        title: '回复',
        placeholder: '回复内容（支持基础 HTML；不支持图片）',
        loginRequired: '登录后才能回复 → 前往“Login”',
        send: '发送回复'
      },
      metrics: {
        liveThreads: '正在活跃的主题',
        activeMembers: '活跃成员',
        newActivity: '今日更新'
      },
      errors: {
        loadThreads: '主题加载失败',
        createThread: '创建主题失败',
        sendReply: '回复失败',
        openThread: '主题内容加载失败'
      }
    },

    // Auth
    auth: {
      login: {
        nav: '登录',
        title: '登录',
        subtitle: '使用账号访问论坛与经纪商控制台。',
        usernameLabel: '用户名',
        usernamePlaceholder: '3-20 位，仅限字母/数字/下划线',
        passwordLabel: '密码',
        passwordPlaceholder: '至少 8 位，需包含字母和数字',
        submit: '登录',
        submitting: '登录中…',
        error: '当前无法登录，请稍后再试。'
      },
      register: {
        nav: '注册',
        title: '创建账号',
        subtitle: '加入社区并管理你的经纪商情报。',
        usernameLabel: '用户名',
        usernamePlaceholder: '3-20 位，仅限字母/数字/下划线',
        passwordLabel: '密码',
        passwordPlaceholder: '至少 8 位，需包含字母和数字',
        roleLabel: '账号角色',
        brokerLabel: '关联经纪商',
        roles: {
          trader: '交易者',
          agent: '代理'
        },
        submit: '注册',
        submitting: '提交中…',
        success: '注册成功，现在可以前往登录。',
        error: '当前无法注册，请稍后再试。'
      }
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
      previous: '之前',
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
      darkTheme: '深色主题',
      lightTheme: '浅色主题',
      quickSwitch: '快速切换'
    },
    
    // Leverage Calculator
    leverage: {
      title: '杠杆交易计算器',
      comprehensiveAnalysis: '综合分析',
      stopLossCalculation: '止损计算',
      tradingParameters: '交易参数',
      tradingPair: '交易对',
      direction: '方向',
      long: '做多 (Long)',
      short: '做空 (Short)',
      principal: '本金 (USDT)',
      leverage: '杠杆倍数',
      entryPrice: '入场价格',
      currentPrice: '当前价格',
      positionSize: '仓位大小',
      useMaxPosition: '使用最大仓位',
      customPositionPlaceholder: '输入自定义仓位',
      maxAvailable: '最大可用',
      symbolPlaceholder: '例如: BTCUSDT',
      maxLossAmount: '最大亏损金额 (USDT)',
      calculating: '计算中...',
      calculate: '计算分析',
      calculateStopLoss: '计算止损价格',
      analysisResults: '分析结果',
      positionInfo: '持仓信息',
      totalPositionValue: '总仓位价值',
      positionSizeLots: '仓位大小',
      liquidationInfo: '强制平仓信息（保证金40%）',
      liquidationPrice: '强平价格',
      priceNeedsToMove: '价格需要',
      priceChange: '价格变动',
      currentPnl: '当前盈亏',
      pnlAmount: '盈亏金额',
      pnlPercentage: '盈亏比例',
      marginLevel: '保证金水平',
      currentEquity: '当前权益',
      riskLevels: '风险级别参考',
      liquidation: '强制平仓',
      stopLossResults: '止损计算结果',
      targetStopLoss: '目标止损位置',
      stopLossPrice: '止损价格',
      maxLossAmountLabel: '最大亏损金额',
      priceChangePercentage: '价格变动百分比',
      detailsAtPrice: '该价格下的详细信息',
      remainingEquity: '剩余权益',
      triggerLiquidation: '是否触发强平',
      yes: '是',
      no: '否',
      up: '上涨',
      down: '下跌'
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
    
    // Performance Metrics
    performance: {
      title: '系统性能指标',
      scraping: '抓取性能',
      dataScale: '数据规模',
      alertLatency: '告警时效',
      concurrency: '并发量',
      requestsPerMinute: '每分钟请求数',
      avgResponseTime: '平均响应时间',
      successRate: '成功率',
      totalStores: '商家数',
      totalRecords: '历史记录量',
      dailyNewRecords: '每日新增量',
      p95Latency: '95分位延迟',
      minutes: '分钟',
      latencyDesc: '从费率变化到邮件送达'
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
    
    // Showcase Page
    showcase: {
      title: '展示',
      categories: '分类',
      events: '事件',
      submittedBy: '提交者',
      createdAt: '创建时间',
      back: '返回',
      sections: {
        stocks: '股票',
        crypto: '虚拟币'
      },
      noBrokers: '暂无经纪商数据',
      overallScore: '综合评分',
      basicInfo: '基础信息',
      name: '名称',
      category: '类别',
      regulators: '监管',
      rating: '评分',
      website: '官方网址',
      ratingBreakdown: '评分拆解',
      weight: '权重',
      score: '得分',
      companyNews: '公司消息',
      noNews: '暂无新闻',
      update: '更新',
      placeholderContent: '内容预留',
      comingSoon: '敬请期待',
      cfdBroker: 'CFD 经纪商',
      breakdownKeys: {
        regulation: '监管与安全',
        fees: '费用',
        spreads: '点差',
        platform: '平台与工具',
        products: '产品与市场',
        execution: '执行',
        reliability: '可靠性',
        support: '客服支持',
        education: '教育',
        research: '研究',
        'education-research': '教育与研究',
        funding: '出入金',
        overall: '总体'
      }
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
