export class BayesianCashbackModel {
  constructor() {
    this.priors = {
      timeToChange: {
        alpha: 2.0,
        beta: 0.1
      },
      magnitudeChange: {
        mu0: 0,
        kappa0: 1,
        alpha0: 3,
        beta0: 1
      },
      upsizeProbability: {
        alpha: 1,
        beta: 1
      }
    };

    this.posteriors = { ...this.priors };
    this.observationCount = 0;
    this.lastUpdate = new Date();
  }

  updateWithObservation(observation) {
    const { timeSinceLastChange, magnitudeOfChange, wasUpsized } = observation;
    
    if (timeSinceLastChange !== undefined && timeSinceLastChange !== null) {
      this.updateTimeModel(timeSinceLastChange);
    }
    
    if (magnitudeOfChange !== undefined && magnitudeOfChange !== null) {
      this.updateMagnitudeModel(magnitudeOfChange);
    }
    
    if (wasUpsized !== undefined) {
      this.updateUpsizeModel(wasUpsized);
    }
    
    this.observationCount++;
    this.lastUpdate = new Date();
  }

  updateTimeModel(timeDays) {
    const rate = 1 / timeDays;
    this.posteriors.timeToChange.alpha += 1;
    this.posteriors.timeToChange.beta += timeDays;
  }

  updateMagnitudeModel(magnitude) {
    const { mu0, kappa0, alpha0, beta0 } = this.posteriors.magnitudeChange;
    
    const kappa1 = kappa0 + 1;
    const mu1 = (kappa0 * mu0 + magnitude) / kappa1;
    const alpha1 = alpha0 + 0.5;
    const beta1 = beta0 + 0.5 * kappa0 * Math.pow(magnitude - mu0, 2) / kappa1;
    
    this.posteriors.magnitudeChange = {
      mu0: mu1,
      kappa0: kappa1,
      alpha0: alpha1,
      beta0: beta1
    };
  }

  updateUpsizeModel(wasUpsized) {
    if (wasUpsized) {
      this.posteriors.upsizeProbability.alpha += 1;
    } else {
      this.posteriors.upsizeProbability.beta += 1;
    }
  }

  predictNextChange(currentDate = new Date()) {
    const { alpha, beta } = this.posteriors.timeToChange;
    const expectedRate = alpha / beta;
    const expectedDays = 1 / expectedRate;
    const variance = alpha / (beta * beta);
    const stdDev = Math.sqrt(variance);
    
    const confidenceIntervals = {
      days50: this.gammaQuantile(0.5, alpha, beta),
      days75: this.gammaQuantile(0.75, alpha, beta),
      days95: this.gammaQuantile(0.95, alpha, beta)
    };
    
    const probabilities = {
      within7Days: this.gammaCDF(7, alpha, beta),
      within14Days: this.gammaCDF(14, alpha, beta),
      within30Days: this.gammaCDF(30, alpha, beta)
    };
    
    return {
      expectedDays: Math.round(expectedDays * 10) / 10,
      standardDeviation: Math.round(stdDev * 10) / 10,
      confidenceIntervals,
      probabilities,
      predictedDate: new Date(currentDate.getTime() + expectedDays * 24 * 60 * 60 * 1000)
    };
  }

  predictMagnitudeChange() {
    const { mu0, kappa0, alpha0, beta0 } = this.posteriors.magnitudeChange;
    
    const expectedMean = mu0;
    const expectedVariance = beta0 / (alpha0 - 1) * (1 + 1/kappa0);
    const stdDev = Math.sqrt(expectedVariance);
    
    return {
      expectedChange: Math.round(expectedMean * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      confidenceInterval95: {
        lower: Math.round((expectedMean - 1.96 * stdDev) * 100) / 100,
        upper: Math.round((expectedMean + 1.96 * stdDev) * 100) / 100
      }
    };
  }

  predictUpsizeProbability() {
    const { alpha, beta } = this.posteriors.upsizeProbability;
    const probability = alpha / (alpha + beta);
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);
    
    return {
      probability: Math.round(probability * 1000) / 10,
      confidence: Math.round((1 - stdDev) * 1000) / 10
    };
  }

  getModelSummary() {
    return {
      observationCount: this.observationCount,
      lastUpdate: this.lastUpdate,
      predictions: {
        nextChange: this.predictNextChange(),
        magnitude: this.predictMagnitudeChange(),
        upsizeProbability: this.predictUpsizeProbability()
      },
      posteriors: this.posteriors,
      modelConfidence: this.calculateModelConfidence()
    };
  }

  calculateModelConfidence() {
    const minObservations = 10;
    const optimalObservations = 100;
    
    if (this.observationCount < minObservations) {
      return this.observationCount / minObservations * 30;
    } else if (this.observationCount < optimalObservations) {
      return 30 + ((this.observationCount - minObservations) / (optimalObservations - minObservations)) * 50;
    } else {
      return Math.min(80 + Math.log10(this.observationCount / optimalObservations) * 10, 95);
    }
  }

  gammaCDF(x, alpha, beta) {
    const rate = alpha / beta;
    let sum = 0;
    let term = Math.exp(-rate * x);
    
    for (let k = 0; k < alpha; k++) {
      sum += term;
      term *= rate * x / (k + 1);
    }
    
    return Math.min(sum, 1);
  }

  gammaQuantile(p, alpha, beta) {
    let low = 0;
    let high = 1000;
    const tolerance = 0.01;
    
    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      const cdf = this.gammaCDF(mid, alpha, beta);
      
      if (cdf < p) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return Math.round((low + high) / 2 * 10) / 10;
  }

  serializeModel() {
    return JSON.stringify({
      priors: this.priors,
      posteriors: this.posteriors,
      observationCount: this.observationCount,
      lastUpdate: this.lastUpdate
    });
  }

  static deserializeModel(jsonString) {
    const data = JSON.parse(jsonString);
    const model = new BayesianCashbackModel();
    model.priors = data.priors;
    model.posteriors = data.posteriors;
    model.observationCount = data.observationCount;
    model.lastUpdate = new Date(data.lastUpdate);
    return model;
  }
}

export function processHistoricalData(cashbackHistory) {
  const observations = [];
  const sortedHistory = [...cashbackHistory].sort((a, b) => 
    new Date(a.scraped_at) - new Date(b.scraped_at)
  );
  
  const groupedByStore = {};
  sortedHistory.forEach(entry => {
    const key = `${entry.store_id}_${entry.category || 'main'}`;
    if (!groupedByStore[key]) {
      groupedByStore[key] = [];
    }
    groupedByStore[key].push(entry);
  });
  
  Object.values(groupedByStore).forEach(storeHistory => {
    for (let i = 1; i < storeHistory.length; i++) {
      const current = storeHistory[i];
      const previous = storeHistory[i - 1];
      
      const currentRate = current.main_rate_numeric || current.category_rate_numeric || 0;
      const previousRate = previous.main_rate_numeric || previous.category_rate_numeric || 0;
      
      if (Math.abs(currentRate - previousRate) > 0.01) {
        const timeDiff = (new Date(current.scraped_at) - new Date(previous.scraped_at)) / (1000 * 60 * 60 * 24);
        
        observations.push({
          timeSinceLastChange: Math.max(timeDiff, 0.1),
          magnitudeOfChange: currentRate - previousRate,
          wasUpsized: current.is_upsized || false,
          timestamp: current.scraped_at,
          storeId: current.store_id
        });
      }
    }
  });
  
  return observations;
}

export function trainModel(observations) {
  const model = new BayesianCashbackModel();
  
  observations.forEach(obs => {
    model.updateWithObservation(obs);
  });
  
  return model;
}

export function calculatePredictionAccuracy(predictions, actual) {
  const timeDiff = Math.abs(predictions.nextChange.expectedDays - actual.daysUntilChange);
  const magnitudeDiff = Math.abs(predictions.magnitude.expectedChange - actual.magnitudeChange);
  
  const timeAccuracy = Math.max(0, 100 - (timeDiff / actual.daysUntilChange) * 100);
  const magnitudeAccuracy = Math.max(0, 100 - (magnitudeDiff / Math.abs(actual.magnitudeChange)) * 100);
  
  return {
    timeAccuracy: Math.round(timeAccuracy),
    magnitudeAccuracy: Math.round(magnitudeAccuracy),
    overallAccuracy: Math.round((timeAccuracy + magnitudeAccuracy) / 2)
  };
}