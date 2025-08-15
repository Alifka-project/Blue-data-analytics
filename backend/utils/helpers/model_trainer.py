import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score, classification_report
import joblib
import logging
from pathlib import Path
import sys
from datetime import datetime

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.settings import MODELS_TRAINED, MODEL_SETTINGS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainer:
    """Handles training and saving of ML models for the Blue Data Analytics project"""
    
    def __init__(self):
        self.models = {}
        self.model_metrics = {}
        self.training_timestamp = None
        
    def prepare_features(self, df):
        """Prepare features for model training"""
        try:
            logger.info("🔧 Preparing features for model training...")
            
            # Features for missed cleaning prediction
            feature_cols = ['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection', 'Gallons_per_Trap']
            
            # Create target for missed cleaning (outlets with no recent service)
            df['Missed_Cleaning'] = (df['Days_Since_Collection'] > 30).astype(int)
            
            # Prepare data for modeling
            model_data = df[feature_cols + ['Missed_Cleaning']].dropna()
            
            if len(model_data) < MODEL_SETTINGS['min_data_threshold']:
                logger.warning(f"⚠️ Not enough data for training. Need at least {MODEL_SETTINGS['min_data_threshold']} records, got {len(model_data)}")
                return None, None, None
                
            X = model_data[feature_cols]
            y = model_data['Missed_Cleaning']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=MODEL_SETTINGS['test_size'], 
                random_state=MODEL_SETTINGS['random_state']
            )
            
            logger.info(f"✅ Features prepared: {len(X_train)} training samples, {len(X_test)} test samples")
            return X_train, X_test, y_train, y_test
            
        except Exception as e:
            logger.error(f"❌ Failed to prepare features: {e}")
            return None, None, None, None
    
    def train_missed_cleaning_model(self, X_train, X_test, y_train, y_test):
        """Train Random Forest model for missed cleaning prediction"""
        try:
            logger.info("🤖 Training missed cleaning prediction model...")
            
            # Train Random Forest
            rf_classifier = RandomForestClassifier(
                n_estimators=MODEL_SETTINGS['n_estimators'],
                random_state=MODEL_SETTINGS['random_state']
            )
            rf_classifier.fit(X_train, y_train)
            
            # Make predictions
            y_pred = rf_classifier.predict(X_test)
            y_pred_proba = rf_classifier.predict_proba(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            feature_importance = dict(zip(X_train.columns, rf_classifier.feature_importances_))
            
            # Store model and metrics
            self.models['missed_cleaning'] = {
                'model': rf_classifier,
                'accuracy': accuracy,
                'feature_importance': feature_importance,
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }
            
            self.model_metrics['missed_cleaning'] = {
                'accuracy': accuracy,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
            
            logger.info(f"✅ Missed cleaning model trained with {accuracy:.3f} accuracy")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to train missed cleaning model: {e}")
            return False
    
    def train_volume_prediction_model(self, df):
        """Train Random Forest model for volume prediction"""
        try:
            logger.info("🤖 Training volume prediction model...")
            
            # Prepare volume prediction data
            volume_data = df[['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection']].dropna()
            
            if len(volume_data) < MODEL_SETTINGS['min_data_threshold']:
                logger.warning(f"⚠️ Not enough data for volume prediction training. Need at least {MODEL_SETTINGS['min_data_threshold']} records, got {len(volume_data)}")
                return False
            
            X_vol = volume_data[['Sum of No of Traps', 'Days_Since_Collection']]
            y_vol = volume_data['Sum of Gallons Collected']
            
            # Split data
            X_train_vol, X_test_vol, y_train_vol, y_test_vol = train_test_split(
                X_vol, y_vol,
                test_size=MODEL_SETTINGS['test_size'],
                random_state=MODEL_SETTINGS['random_state']
            )
            
            # Train Random Forest Regressor
            rf_regressor = RandomForestRegressor(
                n_estimators=MODEL_SETTINGS['n_estimators'],
                random_state=MODEL_SETTINGS['random_state']
            )
            rf_regressor.fit(X_train_vol, y_train_vol)
            
            # Make predictions
            y_pred_vol = rf_regressor.predict(X_test_vol)
            
            # Calculate metrics
            r2 = r2_score(y_test_vol, y_pred_vol)
            feature_importance = dict(zip(X_train_vol.columns, rf_regressor.feature_importances_))
            
            # Store model and metrics
            self.models['volume_prediction'] = {
                'model': rf_regressor,
                'accuracy': r2,
                'feature_importance': feature_importance,
                'predictions': y_pred_vol
            }
            
            self.model_metrics['volume_prediction'] = {
                'r2_score': r2,
                'rmse': np.sqrt(np.mean((y_test_vol - y_pred_vol) ** 2))
            }
            
            logger.info(f"✅ Volume prediction model trained with R² = {r2:.3f}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to train volume prediction model: {e}")
            return False
    
    def train_all_models(self, df):
        """Train all models"""
        try:
            logger.info("🚀 Starting model training pipeline...")
            self.training_timestamp = datetime.now()
            
            # Prepare features
            X_train, X_test, y_train, y_test = self.prepare_features(df)
            
            if X_train is None:
                logger.error("❌ Feature preparation failed")
                return False
            
            # Train missed cleaning model
            if not self.train_missed_cleaning_model(X_train, X_test, y_train, y_test):
                logger.error("❌ Missed cleaning model training failed")
                return False
            
            # Train volume prediction model
            if not self.train_volume_prediction_model(df):
                logger.error("❌ Volume prediction model training failed")
                return False
            
            logger.info("✅ All models trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Model training pipeline failed: {e}")
            return False
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            logger.info("💾 Saving trained models...")
            
            for model_name, model_data in self.models.items():
                model_path = MODELS_TRAINED / f"{model_name}_model.joblib"
                joblib.dump(model_data['model'], model_path)
                logger.info(f"✅ Saved {model_name} model to {model_path}")
            
            # Save model metrics
            metrics_path = MODELS_TRAINED / "model_metrics.json"
            import json
            with open(metrics_path, 'w') as f:
                json.dump(self.model_metrics, f, indent=2, default=str)
            logger.info(f"✅ Saved model metrics to {metrics_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save models: {e}")
            return False
    
    def load_models(self):
        """Load previously trained models from disk"""
        try:
            logger.info("📂 Loading trained models...")
            
            model_files = {
                'missed_cleaning': 'missed_cleaning_model.joblib',
                'volume_prediction': 'volume_prediction_model.joblib'
            }
            
            for model_name, filename in model_files.items():
                model_path = MODELS_TRAINED / filename
                if model_path.exists():
                    self.models[model_name] = {
                        'model': joblib.load(model_path)
                    }
                    logger.info(f"✅ Loaded {model_name} model from {model_path}")
                else:
                    logger.warning(f"⚠️ Model file not found: {model_path}")
            
            # Load metrics if available
            metrics_path = MODELS_TRAINED / "model_metrics.json"
            if metrics_path.exists():
                import json
                with open(metrics_path, 'r') as f:
                    self.model_metrics = json.load(f)
                logger.info(f"✅ Loaded model metrics from {metrics_path}")
            
            return len(self.models) > 0
            
        except Exception as e:
            logger.error(f"❌ Failed to load models: {e}")
            return False
    
    def get_model_summary(self):
        """Get summary of trained models"""
        summary = {
            "total_models": len(self.models),
            "models_trained": list(self.models.keys()),
            "training_timestamp": self.training_timestamp.isoformat() if self.training_timestamp else None,
            "metrics": self.model_metrics
        }
        return summary
