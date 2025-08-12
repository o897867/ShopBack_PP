#!/usr/bin/env python3
"""
Background model updater for Bayesian cashback prediction
Automatically retrains models when new data is available
"""

import time
import threading
import schedule
import logging
import sqlite3
from datetime import datetime, timedelta
from bayesian_model import ModelManager, update_all_models, train_model
from typing import Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelScheduler:
    """Background scheduler for model updates"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.model_manager = ModelManager(db_path)
        self.running = False
        self.scheduler_thread = None
        
        # Performance metrics
        self.last_update_time = None
        self.update_count = 0
        self.errors = []
        
    def start(self):
        """Start the background scheduler"""
        if self.running:
            logger.warning("Scheduler is already running")
            return
        
        self.running = True
        logger.info("Starting model scheduler...")
        
        # Schedule tasks
        schedule.every(30).minutes.do(self.check_for_new_data)
        schedule.every(2).hours.do(self.update_low_confidence_models)
        schedule.every(6).hours.do(self.retrain_all_models)
        schedule.every().day.at("02:00").do(self.cleanup_old_data)
        schedule.every().day.at("03:00").do(self.validate_all_models)
        
        # Start scheduler thread
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("Model scheduler started successfully")
    
    def stop(self):
        """Stop the background scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Model scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                self.errors.append({
                    'timestamp': datetime.now().isoformat(),
                    'error': str(e)
                })
                time.sleep(300)  # Wait 5 minutes before retrying
    
    def check_for_new_data(self):
        """Check for new cashback data and update models if needed"""
        try:
            logger.info("Checking for new data...")
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get latest data timestamp
            cursor.execute("""
                SELECT MAX(scraped_at) FROM cashback_history
                WHERE scraped_at > datetime('now', '-30 minutes')
            """)
            
            latest_data = cursor.fetchone()[0]
            
            if latest_data:
                logger.info(f"Found new data from {latest_data}")
                
                # Get stores with new data
                cursor.execute("""
                    SELECT DISTINCT store_id FROM cashback_history
                    WHERE scraped_at > datetime('now', '-30 minutes')
                """)
                
                store_ids = [row[0] for row in cursor.fetchall()]
                conn.close()
                
                # Update models for stores with new data
                for store_id in store_ids:
                    self.update_store_model(store_id)
                
                # Update global model
                self.update_global_model()
                
                self.update_count += 1
                self.last_update_time = datetime.now()
                
            else:
                logger.info("No new data found")
                conn.close()
                
        except Exception as e:
            logger.error(f"Error checking for new data: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"check_for_new_data: {str(e)}"
            })
    
    def update_store_model(self, store_id: int):
        """Update model for specific store"""
        try:
            logger.info(f"Updating model for store {store_id}")
            
            # Get recent observations for this store
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM cashback_history
                WHERE store_id = ? AND scraped_at > datetime('now', '-7 days')
            """, (store_id,))
            
            recent_count = cursor.fetchone()[0]
            conn.close()
            
            # Only update if there's sufficient new data
            if recent_count >= 3:
                model = train_model(self.db_path, store_id)
                self.model_manager.save_model(model)
                logger.info(f"Successfully updated model for store {store_id}")
            else:
                logger.info(f"Insufficient new data for store {store_id} ({recent_count} records)")
                
        except Exception as e:
            logger.error(f"Error updating model for store {store_id}: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"update_store_model({store_id}): {str(e)}"
            })
    
    def update_global_model(self):
        """Update global model with all data"""
        try:
            logger.info("Updating global model")
            
            model = train_model(self.db_path, None)
            self.model_manager.save_model(model)
            
            logger.info("Successfully updated global model")
            
        except Exception as e:
            logger.error(f"Error updating global model: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"update_global_model: {str(e)}"
            })
    
    def update_low_confidence_models(self):
        """Update models with low confidence scores"""
        try:
            logger.info("Updating low confidence models...")
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Find models with low confidence
            cursor.execute("""
                SELECT store_id FROM bayesian_models
                WHERE model_confidence < 60
                AND updated_at < datetime('now', '-1 day')
            """)
            
            low_confidence_stores = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            logger.info(f"Found {len(low_confidence_stores)} low confidence models")
            
            for store_id in low_confidence_stores:
                if store_id:  # Skip null (global model)
                    self.update_store_model(store_id)
                    
        except Exception as e:
            logger.error(f"Error updating low confidence models: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"update_low_confidence_models: {str(e)}"
            })
    
    def retrain_all_models(self):
        """Completely retrain all models"""
        try:
            logger.info("Retraining all models...")
            
            update_all_models(self.db_path)
            
            logger.info("Successfully retrained all models")
            
        except Exception as e:
            logger.error(f"Error retraining all models: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"retrain_all_models: {str(e)}"
            })
    
    def cleanup_old_data(self):
        """Clean up old model predictions and data"""
        try:
            logger.info("Cleaning up old data...")
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Delete old predictions (keep last 30 days)
            cursor.execute("""
                DELETE FROM model_predictions
                WHERE created_at < datetime('now', '-30 days')
            """)
            
            deleted_predictions = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            logger.info(f"Cleaned up {deleted_predictions} old predictions")
            
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"cleanup_old_data: {str(e)}"
            })
    
    def validate_all_models(self):
        """Validate all models and report issues"""
        try:
            logger.info("Validating all models...")
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT store_id, model_confidence FROM bayesian_models")
            models = cursor.fetchall()
            conn.close()
            
            issues = []
            
            for store_id, confidence in models:
                if confidence < 30:
                    issues.append(f"Store {store_id}: Very low confidence ({confidence:.1f}%)")
                
                # Try to load model
                try:
                    model = self.model_manager.load_model(store_id)
                    if not model:
                        issues.append(f"Store {store_id}: Model failed to load")
                except Exception as e:
                    issues.append(f"Store {store_id}: Load error - {str(e)}")
            
            if issues:
                logger.warning(f"Model validation found {len(issues)} issues:")
                for issue in issues:
                    logger.warning(f"  - {issue}")
            else:
                logger.info("All models validated successfully")
                
        except Exception as e:
            logger.error(f"Error validating models: {e}")
            self.errors.append({
                'timestamp': datetime.now().isoformat(),
                'error': f"validate_all_models: {str(e)}"
            })
    
    def get_status(self) -> Dict:
        """Get scheduler status and metrics"""
        return {
            'running': self.running,
            'last_update_time': self.last_update_time.isoformat() if self.last_update_time else None,
            'update_count': self.update_count,
            'recent_errors': self.errors[-5:] if self.errors else [],
            'error_count': len(self.errors),
            'next_runs': {
                'check_new_data': self._get_next_run_time('check_for_new_data'),
                'update_low_confidence': self._get_next_run_time('update_low_confidence_models'),
                'retrain_all': self._get_next_run_time('retrain_all_models')
            }
        }
    
    def _get_next_run_time(self, job_name: str) -> str:
        """Get next run time for a scheduled job"""
        try:
            for job in schedule.jobs:
                if hasattr(job.job_func, '__name__') and job.job_func.__name__ == job_name:
                    return job.next_run.isoformat() if job.next_run else 'Unknown'
        except:
            pass
        return 'Unknown'
    
    def force_update_all(self):
        """Force immediate update of all models"""
        logger.info("Force updating all models...")
        self.retrain_all_models()


# Global scheduler instance
scheduler_instance = None

def start_model_scheduler(db_path: str):
    """Start the global model scheduler"""
    global scheduler_instance
    
    if scheduler_instance is None:
        scheduler_instance = ModelScheduler(db_path)
        scheduler_instance.start()
    
    return scheduler_instance

def stop_model_scheduler():
    """Stop the global model scheduler"""
    global scheduler_instance
    
    if scheduler_instance:
        scheduler_instance.stop()
        scheduler_instance = None

def get_scheduler_status() -> Dict:
    """Get status of the global scheduler"""
    global scheduler_instance
    
    if scheduler_instance:
        return scheduler_instance.get_status()
    else:
        return {'running': False, 'message': 'Scheduler not started'}

if __name__ == "__main__":
    # Test the scheduler
    import sys
    
    db_path = sys.argv[1] if len(sys.argv) > 1 else "shopback_data.db"
    
    scheduler = ModelScheduler(db_path)
    scheduler.start()
    
    try:
        # Keep running
        while True:
            time.sleep(60)
            status = scheduler.get_status()
            logger.info(f"Scheduler status: Updates={status['update_count']}, Errors={status['error_count']}")
    except KeyboardInterrupt:
        logger.info("Shutting down scheduler...")
        scheduler.stop()