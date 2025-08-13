export function aggregateStoreData(historyData) {
  const storeMap = new Map();
  
  historyData.forEach(entry => {
    const key = `${entry.store_id}_${entry.category || 'main'}`;
    
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeId: entry.store_id,
        storeName: entry.store_name || `Store ${entry.store_id}`,
        category: entry.category || 'main',
        platform: entry.platform,
        dataPoints: [],
        rateChanges: [],
        upsizeEvents: []
      });
    }
    
    const store = storeMap.get(key);
    store.dataPoints.push({
      date: new Date(entry.scraped_at),
      rate: entry.main_rate_numeric || entry.category_rate_numeric || 0,
      isUpsized: entry.is_upsized || false,
      previousOffer: entry.previous_offer
    });
  });
  
  storeMap.forEach(store => {
    store.dataPoints.sort((a, b) => a.date - b.date);
    
    for (let i = 1; i < store.dataPoints.length; i++) {
      const current = store.dataPoints[i];
      const previous = store.dataPoints[i - 1];
      
      if (Math.abs(current.rate - previous.rate) > 0.01) {
        store.rateChanges.push({
          date: current.date,
          previousRate: previous.rate,
          newRate: current.rate,
          change: current.rate - previous.rate,
          percentageChange: ((current.rate - previous.rate) / previous.rate) * 100,
          daysSinceLastChange: (current.date - previous.date) / (1000 * 60 * 60 * 24)
        });
      }
      
      if (current.isUpsized && !previous.isUpsized) {
        store.upsizeEvents.push({
          startDate: current.date,
          rate: current.rate,
          previousOffer: current.previousOffer
        });
      }
    }
  });
  
  return Array.from(storeMap.values());
}

export function calculateRateStatistics(rateChanges) {
  if (rateChanges.length === 0) {
    return {
      averageChange: 0,
      averageTimeBetweenChanges: 0,
      positiveChanges: 0,
      negativeChanges: 0,
      volatility: 0
    };
  }
  
  const changes = rateChanges.map(c => c.change);
  const timeBetweenChanges = rateChanges.map(c => c.daysSinceLastChange).filter(d => d > 0);
  
  const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const averageTimeBetweenChanges = timeBetweenChanges.length > 0
    ? timeBetweenChanges.reduce((sum, t) => sum + t, 0) / timeBetweenChanges.length
    : 0;
  
  const positiveChanges = changes.filter(c => c > 0).length;
  const negativeChanges = changes.filter(c => c < 0).length;
  
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - averageChange, 2), 0) / changes.length;
  const volatility = Math.sqrt(variance);
  
  return {
    averageChange: Math.round(averageChange * 100) / 100,
    averageTimeBetweenChanges: Math.round(averageTimeBetweenChanges * 10) / 10,
    positiveChanges,
    negativeChanges,
    volatility: Math.round(volatility * 100) / 100
  };
}

export function detectPatterns(dataPoints) {
  const patterns = {
    seasonal: false,
    trending: null,
    cyclic: false,
    regularInterval: false
  };
  
  if (dataPoints.length < 10) {
    return patterns;
  }
  
  const rates = dataPoints.map(d => d.rate);
  const dates = dataPoints.map(d => d.date);
  
  const movingAverage = [];
  const windowSize = Math.min(7, Math.floor(dataPoints.length / 3));
  
  for (let i = windowSize; i < rates.length; i++) {
    const window = rates.slice(i - windowSize, i);
    movingAverage.push(window.reduce((sum, r) => sum + r, 0) / windowSize);
  }
  
  if (movingAverage.length > 2) {
    const firstAvg = movingAverage.slice(0, Math.floor(movingAverage.length / 3))
      .reduce((sum, a) => sum + a, 0) / Math.floor(movingAverage.length / 3);
    const lastAvg = movingAverage.slice(-Math.floor(movingAverage.length / 3))
      .reduce((sum, a) => sum + a, 0) / Math.floor(movingAverage.length / 3);
    
    if (Math.abs(lastAvg - firstAvg) > 0.5) {
      patterns.trending = lastAvg > firstAvg ? 'upward' : 'downward';
    }
  }
  
  const monthlyAverages = new Map();
  dataPoints.forEach(point => {
    const month = point.date.getMonth();
    if (!monthlyAverages.has(month)) {
      monthlyAverages.set(month, { sum: 0, count: 0 });
    }
    const monthData = monthlyAverages.get(month);
    monthData.sum += point.rate;
    monthData.count++;
  });
  
  if (monthlyAverages.size >= 6) {
    const averages = Array.from(monthlyAverages.values())
      .map(m => m.sum / m.count);
    const overallAvg = averages.reduce((sum, a) => sum + a, 0) / averages.length;
    const variance = averages.reduce((sum, a) => sum + Math.pow(a - overallAvg, 2), 0) / averages.length;
    
    if (variance > 1) {
      patterns.seasonal = true;
    }
  }
  
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
  }
  
  if (intervals.length > 5) {
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length
    );
    
    if (stdDev < avgInterval * 0.3) {
      patterns.regularInterval = true;
    }
  }
  
  return patterns;
}

export function formatPredictionSummary(predictions) {
  // Handle both camelCase and snake_case API responses
  const nextChange = predictions.next_change || predictions.nextChange;
  const magnitude = predictions.magnitude || predictions.magnitude;
  const upsizeProbability = predictions.upsize_probability || predictions.upsizeProbability;
  
  // Return empty summary if data is missing
  if (!nextChange || !magnitude || !upsizeProbability) {
    return {
      headline: 'Insufficient prediction data',
      details: [],
      recommendations: []
    };
  }
  
  const summary = {
    headline: '',
    details: [],
    recommendations: []
  };
  
  const expectedDays = nextChange.expected_days || nextChange.expectedDays;
  const expectedChange = magnitude.expected_change || magnitude.expectedChange;
  const standardDeviation = magnitude.standard_deviation || magnitude.standardDeviation;
  const probability = upsizeProbability.probability || 0;
  
  if (expectedDays <= 7) {
    summary.headline = `High probability of rate change within a week`;
  } else if (expectedDays <= 14) {
    summary.headline = `Rate change likely within two weeks`;
  } else if (expectedDays <= 30) {
    summary.headline = `Rate change expected within a month`;
  } else {
    summary.headline = `Rate change not expected soon`;
  }
  
  summary.details.push(
    `Expected in ${expectedDays} days (±${standardDeviation || 0} days)`
  );
  
  if (expectedChange > 0) {
    summary.details.push(
      `Likely increase of ${expectedChange}% (±${standardDeviation || 0}%)`
    );
  } else if (expectedChange < 0) {
    summary.details.push(
      `Likely decrease of ${Math.abs(expectedChange)}% (±${standardDeviation || 0}%)`
    );
  } else {
    summary.details.push(
      `Minimal change expected (±${standardDeviation || 0}%)`
    );
  }
  
  if (probability > 60) {
    summary.details.push(
      `${probability}% chance of promotional upsize`
    );
    summary.recommendations.push('Consider waiting for potential upsize offer');
  }
  
  const probabilities = nextChange.probabilities || {};
  const within7Days = probabilities.within_7_days || probabilities.within7Days || 0;
  
  if (within7Days > 0.7) {
    summary.recommendations.push('Monitor closely - change imminent');
  } else if (within7Days < 0.3) {
    summary.recommendations.push('Current rates likely stable for now');
  }
  
  if (expectedChange > 1 && expectedDays < 14) {
    summary.recommendations.push('Potential opportunity for higher cashback soon');
  } else if (expectedChange < -1 && expectedDays < 14) {
    summary.recommendations.push('Consider using current rates before potential decrease');
  }
  
  return summary;
}

export function compareStores(storeModels) {
  const comparisons = storeModels.map(({ storeId, model, predictions }) => ({
    storeId,
    nextChangeScore: 100 - predictions.nextChange.expectedDays,
    magnitudeScore: predictions.magnitude.expectedChange,
    upsizeScore: predictions.upsizeProbability.probability,
    confidenceScore: predictions.modelConfidence,
    overallScore: 0
  }));
  
  comparisons.forEach(comp => {
    comp.overallScore = (
      comp.nextChangeScore * 0.3 +
      comp.magnitudeScore * 0.3 +
      comp.upsizeScore * 0.2 +
      comp.confidenceScore * 0.2
    );
  });
  
  comparisons.sort((a, b) => b.overallScore - a.overallScore);
  
  return comparisons;
}

export function generateInsights(aggregatedData, predictions) {
  const insights = [];
  
  aggregatedData.forEach(store => {
    const stats = calculateRateStatistics(store.rateChanges);
    const patterns = detectPatterns(store.dataPoints);
    
    if (patterns.trending === 'upward') {
      insights.push({
        type: 'positive',
        storeId: store.storeId,
        message: `${store.storeName} shows upward trend in cashback rates`
      });
    } else if (patterns.trending === 'downward') {
      insights.push({
        type: 'negative',
        storeId: store.storeId,
        message: `${store.storeName} shows declining cashback rates`
      });
    }
    
    if (patterns.seasonal) {
      insights.push({
        type: 'info',
        storeId: store.storeId,
        message: `${store.storeName} exhibits seasonal cashback patterns`
      });
    }
    
    if (stats.volatility > 2) {
      insights.push({
        type: 'warning',
        storeId: store.storeId,
        message: `${store.storeName} has highly volatile cashback rates`
      });
    }
    
    if (store.upsizeEvents.length > 3) {
      insights.push({
        type: 'positive',
        storeId: store.storeId,
        message: `${store.storeName} frequently offers promotional upsizes`
      });
    }
  });
  
  return insights;
}