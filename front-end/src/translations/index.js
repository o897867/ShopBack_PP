// translations/index.js - 修复后的完整翻译文件（嵌套对象结构）
export const translations = {
  en: {
    // Navigation & General
    nav: {
      indicators: 'Indicator Testing',
      dashboard: 'ShopBack Management',
      home: 'Workspace Home',
      brokerHub: 'Broker Hub',
      analytics: 'Broker Analytics',
      trading: 'TradingView',
      ethPrediction: 'ETH Price Prediction',
      news: 'Financial News',
      health: 'Health Trading',
      healthToken: 'Health Token',
      healthMatch: 'K-Line Matcher',
      fortune: 'Fortune Timing',
      leverage: 'Leverage Calculator',
      guide: 'User Guide',
      donations: 'Donations',
      groups: {
        explore: 'Explore',
        health: 'Health & Fitness',
        community: 'Community',
        account: 'Account'
      },
      badges: {
        recommended: 'Recommended',
        new: 'NEW'
      },
      logout: 'Logout'
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
      info: 'Information',
      clear: 'Clear',
      selected: 'Selected {{count}} brokers',
      back: 'Back',
      loading: 'Loading'
    },
    // News Module Translations
    news: {
      title: 'Financial News',
      subtitle: 'Where the wise listen to the whispers of the market',
      eyebrow: 'Real-time Financial News',
      searchPlaceholder: 'Search news...',
      filterSymbol: 'Symbol',
      filterSentiment: 'Sentiment',
      allSymbols: 'All Symbols',
      allCategories: 'All Categories',
      allImpacts: 'All Impact Levels',
      allSentiments: 'All Sentiments',
      category: {
        tech_stocks: 'Tech Stocks',
        market_indices: 'Market Indices',
        precious_metals: 'Precious Metals',
        bonds: 'Bonds',
        forex: 'Forex',
        central_banks: 'Central Banks',
        monetary_policy: 'Monetary Policy',
        crypto: 'Crypto'
      },
      sentiment: {
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral'
      },
      impact: {
        high: 'High Impact',
        medium: 'Medium Impact',
        low: 'Low Impact'
      },
      refresh: 'Refresh',
      autoRefreshOn: 'Auto Refresh ON',
      autoRefreshOff: 'Auto Refresh OFF',
      lastUpdate: 'Last updated',
      loading: 'Loading news...',
      noNews: 'No news available',
      totalNews: 'Total News',
      openOriginal: 'Open original article',
      fetchError: 'Failed to fetch news',
      newUpdate: 'New news update received',
      summarized: 'Summarized',
      titleOnly: 'Title Only',
      aiNote: 'Important news summarized by the most advanced AI model - ChatGPT',
      importantNews: 'Important News (With Summary)',
      otherNews: 'Other News (Title Only)',
      totalCount: 'Total {{count}}',
      noImportantNews: 'No important news yet',
      noOtherNews: 'No other news yet',
      timeAgo: {
        seconds: '{{count}} seconds ago',
        minutes: '{{count}} minutes ago',
        hours: '{{count}} hours ago'
      }
    },
    // Health Module Translations
    health: {
      title: 'Health Trading Platform',
      subtitle: 'Trade Your Weight Like a Pro Trader',
      marketStatus: 'Body Market Status',
      currentPosition: 'Current Position',
      targetPosition: 'Target Position',
      trend: 'Market Trend',
      daysToTarget: 'Days to Target',
      progressToTarget: 'Progress to Target',
      dailyLog: 'Daily Trading Log',
      enterWeight: 'Enter today\'s weight',
      logWeight: 'Log Position',
      weightLogged: 'Position Logged',
      setTargets: 'Set Trading Targets',
      targetWeight: 'Target Weight (kg)',
      targetDate: 'Target Date',
      updateTargets: 'Update Targets',
      analysis: 'Market Analysis',
      requiredChange: 'Required Change',
      dailyTarget: 'Daily Target',
      riskTolerance: 'Risk Tolerance',
      quickActions: 'Quick Actions',
      matchKline: 'Match K-Line',
      matchDesc: 'Find your market twin',
      logTraining: 'Log Training',
      burnCalories: 'Burn calories like fees',
      viewStats: 'View Stats',
      analytics: 'Advanced analytics',
      weightHistory: 'Position History',
      timeframe: 'Timeframe',
      days: 'days',
      symbol: 'Market Symbol',
      autoBest: 'Auto (Best Match)',
      matching: 'Matching...',
      findMatch: 'Find Match',
      matchFound: 'Match Found!',
      matchedWith: 'Matched With',
      similarityScore: 'Similarity Score',
      period: 'Match Period',
      performance: 'Performance',
      yourPerformance: 'Your Performance',
      weightLoss: 'weight change',
      generating: 'Generating...',
      shareResult: 'Share Result',
      tryAgain: 'Try Another Match',
      shareCopied: 'Share link copied!',
      market: 'Market',
      weightChange: 'Weight Change %',
      marketChange: 'Market Change %',
      similarity: 'similarity',
      matchTitle: 'Weight vs Market',
      calories: {
        budget: 'Calorie Trading Budget',
        dailyBudget: 'Daily Budget',
        burned: 'Calories Burned',
        remaining: 'Remaining',
        deficit: 'Calorie Deficit',
        surplus: 'Calorie Surplus'
      },
      weight: {
        bullish: 'Bullish (Loss)',
        bearish: 'Bearish (Gain)',
        consolidation: 'Consolidating'
      },
      risk: {
        conservative: 'Conservative',
        moderate: 'Moderate',
        aggressive: 'Aggressive'
      },
      riskLevel: 'Risk Level',
      tabs: {
        dashboard: 'Trading Dashboard',
        targets: 'Position Targets',
        history: 'Trade History'
      },
      klineMatch: {
        title: 'Weight K-Line Matcher',
        subtitle: 'Discover which market matches your journey'
      },
      tips: {
        title: 'Pro Trading Tips',
        tip1: 'More data = Better matching',
        tip2: 'Consistent logging improves accuracy',
        tip3: 'Try different timeframes',
        tip4: 'Share your matches!'
      },
      messages: {
        perfect: 'Incredible! Your journey mirrors {{symbol}}\'s legendary move!',
        excellent: 'Amazing! Tracking {{symbol}} like a pro!',
        good: 'Good correlation with {{symbol}}!',
        interesting: 'Interesting similarity with {{symbol}}!'
      },
      token: {
        title: 'Health Token Access',
        subtitle: 'Your personal 8-digit key to health tracking',
        enterToken: 'Enter Token',
        newToken: 'Generate New Token',
        generateTitle: 'Generate Your Personal Health Token',
        generateDesc: 'Create a unique 8-digit token based on your physical metrics',
        validateTitle: 'Enter Your Health Token',
        validateDesc: 'Verify your identity with your personal token and metrics',
        height: 'Height',
        weight: 'Weight',
        age: 'Age',
        generate: 'Generate Token',
        generating: 'Generating...',
        validate: 'Validate Token',
        validating: 'Validating...',
        success: 'Token Generated Successfully!',
        copy: 'Copy',
        copied: 'Copied to clipboard!',
        recoveryCode: 'Recovery Code',
        saveNote: 'Save this token and recovery code securely!',
        yourToken: 'Your 8-Digit Token',
        verifyMetrics: 'Verify Your Metrics',
        accessGranted: 'Access Granted!',
        redirecting: 'Redirecting to your dashboard...',
        fillAllFields: 'Please fill in all fields',
        generateError: 'Error generating token. Please try again.',
        validateError: 'Invalid token or metrics. Please check your input.',
        howItWorks: 'How It Works',
        info1: 'Your token is generated from your height, weight, and age',
        info2: 'Each token is unique to your physical metrics',
        info3: 'Keep your token private - it\'s your personal key',
        info4: 'Use the recovery code if you forget your token',
        example: 'Example',
        exampleText: 'For someone with height {{height}}cm, weight {{weight}}kg, and age {{age}}, the token would be: {{token}}'
      }
    },
    home: {
      hero: {
        badge: 'Your broker operating system',
        title: 'One platform for broker intelligence',
        subtitle: 'Track brokers, analyze performance, and monitor market events in real-time.',
        primary: 'Get Started',
        secondary: 'View Analytics'
      },
      preview: {
        title: 'Top performers',
        badge: 'Live board',
        loading: 'Loading board…',
        empty: 'No brokers available yet.'
      },
      metrics: {
        brokers: 'Brokers',
        brokersHelper: 'tracked platforms',
        alerts: 'Events',
        alertsHelper: 'halt records',
        community: 'Users',
        communityHelper: 'active voices'
      },
      states: {
        loading: 'Pulling workspace data…',
        error: 'We could not load the workspace right now.',
        retry: 'Try again'
      },
      workspace: {
        title: 'Broker workspace',
        subtitle: 'Plan, prioritise and brief the next brokerage moves in a Monday.com-style board.',
        cta: 'Open detailed board'
      },
      board: {
        title: 'Acquisition pipeline',
        helper: 'Auto-ranked by composite risk score',
        column: {
          broker: 'Broker',
          status: 'Status',
          score: 'Score',
          regulators: 'Regulators',
          actions: 'Action'
        },
        status: {
          unknown: 'No status',
          live: 'Ready to activate',
          review: 'In review',
          watch: 'On watchlist',
          hold: 'Backlog'
        },
        focusFallback: 'No highlight captured yet',
        regulatorCount: '{{count}} regulators',
        viewProfile: 'Open profile'
      },
      highlight: {
        title: 'Spotlight',
        headline: '{{broker}} is leading this week',
        description: 'Composite {{score}} · Standout: {{focus}}',
        empty: 'Select a broker to populate the highlight.',
        cta: 'Deep-dive analytics'
      },
      quickActions: {
        title: 'Quick automations',
        launch: 'Launch',
        compare: {
          title: 'Spin up a comparison',
          description: 'Open the broker hub with filters pre-applied.'
        },
        analytics: {
          title: 'Check broker analytics',
          description: 'Review quadrants, trends and risk clusters.'
        },
        community: {
          title: 'Listen to the community',
          description: 'Jump into the forum to validate sentiment.'
        }
      },
      fortune: {
        title: 'Fortune timing',
        subtitle: 'A feng-shui flavored read on whether today vibes with placing an order.',
        refresh: 'Resets at local midnight · for vibes only, not financial advice.',
        tier: {
          lucky: 'Auspicious · qi is flowing',
          balanced: 'Balanced · wait for the right candle',
          cautious: 'Cautious · protect your chips'
        },
        fields: {
          verdict: 'Today\'s read',
          qi: 'Qi index',
          amulet: 'Mood talisman',
          ritual: 'Auspicious moves',
          avoid: 'Avoid for now',
          direction: 'Wealth direction',
          compass: 'Compass'
        },
        actions: {
          trade: 'Open chart',
          compare: 'Compare brokers first'
        }
      },
      leverage: {
        badge: 'Risk Calculator',
        title: 'US Stock Leverage Calculator',
        subtitle: 'Calculate margin requirements, liquidation risk, and position management for leveraged trading',
        inputs: {
          title: 'Input Parameters',
          totalFunds: 'Total Capital ($)',
          marketPrice: 'Market Price ($)',
          lots: 'Position Size (shares)',
          priceChange: 'Price Movement ($)',
          leverage: 'Leverage Ratio'
        },
        results: {
          title: 'Calculation Results',
          margin: 'Required Margin',
          originalEquity: 'Initial Equity',
          actualEquity: 'Current Equity',
          marginRatio: 'Margin Ratio',
          liquidationLine: 'Liquidation Threshold',
          priceChangeToLiquidation: 'Distance to Liquidation'
        },
        warnings: {
          critical: 'CRITICAL RISK: Your position is extremely close to liquidation!',
          high: 'HIGH RISK: Margin ratio is dangerously high. Consider reducing position size.',
          medium: 'MODERATE RISK: Monitor your position closely and manage risk carefully.'
        },
        formulas: {
          title: 'Calculation Formulas',
          margin: 'Required Margin',
          marginFormula: '(Market Price × Shares) ÷ Leverage',
          originalEquity: 'Initial Equity',
          originalEquityFormula: 'Total Capital - Required Margin',
          actualEquity: 'Current Equity',
          actualEquityFormula: 'Initial Equity ± (Price Movement × Shares)',
          marginRatio: 'Margin Ratio',
          marginRatioFormula: 'Required Margin ÷ Current Equity × 100%',
          liquidationLine: 'Liquidation Threshold',
          liquidationLineFormula: '0.4 × Required Margin',
          priceChangeToLiquidation: 'Distance to Liquidation',
          priceChangeToLiquidationFormula: '(Current Equity - Liquidation Threshold) ÷ Shares'
        }
      },
      timeline: {
        title: 'Live signal feed',
        subtitle: 'Curated alerts from regulators and community',
        empty: 'No signals in the last 48 hours.',
        newsFallback: '{{broker}} update',
        unknownBroker: 'Unknown broker',
        tagged: '{{broker}} • {{tag}}',
        generic: '{{broker}} shared a new signal',
        threadFallback: 'Community thread',
        threadBy: 'Thread by {{author}}',
        threadAnonymous: 'Thread from the community'
      },
      community: {
        title: 'Community heatmap',
        subtitle: 'Track sentiment before you commit capital.',
        cta: 'Open forum',
        stats: {
          voices: 'Active voices',
          threads: 'Threads this week',
          posts: 'Posts analysed'
        },
        feedTitle: 'Trending conversations',
        feedSubtitle: 'Signals from analysts and power users',
        feedFallback: 'Untitled conversation',
        anonymous: 'Anonymous',
        feedEmpty: 'No highlights yet — start a thread to warm things up.'
      }
    },

    // Broker Hub
    brokerHub: {
      brand: 'Forex Intelligence Lab',
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
      onboarding: {
        stepperTitle: 'Get started in 3 steps',
        steps: {
          step1: {
            title: 'Set your goal',
            description: 'Define what matters: low spreads, strong regulation, or beginner-friendly'
          },
          step2: {
            title: 'Compare brokers',
            description: 'Use quick filters and side-by-side comparison tools'
          },
          step3: {
            title: 'Join discussion',
            description: 'Get insights from the community and share your experience'
          }
        },
        ctaGo: 'Start here',
        firstVisit: {
          tooltip1: 'Select a broker card to start comparing',
          tooltip2: 'Check the ranking to see real-time movement',
          tooltip3: 'Great! You completed your first comparison',
          dismiss: 'Got it',
          skipAll: 'Skip tour'
        }
      },
      quickFilters: {
        title: 'Quick start scenarios',
        subtitle: 'Click a filter to highlight matching brokers',
        presets: {
          beginner: {
            title: 'Beginner friendly',
            description: 'High cashback + ASIC/FCA regulation'
          },
          lowCost: {
            title: 'Ultra-low spreads',
            description: 'Trading cost score ≥ 80'
          },
          topRegulation: {
            title: 'Strongest oversight',
            description: '3+ tier-1 regulators'
          }
        },
        clearFilter: 'Clear filter',
        showComparison: 'Compare selected'
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
          entityCount: '{{count}} entities',
          selected: 'Selected {{count}}',
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
          emptyUpdates: 'No market signals yet.',
          whyWatch: 'Track how brokers perform relative to each other over time',
          currentStep: 'Step 2 of 3'
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
          emptyEvents: 'No recent signals.',
          whyWatch: 'See what real traders are saying about their broker experiences',
          currentStep: 'Step 3 of 3'
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

    // Leverage Calculator Page
    leverageCalculator: {
      badge: 'Risk Calculator',
      title: 'Gold Futures Leverage Calculator',
      subtitle: '欲假其力，先察深渊之深。',
      loadingPrice: 'Loading real-time price...',
      currentGoldPrice: 'Current Gold Price',
      scenarios: {
        title: 'Select Calculation Scenario',
        scenario1: {
          title: 'Calculate Maximum Position',
          description: 'Find out the maximum position size you can open',
          input1: 'Total Capital',
          input2: 'Leverage Ratio',
          input3: 'Price Movement',
          output: '→ Maximum Lots'
        },
        scenario2: {
          title: 'Calculate Required Capital',
          description: 'Find out how much capital you need',
          input1: 'Price Movement',
          input2: 'Leverage Ratio',
          input3: 'Position Size',
          output: '→ Required Capital'
        },
        scenario3: {
          title: 'Calculate Liquidation Price',
          description: 'Find out at what price you will be liquidated',
          input1: 'Total Capital',
          input2: 'Market Price',
          input3: 'Position Size',
          input4: 'Leverage Ratio',
          output: '→ Liquidation Price'
        }
      },
      inputs: {
        title: 'Input Parameters',
        totalFunds: 'Total Capital ($)',
        marketPrice: 'Gold Price ($/oz)',
        lots: 'Position Size (lots)',
        priceChange: 'Price Movement ($/oz)',
        leverage: 'Leverage Ratio',
        contractSize: 'Contract Size',
        useLatest: 'Use Latest'
      },
      results: {
        title: 'Calculation Results',
        margin: 'Required Margin',
        originalEquity: 'Initial Equity',
        actualEquity: 'Liquidation Equity',
        marginRatio: 'Margin Ratio',
        liquidationLine: 'Liquidation Threshold',
        priceChangeToLiquidation: 'Distance to Liquidation',
        maxLots: 'Maximum Position Size',
        requiredFunds: 'Required Capital',
        liquidationPrice: 'Liquidation Price'
      },
      warnings: {
        critical: 'CRITICAL RISK: Your position is extremely close to liquidation!',
        high: 'HIGH RISK: Margin ratio is dangerously high. Consider reducing position size.',
        medium: 'MODERATE RISK: Monitor your position closely and manage risk carefully.'
      },
      formulas: {
        title: 'Calculation Formulas',
        margin: 'Required Margin',
        marginFormula: '(Market Price × Shares) ÷ Leverage',
        originalEquity: 'Initial Equity',
        originalEquityFormula: 'Total Capital - Required Margin',
        actualEquity: 'Current Equity',
        actualEquityFormula: 'Initial Equity ± (Price Movement × Shares)',
        marginRatio: 'Margin Ratio',
        marginRatioFormula: 'Required Margin ÷ Current Equity × 100%',
        liquidationLine: 'Liquidation Threshold',
        liquidationLineFormula: '0.4 × Required Margin',
        priceChangeToLiquidation: 'Distance to Liquidation',
        priceChangeToLiquidationFormula: '(Current Equity - Liquidation Threshold) ÷ Shares'
      }
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
    
    // Analytics - Broker Quadrant Analysis
    analytics: {
      title: 'Broker Quadrant Analysis',
      subtitle: 'Data-driven analysis based on multi-dimensional scoring to help you quickly identify broker advantages and positioning',

      // Configuration section
      configuration: {
        title: 'Analysis Configuration',
        xAxis: 'X-Axis Dimension:',
        yAxis: 'Y-Axis Dimension:',
        bubbleMetric: 'Bubble Size Metric:',
        regulatorFilter: 'Regulator Filter:',
        regulatorPlaceholder: 'e.g: ASIC,FCA,CySEC',
        ratingRange: 'Rating Range:',
        minRating: 'Min Rating',
        maxRating: 'Max Rating',
        to: 'to'
      },

      // Chart section
      chart: {
        title: 'Broker Quadrant Analysis Chart',
        controls: {
          size: 'Size:',
          sizeOptions: {
            small: 'Small (60%)',
            medium: 'Medium (75%)',
            large: 'Large (90%)'
          },
          fullscreen: 'Fullscreen View',
          exitFullscreen: 'Exit Fullscreen (ESC)',
          resetZoom: 'Reset Zoom (ESC)'
        },
        description: {
          xAxis: 'X-Axis:',
          yAxis: 'Y-Axis:',
          bubbleSize: 'Bubble Size:'
        },
        interaction: {
          hint: '💡 Drag to select area for zoom, ESC to reset zoom, click data points for details'
        }
      },

      // Tooltip
      tooltip: {
        overallRating: 'Overall Rating:',
        compositeScore: 'Composite Score:',
        regulatorCount: 'Number of Regulators:'
      },

      // Quadrant legends
      quadrants: {
        q1: {
          title: 'Top Right (Advantage Zone)',
          description: 'High {{xAxis}} + High {{yAxis}}'
        },
        q2: {
          title: 'Top Left (Potential Zone)',
          description: 'Low {{xAxis}} + High {{yAxis}}'
        },
        q3: {
          title: 'Bottom Left (Focus Zone)',
          description: 'Low {{xAxis}} + Low {{yAxis}}'
        },
        q4: {
          title: 'Bottom Right (Improvement Zone)',
          description: 'High {{xAxis}} + Low {{yAxis}}'
        }
      },

      // Statistics
      statistics: {
        title: 'Analysis Statistics',
        totalBrokers: 'Total Brokers:',
        advantageZone: 'Advantage Zone:',
        potentialZone: 'Potential Zone:',
        focusZone: 'Focus Zone:',
        improvementZone: 'Improvement Zone:',
        brokers: 'brokers'
      },

      // Loading and error states
      loading: 'Loading data...',
      error: 'Failed to load data',
      retry: 'Retry',

      // Dimensions (commonly used)
      dimensions: {
        regulation: 'Regulatory Strength',
        transparency: 'Transparency & Compliance',
        tradingCost: 'Trading Cost',
        execution: 'Execution & Liquidity',
        platform: 'Platform & Products',
        service: 'Service & Education',
        stability: 'Stability & Reputation',
        compositeScore: 'Composite Score'
      },

      // Dimension mapping (for backend Chinese keys)
      dimensionNames: {
        '监管强度': 'Regulatory Strength',
        '透明度与合规': 'Transparency & Compliance',
        '交易成本': 'Trading Cost',
        '执行与流动性': 'Execution & Liquidity',
        '平台与产品': 'Platform & Products',
        '服务与教育': 'Service & Education',
        '稳定性与口碑': 'Stability & Reputation',
        '综合影响力': 'Composite Score'
      },

    },

    // Broker Detail Modal
    brokerDetail: {
      compositeScore: 'Composite Score',
      basicInfo: 'Basic Information',
      brokerName: 'Broker Name',
      overallRating: 'Overall Rating',
      website: 'Official Website',
      unrated: 'Not rated',
      regulatoryInfo: 'Regulatory Information',
      regulators: 'Regulators',
      entities: 'entities',
      ratingBreakdown: 'Rating Breakdown',
      category: 'Category',
      score: 'Score',
      weight: 'Weight',
      close: 'Close',
      viewDetails: 'View Details',
      addToCompare: 'Add to Compare',
      removeFromCompare: 'Remove',
      visit: 'Visit',
      compare: 'Compare',
      remove: 'Remove',
      expandView: 'Expand ({{count}})',
      maxReached: 'Max comparison limit reached',
      canSelectMore: '{{count}} more can be selected',
      startComparison: 'Start Comparison ({{count}})',
      loading: 'Loading...'
    },

    // Broker Comparison Modal
    brokerComparison: {
      title: 'Broker Comparison Analysis',
      subtitle: 'Comparing {{count}} brokers',
      comparisonItems: 'Comparison Items',
      summary: 'Comparison Summary',
      loading: 'Loading comparison data...',
      noData: 'No comparison data available',
      removeBroker: 'Remove this broker',
      closeComparison: 'Close comparison',
      tip: '💡 Click × to remove individual brokers and re-compare'
    },

    // Validation Messages
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      invalidUrl: 'Invalid URL format',
      mustBePositive: 'Value must be positive',
      tooLong: 'Text is too long',
      tooShort: 'Text is too short'
    },

    // Broker Score Panel
    scorePanel: {
      title: 'Broker Score Panel',
      subtitle: 'Comprehensive rating breakdown with quick filters',
      filters: {
        all: 'All Brokers',
        hot: 'Hot',
        highRebate: 'High Rebate',
        strongRegulation: 'Strong Regulation'
      },
      noResults: 'No brokers match your filter criteria',
      regulators: '{{count}} regulators',
      licenseNumber: 'License No.',
      showMore: 'Show all scores',
      showLess: 'Show less',
      viewDetails: 'View Details',
      quickSignup: 'Quick Signup',
      comingSoon: 'Coming Soon',
      mainDescription: '{{broker}} achieves a composite score of {{score}}, demonstrating strong performance across key metrics.',
      highlightText: 'Top-rated broker with excellent execution and competitive trading conditions.',
      tradingConditions: 'Trading Conditions',
      rebate: 'Rebate',
      limitedDisplay: 'Showing {{count}} of {{total}} brokers',
      brokerDescriptions: {
        'TMGM': 'Competitive costs, broad product coverage, stable execution. Ideal for EA and high-frequency trading with fastest account manager response and optimized US stocks.',
        'IC Markets': 'Deep liquidity, low spreads, fast execution. Scalping and quant-friendly.',
        'Exness': 'Fast deposits/withdrawals, flexible leverage, excellent stability. Perfect for frequent trading.',
        'ECMarket': 'Relatively niche brand. Recommend thorough comparison of regulation and costs before choosing.',
        'FXCM': 'Rich educational content, excellent localization. Beginner-friendly for progression.',
        'AvaTrade': 'Extensive compliance coverage, diverse platforms (copy trading/options). Multi-strategy suitable.',
        'EBC': 'Good execution and service feedback, competitive costs. Brand in rapid development.',
        'Pepperstone': 'Premium execution, institutional-grade infrastructure. Professional trader\'s choice.'
      },
      hoverMetrics: {
        liquidity: 'Liquidity',
        spread: 'Spread',
        accountTypes: 'Account Types',
        high: 'High',
        standard: 'Standard'
      }
    },

    // Regulation Ticker
    regulationTicker: {
      title: 'Regulatory Updates',
      subtitle: 'Real-time tracking of regulatory status and compliance alerts',
      viewAll: 'View All Updates',
      noUpdates: 'No regulatory updates at this time',
      unknownBroker: 'Unknown Broker',
      defaultTag: 'Update',
      regarding: 'Regarding {{broker}}',
      recentUpdates: 'Recent Updates',
      showing: 'Showing {{count}} updates'
    },

    // Rebate Comparison
    rebateComparison: {
      title: 'Rebate Comparison',
      subtitle: 'Compare highest rebates and lowest spreads across brokers',
      tradeVolume: 'Trade Volume: {{volume}} lots',
      bestOffer: 'Best Offer',
      estimatedRebate: 'Estimated Total',
      maxRebate: 'Highest Rebate',
      minSpread: 'Lowest Spread',
      spread: 'Spread',
      total: 'Total Rebate',
      yAxisLabel: 'Rebate (USD)',
      realData: 'Verified Data',
      table: {
        broker: 'Broker',
        maxRebate: 'Max Rebate',
        minSpread: 'Min Spread',
        estimated: 'Est. Total ($)'
      }
    },

    // Quick Signup
    quickSignup: {
      title: 'Quick Account Setup',
      subtitle: 'Get started in 3 simple steps',
      steps: {
        contact: {
          title: 'Contact Information',
          description: 'Provide your email and phone number'
        },
        preferences: {
          title: 'Trading Preferences',
          description: 'Select your account type and experience level'
        },
        verify: {
          title: 'Review & Submit',
          description: 'Verify your information and complete setup'
        }
      },
      fields: {
        email: 'Email Address',
        phone: 'Phone Number',
        accountType: 'Account Type',
        experience: 'Trading Experience'
      },
      placeholders: {
        email: 'your@email.com',
        phone: '+1 234 567 8900'
      },
      accountTypes: {
        standard: 'Standard Account',
        ecn: 'ECN Account',
        vip: 'VIP Account'
      },
      experience: {
        beginner: 'Beginner (< 1 year)',
        intermediate: 'Intermediate (1-3 years)',
        advanced: 'Advanced (3-5 years)',
        professional: 'Professional (5+ years)'
      },
      errors: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        phoneRequired: 'Phone number is required',
        phoneInvalid: 'Please enter a valid phone number',
        accountTypeRequired: 'Please select an account type',
        experienceRequired: 'Please select your experience level'
      },
      summary: {
        title: 'Confirm Your Information'
      },
      kycNotice: 'Your information will be securely processed. KYC verification may be required to complete account activation.',
      buttons: {
        back: 'Back',
        next: 'Next Step',
        submit: 'Complete Setup',
        submitting: 'Processing...'
      }
    },

    // Trust Section
    trustSection: {
      title: 'Trusted by Traders Worldwide',
      subtitle: 'Join thousands of satisfied traders who trust our platform',
      testimonials: {
        title: 'What Our Users Say'
      },
      partners: {
        title: 'Our Partners',
        subtitle: 'Regulated brokers we work with'
      },
      media: {
        title: 'Featured In',
        subtitle: 'Recognized by leading financial publications'
      },
      stats: {
        users: 'Active Users',
        trades: 'Trades Processed',
        satisfaction: 'Satisfaction Rate'
      }
    },

    slippageRecords: {
      title: 'Trading Halt Records',
      subtitle: 'Track unexpected quote interruptions across major trading platforms',
      columns: {
        broker: 'Broker',
        date: 'Halt Date',
        platform: 'Platform'
      },
      noData: 'No halt records available'
    },

    // Order Book
    orderbook: {
      hero: {
        badge: 'Order Book Magnifier',
        subtitle: 'See the unseen details, understand the grand from the minute'
      },
      cards: {
        bidLabel: 'Bid',
        askLabel: 'Ask',
        midLabel: 'Mid',
        quantityLabel: 'Quantity',
        spreadLabel: 'Spread'
      },
      chart: {
        priceDistribution: 'Price Distribution (Based on Recent Quotes)'
      },
      history: {
        time: 'Time',
        bidVolume: 'Bid Vol',
        bidPrice: 'Bid',
        askPrice: 'Ask',
        askVolume: 'Ask Vol',
        spread: 'Spread',
        fetchError: 'Failed to fetch history: {{error}}'
      },
      footer: {
        loading: 'Loading…',
        error: 'Error: {{error}}',
        lastUpdate: 'Last update: {{time}}'
      }
    },

    // Indicator Testing
    indicators: {
      hero: {
        badge: 'Indicators Lab',
        subtitle: 'Track real price reactions from key moving averages and VWAP indicators. Use verifiable success counts to quickly evaluate strategy reliability.',
        validCountPeriod: 'Valid signals in the past {{days}} days',
        avgPerDay: 'Average daily valid signals',
        syncButton: 'Sync latest market data',
        syncButtonLoading: 'Syncing…',
        topHitLabel: 'Top performer: {{label}} · {{count}} times',
        topHitNoData: 'No data yet'
      },
      roles: {
        trend: 'Trend Type',
        volumePrice: 'Volume-Price Type',
        momentum: 'Momentum Type',
        default: 'Indicator'
      },
      cards: {
        sma14Description: 'Bounce confirmation after MA touch, measuring trend-following strength.',
        ema20Description: 'More responsive MA confirmation, capturing effective signals in short-term trends.',
        vwapDescription: 'Mean reversion from VWAP upper/lower bands, used to judge capital position and rebound strength.',
        defaultDescription: 'Key indicator effectiveness statistics.',
        macdDescription: 'Moving Average Convergence Divergence, trend and momentum confirmation.',
        rsiDescription: 'Relative Strength Index, measuring market overbought/oversold conditions.',
        avgConfirmation: 'Avg confirmation:',
        avgConfirmationValue: '{{value}} candles',
        avgConfirmationNoData: '—',
        validSignals: 'Valid Signals',
        times: 'times',
        candles: 'candles',
        accuracy: 'Accuracy'
      },
      detail: {
        typeLabel: 'INDICATOR TYPE',
        keyFeatures: 'Key Features',
        viewFullAnalysis: 'View Full K-Line Analysis',
        statistics: 'Statistics',
        validSignals: 'Valid Signals',
        avgConfirmCandles: 'Avg Confirm Candles',
        avgPerDay: 'Avg Per Day',
        sma1: 'Smooth trend identification',
        sma2: 'Classic 14-period moving average',
        sma3: 'Reliable support/resistance levels',
        ema1: 'Faster response to price changes',
        ema2: 'Reduces noise compared to SMA',
        ema3: 'Ideal for short-term trend trading',
        vwap1: 'Volume-weighted price analysis',
        vwap2: 'Institutional trading reference',
        vwap3: 'Mean reversion opportunities'
      },
      alert: {
        close: 'Close'
      },
      panel: {
        selectIndicators: 'Select Indicators',
        intervalSelector: 'Interval',
        timeRange: 'Time Range',
        timeRangeDay: '{{count}} Day',
        timeRangeDays: '{{count}} Days',
        timeRangeCandles: '{{count}} candles',
        refresh: 'Refresh',
        refreshLoading: 'Loading…'
      },
      chart: {
        title: 'ETH/USDT 3-Minute Candles',
        subtitle: 'Scroll to zoom, drag to pan, view candles and indicator performance in one view.',
        panLeft: 'Pan left',
        panRight: 'Pan right',
        reset: 'Reset',
        zoomHint: 'Scroll to zoom · Shift+Scroll to zoom Y-axis',
        noData: 'Unable to fetch candle data',
        candles: 'Candles',
        high: 'High',
        low: 'Low',
        open: 'Open',
        close: 'Close',
        volume: 'Volume',
        validSignals: 'Valid Signals'
      },
      loading: 'Loading market data…'
    },
    guide: {
      title: 'User Guide',
      selectGuideType: 'Please select the guide type you want to view',
      guideType: {
        accountType: 'Account Types',
        accountTypeDesc: 'Learn about Standard vs Raw Spread accounts',
        registration: 'Registration',
        registrationDesc: 'Step-by-step account registration guide',
        rebate: 'Broker Rebate',
        rebateDesc: 'MT5 platform setup guide for rebate',
        invitation: 'Invite Code',
        invitationDesc: 'How to use invite code / invite link',
        unlockMore: 'Unlock more guides'
      },
      password: {
        title: 'Enter Password',
        placeholder: 'Password',
        error: 'Incorrect password',
        cancel: 'Cancel',
        confirm: 'Confirm'
      },
      accountComparison: {
        title: 'Account Type Comparison',
        subtitle: 'Choosing the right account type for your trading style',
        example: 'Example: Gold (XAUUSD) Trading',
        standard: {
          title: 'Standard Account',
          spread: 'Spread',
          spreadValue: '32 (0.32 pips)',
          commission: 'Commission',
          commissionValue: '$0 per lot',
          rebate: 'Rebate',
          rebateValue: '$20 per lot',
          suitFor: 'Best For',
          suitForValue: 'Position traders and long-term holders',
          tradingCost: 'Trading Cost per Lot',
          tradingCostValue: '$32',
          netCost: 'Net Cost (After Rebate)',
          netCostValue: '$12'
        },
        rawSpread: {
          title: 'Raw Spread / ECN Account',
          spread: 'Spread',
          spreadValue: '9 (0.09 pips)',
          commission: 'Commission',
          commissionValue: '$5 per lot',
          rebate: 'Rebate',
          rebateValue: '$2 per lot',
          suitFor: 'Best For',
          suitForValue: 'Scalpers and high-frequency traders',
          tradingCost: 'Trading Cost per Lot',
          tradingCostValue: '$14',
          netCost: 'Net Cost (After Rebate)',
          netCostValue: '$12'
        },
        examples: {
          title: 'Trading Examples',
          scenario1: {
            title: 'Scenario 1: Day Trading',
            desc: '1 lot Gold, held for 4 hours',
            standard: 'Trading Cost: $32 | Rebate: $20 | Net Cost: $12',
            rawSpread: 'Trading Cost: $14 | Rebate: $2 | Net Cost: $12',
            conclusion: 'Similar net cost for short-term trades'
          },
          scenario2: {
            title: 'Scenario 2: High-Frequency Scalping',
            desc: '10 trades per day, 1 lot each',
            standard: 'Trading Cost: $320 | Rebate: $200 | Net Cost: $120',
            rawSpread: 'Trading Cost: $140 | Rebate: $20 | Net Cost: $120',
            conclusion: 'Raw Spread is more efficient for high-frequency trading'
          },
          scenario3: {
            title: 'Scenario 3: Swing Trading',
            desc: '1 lot Gold, held for 3 days',
            standard: 'Trading Cost: $32 | Rebate: $20 | Net Cost: $12',
            rawSpread: 'Trading Cost: $14 | Rebate: $2 | Net Cost: $12',
            conclusion: 'Standard account provides better rebate for fewer trades'
          }
        },
        recommendation: {
          title: '💡 Recommendation',
          highFrequency: 'Trade 10+ times per day → Choose Raw Spread Account',
          longTerm: 'Hold positions longer, trade less frequently → Choose Standard Account',
          key: 'Key: Raw Spread has lower spreads (quick trades). Standard has higher rebates (long holds).'
        },
        backToType: 'Back to Guide Type'
      },
      selectPlatform: 'Please select your device platform to view the corresponding guide',
      platform: {
        desktop: 'Desktop',
        desktopDesc: 'View guide for computer users',
        mobile: 'Mobile',
        mobileDesc: 'View guide for mobile users'
      },
      step: 'Step',
      completed: {
        title: 'Guide Completed!',
        message: 'Congratulations! You have completed all guide steps.',
        backToHome: 'Back to Home',
        restart: 'View Guide Again',
        button: 'I Have Completed'
      },
      backToPlatform: 'Back to Platform Selection',
      finishGuide: 'Finish Guide',
      skipGuide: 'Skip Guide',
      keyboardHint: 'Press Enter to continue to next step'
    }
  },

  'zh-CN': {
    // Navigation & General
    nav: {
      indicators: '指标实验室',
      dashboard: 'ShopBack管理',
      home: '工作台首页',
      brokerHub: '经纪商控制台',
        analytics: '券商象限分析',
        trading: '交易图表',
        ethPrediction: 'ETH价格预测',
        news: '金融新闻',
        donations: '项目捐赠',
        fortune: '玄学择时',
        leverage: '杠杆计算器',
        guide: '使用指南',
        groups: {
          explore: '探索',
          community: '社区',
          account: '账户'
        },
      badges: {
        recommended: '推荐起点'
      },
      logout: '退出登录'
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
      info: '信息',
      clear: '清空',
      selected: '已选择 {{count}} 个经纪商'
    },
    // News Module Translations
    news: {
      title: '金融新闻',
      subtitle: '万象皆声，唯静者能听',
      eyebrow: '实时金融快讯',
      searchPlaceholder: '搜索新闻...',
      filterSymbol: '标的物',
      filterSentiment: '情感分析',
      allSymbols: '全部标的',
      allCategories: '全部分类',
      allImpacts: '全部影响程度',
      allSentiments: '全部情感',
      category: {
        tech_stocks: '科技股票',
        market_indices: '市场指数',
        precious_metals: '贵金属',
        bonds: '债券',
        forex: '外汇',
        central_banks: '央行',
        monetary_policy: '货币政策',
        crypto: '加密货币'
      },
      sentiment: {
        positive: '积极',
        negative: '消极',
        neutral: '中性'
      },
      impact: {
        high: '高影响',
        medium: '中等影响',
        low: '低影响'
      },
      refresh: '刷新',
      autoRefreshOn: '自动刷新 开',
      autoRefreshOff: '自动刷新 关',
      lastUpdate: '最后更新',
      loading: '加载新闻中...',
      noNews: '暂无新闻',
      totalNews: '新闻总数',
      openOriginal: '查看原文',
      fetchError: '获取新闻失败',
      newUpdate: '收到新的新闻更新',
      summarized: '已摘要',
      titleOnly: '仅标题',
      aiNote: '重要新闻均由目前最强AI模型 ChatGPT 进行摘要',
      importantNews: '重要新闻（有摘要）',
      otherNews: '其他新闻（仅标题）',
      totalCount: '共 {{count}} 条',
      noImportantNews: '暂无重要新闻',
      noOtherNews: '暂无其他新闻',
      timeAgo: {
        seconds: '{{count}}秒前',
        minutes: '{{count}}分钟前',
        hours: '{{count}}小时前'
      }
    },
    home: {
      hero: {
        badge: '外汇情报实验室',
        title: '一站式交易情报平台',
        subtitle: '实时追踪经纪商、对比指标，分析表现、监控市场事件，帮助你做出更明智的交易决策',
        primary: '立即开始',
        secondary: '查看指标'
      },
      preview: {
        title: '本周表现榜',
        badge: '实时看板',
        loading: '正在加载看板…',
        empty: '暂时没有经纪商数据。'
      },
      metrics: {
        brokers: '经纪商',
        brokersHelper: '追踪平台',
        alerts: '事件',
        alertsHelper: '卡盘记录',
        community: '用户',
        communityHelper: '活跃声音'
      },
      states: {
        loading: '正在加载工作台数据…',
        error: '当前暂时无法加载工作台。',
        retry: '重试'
      },
      workspace: {
        title: '经纪商工作台',
        subtitle: '用 Monday.com 风格的看板规划、优先排序并输出你的下一步动作。',
        cta: '打开完整看板'
      },
      board: {
        title: '经纪商承做看板',
        helper: '按复合风险评分自动排序',
        column: {
          broker: '经纪商',
          status: '状态',
          score: '评分',
          regulators: '监管',
          actions: '操作'
        },
        status: {
          unknown: '未设置状态',
          live: '可以立即推进',
          review: '评估中',
          watch: '观察列表',
          hold: '待定'
        },
        focusFallback: '暂无亮点信息',
        regulatorCount: '{{count}} 个监管',
        viewProfile: '查看档案'
      },
      highlight: {
        title: '焦点',
        headline: '{{broker}} 引领本周节奏',
        description: '综合评分 {{score}} · 亮点：{{focus}}',
        empty: '选择一位经纪商即可生成焦点。',
        cta: '深入查看分析'
      },
      quickActions: {
        title: '快速自动化',
        launch: '立即前往',
        compare: {
          title: '一键发起对比',
          description: '打开经纪商中心并自动带上筛选。'
        },
        analytics: {
          title: '查看经纪商分析',
          description: '审阅象限、趋势与风险聚类。'
        },
        community: {
          title: '倾听社区声音',
          description: '进入论坛验证真实口碑。'
        }
      },
      fortune: {
        title: '玄学择时',
        subtitle: '用东方玄学口吻给今天的下单气运打个卦，图个好心情。',
        refresh: '每日子时自动重置 · 仅供情绪价值，非投资建议。',
        tier: {
          lucky: '宜 · 气运在线',
          balanced: '平 · 静守机会',
          cautious: '忌 · 收敛锋芒'
        },
        fields: {
          verdict: '今日解卦',
          qi: '气场指数',
          amulet: '情绪护符',
          ritual: '宜',
          avoid: '忌',
          direction: '招财方位',
          compass: '罗盘'
        },
        actions: {
          trade: '去看盘/下单',
          compare: '先去对比经纪商'
        }
      },
      leverage: {
        badge: '风险计算器',
        title: '美股杠杆计算器',
        subtitle: '计算保证金需求、爆仓风险和仓位管理，精确控制杠杆交易风险',
        inputs: {
          title: '输入参数',
          totalFunds: '总资金 ($)',
          marketPrice: '市价 ($)',
          lots: '手数（股数）',
          priceChange: '价格波动 ($)',
          leverage: '杠杆倍数'
        },
        results: {
          title: '计算结果',
          margin: '保证金',
          originalEquity: '原始净值',
          actualEquity: '实际净值',
          marginRatio: '保证金比例',
          liquidationLine: '爆仓线',
          priceChangeToLiquidation: '距离爆仓的价格波动'
        },
        warnings: {
          critical: '危险警告：您的仓位极其接近爆仓线！',
          high: '高风险警告：保证金比例过高，建议减少仓位。',
          medium: '中等风险：请密切监控仓位，谨慎管理风险。'
        },
        formulas: {
          title: '计算公式',
          margin: '保证金',
          marginFormula: '(市价 × 手数) ÷ 杠杆',
          originalEquity: '原始净值',
          originalEquityFormula: '总资金 - 保证金',
          actualEquity: '实际净值',
          actualEquityFormula: '净值 ± (价格波动 × 手数)',
          marginRatio: '保证金比例',
          marginRatioFormula: '保证金 ÷ 实际净值 × 100%',
          liquidationLine: '爆仓线',
          liquidationLineFormula: '0.4 × 保证金',
          priceChangeToLiquidation: '距离爆仓的价格波动',
          priceChangeToLiquidationFormula: '(实际净值 - 爆仓线) ÷ 手数'
        }
      },
      timeline: {
        title: '实时信号流',
        subtitle: '监管消息与社区动态集中呈现',
        empty: '过去 48 小时暂无新信号。',
        newsFallback: '{{broker}} 最新动态',
        unknownBroker: '未知经纪商',
        tagged: '{{broker}} • {{tag}}',
        generic: '{{broker}} 发布了新信号',
        threadFallback: '社区话题',
        threadBy: '来自 {{author}} 的话题',
        threadAnonymous: '社区匿名话题'
      },
      community: {
        title: '社区热力图',
        subtitle: '在投入资金前先掌握真实情绪。',
        cta: '打开论坛',
        stats: {
          voices: '活跃声音',
          threads: '本周话题',
          posts: '分析帖子数'
        },
        feedTitle: '热议讨论',
        feedSubtitle: '分析师与资深用户的关键信号',
        feedFallback: '未命名话题',
        anonymous: '匿名',
        feedEmpty: '暂无精选内容，发个帖子点燃社区吧。'
      }
    },

    // Broker Hub
    brokerHub: {
      brand: '外汇情报实验室',
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
      onboarding: {
        stepperTitle: '3 步快速上手',
        steps: {
          step1: {
            title: '设定目标',
            description: '明确重点：低点差、强监管还是新手友好'
          },
          step2: {
            title: '筛选对比',
            description: '使用快速筛选与并排对比工具'
          },
          step3: {
            title: '参与讨论',
            description: '从社区获取洞察并分享你的经验'
          }
        },
        ctaGo: '开始',
        firstVisit: {
          tooltip1: '选择一张经纪商卡片开始对比',
          tooltip2: '点击榜单查看实时变动',
          tooltip3: '太棒了！你完成了首次对比',
          dismiss: '知道了',
          skipAll: '跳过引导'
        }
      },
      quickFilters: {
        title: '快速入门场景',
        subtitle: '点击筛选器高亮匹配的经纪商',
        presets: {
          beginner: {
            title: '新手推荐',
            description: '高返现 + ASIC/FCA 监管'
          },
          lowCost: {
            title: '超低点差',
            description: '交易成本评分 ≥ 80'
          },
          topRegulation: {
            title: '监管最强',
            description: '3+ 一线监管机构'
          }
        },
        clearFilter: '清除筛选',
        showComparison: '对比所选'
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
          entityCount: '{{count}} 个实体',
          selected: '已选 {{count}}',
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
          emptyUpdates: '暂无市场信号。',
          whyWatch: '追踪经纪商相对表现的长期变化趋势',
          currentStep: '第 2 步 / 共 3 步'
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
          emptyEvents: '暂无最新提醒。',
          whyWatch: '了解真实交易者对各经纪商的实际体验',
          currentStep: '第 3 步 / 共 3 步'
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

    // Leverage Calculator Page
    leverageCalculator: {
      badge: '风险计算器',
      title: '黄金期货杠杆计算器',
      subtitle: '欲假其力，先察深渊之深。',
      loadingPrice: '正在加载实时价格...',
      currentGoldPrice: '当前金价',
      scenarios: {
        title: '选择计算场景',
        scenario1: {
          title: '计算最大开仓手数',
          description: '计算您最多能开多少手',
          input1: '本金',
          input2: '杠杆倍数',
          input3: '价格波动',
          output: '→ 最大手数'
        },
        scenario2: {
          title: '计算所需本金',
          description: '计算需要多少资金',
          input1: '价格波动',
          input2: '杠杆倍数',
          input3: '开仓手数',
          output: '→ 所需本金'
        },
        scenario3: {
          title: '计算爆仓价格',
          description: '计算在什么价格会爆仓',
          input1: '总资金',
          input2: '市价',
          input3: '开仓手数',
          input4: '杠杆倍数',
          output: '→ 爆仓价格'
        }
      },
      inputs: {
        title: '输入参数',
        totalFunds: '总资金 ($)',
        marketPrice: '金价 ($/盎司)',
        lots: '手数',
        priceChange: '价格波动 ($/盎司)',
        leverage: '杠杆倍数',
        contractSize: '合约大小',
        useLatest: '使用最新价'
      },
      results: {
        title: '计算结果',
        margin: '保证金',
        originalEquity: '原始净值',
        actualEquity: '爆仓净值',
        marginRatio: '保证金比例',
        liquidationLine: '爆仓线',
        priceChangeToLiquidation: '距离爆仓的价格波动',
        maxLots: '最大开仓手数',
        requiredFunds: '所需本金',
        liquidationPrice: '爆仓价格'
      },
      warnings: {
        critical: '危险警告：您的仓位极其接近爆仓线！',
        high: '高风险警告：保证金比例过高，建议减少仓位。',
        medium: '中等风险：请密切监控仓位，谨慎管理风险。'
      },
      formulas: {
        title: '计算公式',
        margin: '保证金',
        marginFormula: '(市价 × 手数) ÷ 杠杆',
        originalEquity: '原始净值',
        originalEquityFormula: '总资金 - 保证金',
        actualEquity: '实际净值',
        actualEquityFormula: '净值 ± (价格波动 × 手数)',
        marginRatio: '保证金比例',
        marginRatioFormula: '实际净值 ÷ 保证金 × 100%',
        liquidationLine: '爆仓线',
        liquidationLineFormula: '0.4 × 保证金',
        priceChangeToLiquidation: '距离爆仓的价格波动',
        priceChangeToLiquidationFormula: '(实际净值 - 爆仓线) ÷ 手数'
      }
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
    
    // Analytics - 券商象限分析
    analytics: {
      title: '券商象限分析',
      subtitle: '基于多维度评分的数据驱动分析，帮助您快速识别券商的相对优势和定位',

      // 配置部分
      configuration: {
        title: '分析配置',
        xAxis: 'X轴维度：',
        yAxis: 'Y轴维度：',
        bubbleMetric: '气泡大小指标：',
        regulatorFilter: '监管机构筛选：',
        regulatorPlaceholder: '如：ASIC,FCA,CySEC',
        ratingRange: '评级范围：',
        minRating: '最低评级',
        maxRating: '最高评级',
        to: '到'
      },

      // 图表部分
      chart: {
        title: '券商象限分析图',
        controls: {
          size: '尺寸：',
          sizeOptions: {
            small: '小 (60%)',
            medium: '中 (75%)',
            large: '大 (90%)'
          },
          fullscreen: '全屏显示',
          exitFullscreen: '退出全屏 (ESC)',
          resetZoom: '重置缩放 (ESC)'
        },
        description: {
          xAxis: 'X轴：',
          yAxis: 'Y轴：',
          bubbleSize: '气泡大小：'
        },
        interaction: {
          hint: '💡 拖拽选择区域进行缩放，ESC重置缩放，点击数据点查看详情'
        }
      },

      // 提示框
      tooltip: {
        overallRating: '总体评级：',
        compositeScore: '综合影响力：',
        regulatorCount: '监管机构数量：'
      },

      // 象限说明
      quadrants: {
        q1: {
          title: '右上角 (优势区)',
          description: '高{{xAxis}} + 高{{yAxis}}'
        },
        q2: {
          title: '左上角 (潜力区)',
          description: '低{{xAxis}} + 高{{yAxis}}'
        },
        q3: {
          title: '左下角 (关注区)',
          description: '低{{xAxis}} + 低{{yAxis}}'
        },
        q4: {
          title: '右下角 (改进区)',
          description: '高{{xAxis}} + 低{{yAxis}}'
        }
      },

      // 统计信息
      statistics: {
        title: '分析统计',
        totalBrokers: '总经纪商数：',
        advantageZone: '优势区：',
        potentialZone: '潜力区：',
        focusZone: '关注区：',
        improvementZone: '改进区：',
        brokers: '家'
      },

      // 加载和错误状态
      loading: '正在加载数据...',
      error: '获取数据失败',
      retry: '重试',

      // 维度（常用）
      dimensions: {
        regulation: '监管强度',
        transparency: '透明度与合规',
        tradingCost: '交易成本',
        execution: '执行与流动性',
        platform: '平台与产品',
        service: '服务与教育',
        stability: '稳定性与口碑',
        compositeScore: '综合影响力'
      },

      // 维度映射（后端中文键）
      dimensionNames: {
        '监管强度': '监管强度',
        '透明度与合规': '透明度与合规',
        '交易成本': '交易成本',
        '执行与流动性': '执行与流动性',
        '平台与产品': '平台与产品',
        '服务与教育': '服务与教育',
        '稳定性与口碑': '稳定性与口碑',
        '综合影响力': '综合影响力'
      },

    },

    // 经纪商详情弹窗
    brokerDetail: {
      compositeScore: '综合得分',
      basicInfo: '基本信息',
      brokerName: '经纪商名称',
      overallRating: '总体评级',
      website: '官方网站',
      unrated: '未评级',
      regulatoryInfo: '监管信息',
      regulators: '监管机构',
      entities: '实体',
      ratingBreakdown: '评分细节',
      category: '类别',
      score: '得分',
      weight: '权重',
      close: '关闭',
      viewDetails: '查看详情',
      addToCompare: '添加对比',
      removeFromCompare: '移除对比',
      visit: '访问',
      compare: '对比',
      remove: '移除',
      expandView: '展开查看 ({{count}})',
      maxReached: '已达最大对比数量',
      canSelectMore: '还可选择 {{count}} 个',
      startComparison: '开始对比 ({{count}})',
      loading: '加载中...'
    },

    // 经纪商对比弹窗
    brokerComparison: {
      title: '经纪商对比分析',
      subtitle: '对比 {{count}} 家经纪商',
      comparisonItems: '对比项目',
      summary: '对比总结',
      loading: '正在加载对比数据...',
      noData: '暂无对比数据',
      removeBroker: '移除此经纪商',
      closeComparison: '关闭对比',
      tip: '💡 点击 × 可移除单个经纪商进行重新对比'
    },

    // Validation Messages
    validation: {
      required: '此字段为必填项',
      invalidEmail: '邮箱格式不正确',
      invalidUrl: 'URL格式不正确',
      mustBePositive: '数值必须为正数',
      tooLong: '文本过长',
      tooShort: '文本过短'
    },

    // Broker Score Panel
    scorePanel: {
      title: '经纪商评分面板',
      subtitle: '全面的评分细分与快速筛选',
      filters: {
        all: '全部经纪商',
        hot: '热门',
        highRebate: '返佣高',
        strongRegulation: '监管强'
      },
      noResults: '没有符合筛选条件的经纪商',
      regulators: '{{count}} 个监管',
      licenseNumber: '监管号',
      showMore: '显示全部评分',
      showLess: '收起',
      viewDetails: '查看详情',
      quickSignup: '快速开户',
      comingSoon: '敬请期待',
      mainDescription: '{{broker}} 综合评分 {{score}}，在各项关键指标上表现强劲。',
      highlightText: '顶级经纪商，执行优秀，交易条件具有竞争力。',
      tradingConditions: '交易条件',
      rebate: '返佣',
      limitedDisplay: '显示 {{count}}/{{total}} 个经纪商',
      brokerDescriptions: {
        'TMGM': '成本具竞争力、产品覆盖广、执行稳定，适合EA与高频，客户经理反馈最快，美股深度优化。',
        'IC Markets': '流动性深、点差低、执行迅速，剥头皮与量化友好。',
        'Exness': '出入金快捷、杠杆灵活、稳定性好，适合频繁交易。',
        'ECMarket': '品牌相对小众，建议重点比较监管与成本后再选择。',
        'FXCM': '教育内容丰富、本地化服务佳，上手友好适合新手进阶。',
        'AvaTrade': '合规布局较广、工具平台多样（含复制/期权），适合多策略。',
        'EBC': '执行与服务反馈良好、成本具竞争力，品牌仍在加速发展。',
        'Pepperstone': '优质执行、机构级基础设施，专业交易者首选。'
      },
      hoverMetrics: {
        liquidity: '流动性',
        spread: '点差',
        accountTypes: '账户类型',
        high: '高',
        standard: '标准'
      }
    },

    // Regulation Ticker
    regulationTicker: {
      title: '监管动态',
      subtitle: '实时追踪监管状态与合规警示',
      viewAll: '查看全部更新',
      noUpdates: '暂无监管更新',
      unknownBroker: '未知经纪商',
      defaultTag: '更新',
      regarding: '关于 {{broker}}',
      recentUpdates: '近期更新',
      showing: '显示 {{count}} 条更新'
    },

    // Rebate Comparison
    rebateComparison: {
      title: '返佣对比',
      subtitle: '对比各经纪商的最高返佣和最低点差',
      tradeVolume: '交易量：{{volume}} 手',
      bestOffer: '最佳方案',
      estimatedRebate: '预估总额',
      maxRebate: '最高返佣',
      minSpread: '最低点差',
      spread: '点差',
      total: '总返佣',
      yAxisLabel: '返佣 (美元)',
      realData: '真实数据',
      table: {
        broker: '经纪商',
        maxRebate: '最高返佣',
        minSpread: '最低点差',
        estimated: '预估总额 ($)'
      }
    },

    // Quick Signup
    quickSignup: {
      title: '快捷开户',
      subtitle: '3步完成账户设置',
      steps: {
        contact: {
          title: '联系方式',
          description: '提供您的邮箱和电话号码'
        },
        preferences: {
          title: '交易偏好',
          description: '选择账户类型和交易经验'
        },
        verify: {
          title: '确认提交',
          description: '验证信息并完成设置'
        }
      },
      fields: {
        email: '邮箱地址',
        phone: '电话号码',
        accountType: '账户类型',
        experience: '交易经验'
      },
      placeholders: {
        email: 'your@email.com',
        phone: '+86 138 0000 0000'
      },
      accountTypes: {
        standard: '标准账户',
        ecn: 'ECN账户',
        vip: 'VIP账户'
      },
      experience: {
        beginner: '新手（< 1年）',
        intermediate: '中级（1-3年）',
        advanced: '高级（3-5年）',
        professional: '专业（5年以上）'
      },
      errors: {
        emailRequired: '邮箱为必填项',
        emailInvalid: '请输入有效的邮箱地址',
        phoneRequired: '电话号码为必填项',
        phoneInvalid: '请输入有效的电话号码',
        accountTypeRequired: '请选择账户类型',
        experienceRequired: '请选择交易经验'
      },
      summary: {
        title: '确认您的信息'
      },
      kycNotice: '您的信息将被安全处理。可能需要 KYC 验证才能完成账户激活。',
      buttons: {
        back: '返回',
        next: '下一步',
        submit: '完成设置',
        submitting: '处理中...'
      }
    },

    // Trust Section
    trustSection: {
      title: '全球交易者信赖之选',
      subtitle: '加入数千位信任我们平台的满意交易者',
      testimonials: {
        title: '用户评价'
      },
      partners: {
        title: '合作伙伴',
        subtitle: '我们合作的受监管经纪商'
      },
      media: {
        title: '媒体报道',
        subtitle: '获得金融领域权威媒体认可'
      },
      stats: {
        users: '活跃用户',
        trades: '处理交易',
        satisfaction: '满意度'
      }
    },

    slippageRecords: {
      title: '卡盘记录',
      subtitle: '过去14天内发生卡盘的平台',
      columns: {
        broker: '平台',
        date: '卡盘时间',
        platform: 'MT4/MT5'
      },
      noData: '暂无卡盘记录'
    },

    // 盘口
    orderbook: {
      hero: {
        badge: '盘口放大镜',
        subtitle: '见微知著，不见芥子如何悟须弥'
      },
      cards: {
        bidLabel: '买价',
        askLabel: '卖价',
        midLabel: '中间价',
        quantityLabel: '数量',
        spreadLabel: '价差'
      },
      chart: {
        priceDistribution: '价格分布（基于最近报价累积）'
      },
      history: {
        time: '时间',
        bidVolume: '买量',
        bidPrice: '买价',
        askPrice: '卖价',
        askVolume: '卖量',
        spread: '价差',
        fetchError: '历史获取失败: {{error}}'
      },
      footer: {
        loading: '加载中…',
        error: '错误: {{error}}',
        lastUpdate: '更新时间: {{time}}'
      }
    },

    // 指标测试
    indicators: {
      hero: {
        badge: '指标实验室',
        subtitle: '数不语，道自显。',
        validCountPeriod: '过去 {{days}} 天有效次数',
        avgPerDay: '平均每日有效',
        syncButton: '同步最新市场数据',
        syncButtonLoading: '同步中…',
        topHitLabel: '当前准确率最高：{{label}} · {{count}} 次',
        topHitNoData: '暂无数据'
      },
      roles: {
        trend: '趋势型',
        volumePrice: '价量型',
        momentum: '动量型',
        default: '指标'
      },
      cards: {
        sma14Description: '自交易之初，经典永不过时。',
        ema20Description: '速度揭示真相，迟疑即是偏离。',
        vwapDescription: '交易量和价格，万声汇于一点，才看得见真正的价格。',
        macdDescription: '趋势的呼吸，呼吸止处，即是转折。',
        rsiDescription: '众生贪惧之处，正是力量的临界。',
        defaultDescription: '关键指标有效性统计。',
        avgConfirmation: '平均确认：',
        avgConfirmationValue: '{{value}} 根K线',
        avgConfirmationNoData: '—',
        validSignals: '有效信号',
        times: '次',
        candles: '根K线',
        accuracy: '准确率'
      },
      detail: {
        typeLabel: '指标类型',
        keyFeatures: '核心特性',
        viewFullAnalysis: '查看完整K线分析',
        statistics: '有效统计',
        validSignals: '有效信号数',
        avgConfirmCandles: '平均确认K线',
        avgPerDay: '日均信号',
        sma1: '平滑趋势识别',
        sma2: '经典14周期移动平均',
        sma3: '可靠的支撑/阻力位',
        ema1: '对价格变化反应更快',
        ema2: '相比SMA减少噪音',
        ema3: '适合短期趋势交易',
        vwap1: '成交量加权价格分析',
        vwap2: '机构交易参考指标',
        vwap3: '均值回归机会'
      },
      alert: {
        close: '关闭'
      },
      panel: {
        selectIndicators: '选择指标',
        intervalSelector: '时间周期',
        timeRange: '时间范围',
        timeRangeDay: '{{count}} 天',
        timeRangeDays: '{{count}} 天',
        timeRangeCandles: '{{count}} 根K线',
        refresh: '刷新',
        refreshLoading: '加载中…'
      },
      chart: {
        title: 'ETH/USDT 3 分钟 K 线',
        subtitle: '滚轮缩放、拖拽平移，在同一视图中查看 K 线与指标表现。',
        panLeft: '向左平移',
        panRight: '向右平移',
        reset: 'Reset',
        zoomHint: '滚轮缩放 · Shift+滚轮缩放纵轴',
        noData: '暂无法获取 K 线数据',
        candles: 'K线',
        high: '最高',
        low: '最低',
        open: '开盘',
        close: '收盘',
        volume: '成交量',
        validSignals: '有效信号'
      },
      loading: '正在加载市场数据…'
    },
    guide: {
      title: '使用指南',
      selectGuideType: '请选择您想要查看的指南类型',
      guideType: {
        accountType: '账户组别',
        accountTypeDesc: '了解标准账户与裸点账户的区别',
        registration: '账户注册',
        registrationDesc: '一步步教你注册开户',
        rebate: '代理返佣',
        rebateDesc: 'MT5平台开户返佣指南',
        invitation: '邀请码',
        invitationDesc: '如何使用邀请码 / 邀请链接',
        unlockMore: '解锁更多指南'
      },
      password: {
        title: '请输入密码',
        placeholder: '密码',
        error: '密码错误',
        cancel: '取消',
        confirm: '确认'
      },
      accountComparison: {
        title: '账户类型对比',
        subtitle: '选择适合您交易风格的账户类型',
        example: '示例：黄金（XAUUSD）交易',
        standard: {
          title: '标准账户',
          spread: '点差',
          spreadValue: '32（小数位后0.32）',
          commission: '手续费',
          commissionValue: '$0 / 手',
          rebate: '返佣',
          rebateValue: '$20 / 手',
          suitFor: '适合人群',
          suitForValue: '长持交易者、波段交易者',
          tradingCost: '每手交易成本',
          tradingCostValue: '$32',
          netCost: '算上返佣后净成本',
          netCostValue: '$12'
        },
        rawSpread: {
          title: '裸点账户 / ECN账户',
          spread: '点差',
          spreadValue: '9（小数位后0.09）',
          commission: '手续费',
          commissionValue: '$5 / 手',
          rebate: '返佣',
          rebateValue: '$2 / 手',
          suitFor: '适合人群',
          suitForValue: '剥头皮、高频交易者',
          tradingCost: '每手交易成本',
          tradingCostValue: '$14',
          netCost: '算上返佣后净成本',
          netCostValue: '$12'
        },
        examples: {
          title: '交易举例',
          scenario1: {
            title: '场景1：日内交易',
            desc: '1手黄金，持仓4小时',
            standard: '交易成本：$32 | 返佣：$20 | 净成本：$12',
            rawSpread: '交易成本：$14 | 返佣：$2 | 净成本：$12',
            conclusion: '短期交易净成本相近'
          },
          scenario2: {
            title: '场景2：高频剥头皮',
            desc: '每天10笔，每笔1手',
            standard: '交易成本：$320 | 返佣：$200 | 净成本：$120',
            rawSpread: '交易成本：$140 | 返佣：$20 | 净成本：$120',
            conclusion: '裸点账户更适合高频交易'
          },
          scenario3: {
            title: '场景3：波段交易',
            desc: '1手黄金，持仓3天',
            standard: '交易成本：$32 | 返佣：$20 | 净成本：$12',
            rawSpread: '交易成本：$14 | 返佣：$2 | 净成本：$12',
            conclusion: '标准账户返佣更高，适合低频交易'
          }
        },
        recommendation: {
          title: '💡 选择建议',
          highFrequency: '每天交易超过10次 → 选择裸点账户',
          longTerm: '持仓时间较长，交易频次低 → 选择标准账户',
          key: '关键：裸点账户点差低，适合快进快出；标准账户返佣高，适合长持。'
        },
        backToType: '返回指南类型'
      },
      selectPlatform: '请选择您使用的设备平台，以查看对应的指南',
      platform: {
        desktop: '电脑端',
        desktopDesc: '查看电脑用户使用指南',
        mobile: '手机端',
        mobileDesc: '查看手机用户使用指南'
      },
      step: '第',
      completed: {
        title: '指南完成！',
        message: '恭喜！您已完成所有指南步骤。',
        backToHome: '返回首页',
        restart: '重新查看指南',
        button: '我已完成'
      },
      backToPlatform: '返回平台选择',
      finishGuide: '完成指南',
      skipGuide: '跳过指南',
      keyboardHint: '按 Enter 键继续下一步'
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
