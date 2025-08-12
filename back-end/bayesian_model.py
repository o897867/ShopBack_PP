import numpy as np
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from scipy import stats
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ModelPosteriors:
    """Store posterior distributions parameters"""
    time_alpha: float = 2.0
    time_beta: float = 0.1
    magnitude_mu0: float = 0.0
    magnitude_kappa0: float = 1.0
    magnitude_alpha0: float = 3.0
    magnitude_beta0: float = 1.0
    upsize_alpha: float = 1.0
    upsize_beta: float = 1.0
    observation_count: int = 0
    last_update: str = ""

class BayesianCashbackModel:
    """
    Self-adaptive Bayesian model for cashback prediction
    """
    
    def __init__(self, store_id: Optional[int] = None):
        self.store_id = store_id
        self.posteriors = ModelPosteriors()
        self.posteriors.last_update = datetime.now().isoformat()
        
    def update_with_observation(self, observation: Dict):
        """Update posterior distributions with new observation"""
        
        # Update time to change model (Gamma distribution)
        if 'time_since_last_change' in observation:
            days = observation['time_since_last_change']
            if days > 0:
                self.posteriors.time_alpha += 1
                self.posteriors.time_beta += days
        
        # Update magnitude model (Normal-Gamma distribution)
        if 'magnitude_of_change' in observation:
            magnitude = observation['magnitude_of_change']
            
            # Update using Bayesian conjugate prior formulas
            kappa0 = self.posteriors.magnitude_kappa0
            mu0 = self.posteriors.magnitude_mu0
            alpha0 = self.posteriors.magnitude_alpha0
            beta0 = self.posteriors.magnitude_beta0
            
            kappa1 = kappa0 + 1
            mu1 = (kappa0 * mu0 + magnitude) / kappa1
            alpha1 = alpha0 + 0.5
            beta1 = beta0 + 0.5 * kappa0 * (magnitude - mu0)**2 / kappa1
            
            self.posteriors.magnitude_mu0 = mu1
            self.posteriors.magnitude_kappa0 = kappa1
            self.posteriors.magnitude_alpha0 = alpha1
            self.posteriors.magnitude_beta0 = beta1
        
        # Update upsize probability (Beta distribution)
        if 'was_upsized' in observation:
            if observation['was_upsized']:
                self.posteriors.upsize_alpha += 1
            else:
                self.posteriors.upsize_beta += 1
        
        self.posteriors.observation_count += 1
        self.posteriors.last_update = datetime.now().isoformat()
    
    def predict_next_change(self) -> Dict:
        """Predict when the next rate change will occur"""
        
        # Expected value of Gamma distribution
        alpha = self.posteriors.time_alpha
        beta = self.posteriors.time_beta
        
        expected_rate = alpha / beta
        expected_days = 1 / expected_rate if expected_rate > 0 else 365
        
        # Calculate confidence intervals using Gamma distribution
        confidence_intervals = {
            'days_50': stats.gamma.ppf(0.5, alpha, scale=1/beta),
            'days_75': stats.gamma.ppf(0.75, alpha, scale=1/beta),
            'days_95': stats.gamma.ppf(0.95, alpha, scale=1/beta)
        }
        
        # Calculate probabilities for different time horizons
        probabilities = {
            'within_7_days': stats.gamma.cdf(7, alpha, scale=1/beta),
            'within_14_days': stats.gamma.cdf(14, alpha, scale=1/beta),
            'within_30_days': stats.gamma.cdf(30, alpha, scale=1/beta)
        }
        
        predicted_date = datetime.now() + timedelta(days=expected_days)
        
        return {
            'expected_days': round(expected_days, 1),
            'confidence_intervals': confidence_intervals,
            'probabilities': probabilities,
            'predicted_date': predicted_date.isoformat()
        }
    
    def predict_magnitude_change(self) -> Dict:
        """Predict the magnitude of the next rate change"""
        
        # Student's t-distribution parameters
        mu = self.posteriors.magnitude_mu0
        alpha = self.posteriors.magnitude_alpha0
        beta = self.posteriors.magnitude_beta0
        kappa = self.posteriors.magnitude_kappa0
        
        # Expected value and variance
        expected_mean = mu
        if alpha > 1:
            expected_variance = beta / (alpha - 1) * (1 + 1/kappa)
        else:
            expected_variance = float('inf')
        
        std_dev = np.sqrt(expected_variance) if expected_variance != float('inf') else 10.0
        
        # Confidence interval
        confidence_interval_95 = {
            'lower': round(expected_mean - 1.96 * std_dev, 2),
            'upper': round(expected_mean + 1.96 * std_dev, 2)
        }
        
        return {
            'expected_change': round(expected_mean, 2),
            'standard_deviation': round(std_dev, 2),
            'confidence_interval_95': confidence_interval_95
        }
    
    def predict_upsize_probability(self) -> Dict:
        """Predict probability of next offer being upsized"""
        
        alpha = self.posteriors.upsize_alpha
        beta = self.posteriors.upsize_beta
        
        # Beta distribution expected value
        probability = alpha / (alpha + beta)
        
        # Variance of Beta distribution
        variance = (alpha * beta) / ((alpha + beta)**2 * (alpha + beta + 1))
        std_dev = np.sqrt(variance)
        
        # Confidence using standard deviation
        confidence = max(0, min(100, (1 - std_dev) * 100))
        
        return {
            'probability': round(probability * 100, 1),
            'confidence': round(confidence, 1)
        }
    
    def calculate_model_confidence(self) -> float:
        """Calculate overall model confidence based on observation count"""
        
        obs_count = self.posteriors.observation_count
        
        if obs_count < 10:
            return obs_count / 10 * 30
        elif obs_count < 100:
            return 30 + ((obs_count - 10) / 90) * 50
        else:
            return min(80 + np.log10(obs_count / 100) * 10, 95)
    
    def get_model_summary(self) -> Dict:
        """Get complete model summary with all predictions"""
        
        return {
            'store_id': self.store_id,
            'observation_count': self.posteriors.observation_count,
            'last_update': self.posteriors.last_update,
            'model_confidence': round(self.calculate_model_confidence(), 1),
            'predictions': {
                'next_change': self.predict_next_change(),
                'magnitude': self.predict_magnitude_change(),
                'upsize_probability': self.predict_upsize_probability()
            },
            'posteriors': asdict(self.posteriors)
        }
    
    def serialize(self) -> str:
        """Serialize model to JSON string"""
        return json.dumps(asdict(self.posteriors))
    
    @classmethod
    def deserialize(cls, json_str: str, store_id: Optional[int] = None):
        """Deserialize model from JSON string"""
        data = json.loads(json_str)
        model = cls(store_id)
        model.posteriors = ModelPosteriors(**data)
        return model


class ModelManager:
    """Manage Bayesian models in database"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._create_tables()
    
    def _create_tables(self):
        """Create tables for storing model states"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bayesian_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id INTEGER,
                model_data TEXT NOT NULL,
                observation_count INTEGER,
                model_confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(store_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id INTEGER,
                prediction_type TEXT,
                prediction_value REAL,
                confidence REAL,
                predicted_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_model(self, model: BayesianCashbackModel):
        """Save or update model in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        model_data = model.serialize()
        confidence = model.calculate_model_confidence()
        
        cursor.execute("""
            INSERT OR REPLACE INTO bayesian_models 
            (store_id, model_data, observation_count, model_confidence, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (model.store_id, model_data, model.posteriors.observation_count, confidence))
        
        # Save predictions
        summary = model.get_model_summary()
        predictions = summary['predictions']
        
        # Save next change prediction
        cursor.execute("""
            INSERT INTO model_predictions 
            (store_id, prediction_type, prediction_value, confidence, predicted_date)
            VALUES (?, 'next_change_days', ?, ?, ?)
        """, (
            model.store_id,
            predictions['next_change']['expected_days'],
            summary['model_confidence'],
            predictions['next_change']['predicted_date']
        ))
        
        # Save magnitude prediction
        cursor.execute("""
            INSERT INTO model_predictions 
            (store_id, prediction_type, prediction_value, confidence)
            VALUES (?, 'magnitude_change', ?, ?)
        """, (
            model.store_id,
            predictions['magnitude']['expected_change'],
            summary['model_confidence']
        ))
        
        # Save upsize probability
        cursor.execute("""
            INSERT INTO model_predictions 
            (store_id, prediction_type, prediction_value, confidence)
            VALUES (?, 'upsize_probability', ?, ?)
        """, (
            model.store_id,
            predictions['upsize_probability']['probability'],
            predictions['upsize_probability']['confidence']
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Model saved for store {model.store_id}")
    
    def load_model(self, store_id: Optional[int] = None) -> Optional[BayesianCashbackModel]:
        """Load model from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if store_id is None:
            cursor.execute("""
                SELECT model_data FROM bayesian_models 
                WHERE store_id IS NULL
                ORDER BY updated_at DESC LIMIT 1
            """)
        else:
            cursor.execute("""
                SELECT model_data FROM bayesian_models 
                WHERE store_id = ?
                ORDER BY updated_at DESC LIMIT 1
            """, (store_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return BayesianCashbackModel.deserialize(result[0], store_id)
        return None
    
    def get_all_predictions(self) -> List[Dict]:
        """Get all latest predictions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT 
                s.id as store_id,
                s.name as store_name,
                MAX(CASE WHEN mp.prediction_type = 'next_change_days' 
                    THEN mp.prediction_value END) as next_change_days,
                MAX(CASE WHEN mp.prediction_type = 'magnitude_change' 
                    THEN mp.prediction_value END) as magnitude_change,
                MAX(CASE WHEN mp.prediction_type = 'upsize_probability' 
                    THEN mp.prediction_value END) as upsize_probability,
                AVG(mp.confidence) as avg_confidence
            FROM stores s
            LEFT JOIN model_predictions mp ON s.id = mp.store_id
            WHERE mp.created_at > datetime('now', '-1 day')
            GROUP BY s.id, s.name
            ORDER BY next_change_days ASC
        """)
        
        results = cursor.fetchall()
        conn.close()
        
        predictions = []
        for row in results:
            predictions.append({
                'store_id': row[0],
                'store_name': row[1],
                'next_change_days': row[2],
                'magnitude_change': row[3],
                'upsize_probability': row[4],
                'confidence': row[5]
            })
        
        return predictions


def process_historical_data(db_path: str, store_id: Optional[int] = None) -> List[Dict]:
    """Process historical cashback data into observations"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get historical data
    if store_id:
        query = """
            SELECT store_id, category, main_rate_numeric, category_rate_numeric, 
                   is_upsized, scraped_at
            FROM cashback_history
            WHERE store_id = ?
            ORDER BY scraped_at
        """
        cursor.execute(query, (store_id,))
    else:
        query = """
            SELECT store_id, category, main_rate_numeric, category_rate_numeric, 
                   is_upsized, scraped_at
            FROM cashback_history
            ORDER BY store_id, category, scraped_at
        """
        cursor.execute(query)
    
    rows = cursor.fetchall()
    conn.close()
    
    observations = []
    last_rates = {}
    
    for row in rows:
        store_id, category, main_rate, category_rate, is_upsized, scraped_at = row
        
        rate = main_rate if main_rate else category_rate
        if rate is None:
            continue
        
        key = f"{store_id}_{category or 'main'}"
        scraped_date = datetime.fromisoformat(scraped_at)
        
        if key in last_rates:
            last_rate, last_date = last_rates[key]
            
            # Check if rate changed
            if abs(rate - last_rate) > 0.01:
                days_diff = (scraped_date - last_date).days
                magnitude = rate - last_rate
                
                observations.append({
                    'time_since_last_change': max(days_diff, 0.1),
                    'magnitude_of_change': magnitude,
                    'was_upsized': bool(is_upsized),
                    'timestamp': scraped_at,
                    'store_id': store_id
                })
        
        last_rates[key] = (rate, scraped_date)
    
    return observations


def train_model(db_path: str, store_id: Optional[int] = None) -> BayesianCashbackModel:
    """Train a new model with historical data"""
    
    # Get observations from historical data
    observations = process_historical_data(db_path, store_id)
    
    # Create and train model
    model = BayesianCashbackModel(store_id)
    
    for obs in observations:
        model.update_with_observation(obs)
    
    logger.info(f"Trained model with {len(observations)} observations for store {store_id}")
    
    return model


def update_all_models(db_path: str):
    """Update all store models and global model"""
    
    manager = ModelManager(db_path)
    
    # Get all stores
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT id FROM stores")
    store_ids = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    # Update individual store models
    for store_id in store_ids:
        try:
            model = train_model(db_path, store_id)
            manager.save_model(model)
            logger.info(f"Updated model for store {store_id}")
        except Exception as e:
            logger.error(f"Error updating model for store {store_id}: {e}")
    
    # Update global model
    try:
        global_model = train_model(db_path, None)
        manager.save_model(global_model)
        logger.info("Updated global model")
    except Exception as e:
        logger.error(f"Error updating global model: {e}")


if __name__ == "__main__":
    # Example usage
    db_path = "shopback.db"
    
    # Update all models
    update_all_models(db_path)
    
    # Load and use a model
    manager = ModelManager(db_path)
    model = manager.load_model()
    
    if model:
        summary = model.get_model_summary()
        print(json.dumps(summary, indent=2))