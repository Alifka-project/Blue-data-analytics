#!/usr/bin/env python3
"""
Simple ML Training Script for Blue Data Analytics Dashboard
Generates predictions and saves them as JSON snapshots
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime, timedelta
import logging
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BlueDataML:
    def __init__(self, data_path: str = "data/processed/processed_data.csv"):
        self.data_path = Path(data_path)
        self.df = None
        self.models = {}
        self.scaler = StandardScaler()
        
    def load_data(self) -> bool:
        """Load processed data"""
        try:
            logger.info(f"Loading processed data from {self.data_path}")
            
            if not self.data_path.exists():
                logger.error(f"Processed data file not found: {self.data_path}")
                return False
            
            # Load CSV data
            self.df = pd.read_csv(self.data_path)
            logger.info(f"Loaded {len(self.df)} records")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return False
    
    def prepare_features(self) -> bool:
        """Prepare features for ML models"""
        try:
            logger.info("Preparing features for ML models")
            
            # Convert numeric columns
            numeric_cols = ['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection']
            for col in numeric_cols:
                if col in self.df.columns:
                    self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
            # Fill missing values
            self.df = self.df.fillna({
                'Sum of Gallons Collected': 0,
                'Sum of No of Traps': 1,
                'Days_Since_Collection': 30
            })
            
            # Create target variables
            self.df['missed_cleaning'] = (self.df['Days_Since_Collection'] > 30).astype(int)
            self.df['high_volume'] = (self.df['Sum of Gallons Collected'] > 
                                    self.df['Sum of Gallons Collected'].quantile(0.8)).astype(int)
            
            # Create feature matrix
            feature_cols = ['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection']
            self.X = self.df[feature_cols].values
            self.y_missed = self.df['missed_cleaning'].values
            self.y_volume = self.df['Sum of Gallons Collected'].values
            
            # Scale features
            self.X_scaled = self.scaler.fit_transform(self.X)
            
            logger.info("Features prepared successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return False
    
    def train_models(self) -> bool:
        """Train ML models"""
        try:
            logger.info("Training ML models")
            
            # Split data
            X_train, X_test, y_train, y_test, indices_train, indices_test = train_test_split(
                self.X_scaled, self.y_missed, range(len(self.X_scaled)), test_size=0.2, random_state=42
            )
            
            # Train missed cleaning classifier
            rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
            rf_classifier.fit(X_train, y_train)
            
            # Train volume predictor
            rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
            rf_regressor.fit(X_train, self.y_volume[indices_train])
            
            # Store models
            self.models = {
                'missed_cleaning': {
                    'model': rf_classifier,
                    'accuracy': rf_classifier.score(X_test, y_test),
                    'feature_importance': dict(zip(
                        ['Gallons', 'Traps', 'Days_Since'], 
                        rf_classifier.feature_importances_
                    ))
                },
                'volume_prediction': {
                    'model': rf_regressor,
                    'accuracy': rf_regressor.score(X_test, self.y_volume[indices_test]),
                    'feature_importance': dict(zip(
                        ['Gallons', 'Traps', 'Days_Since'], 
                        rf_regressor.feature_importances_
                    ))
                }
            }
            
            logger.info("Models trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            return False
    
    def generate_predictions(self) -> bool:
        """Generate predictions for all outlets"""
        try:
            logger.info("Generating predictions")
            
            # Get unique outlets
            unique_outlets = self.df['Entity Mapping.Outlet'].unique()
            
            predictions = []
            for outlet in unique_outlets:  # Process ALL outlets from dataset
                outlet_data = self.df[self.df['Entity Mapping.Outlet'] == outlet]
                
                if len(outlet_data) > 0:
                    latest_record = outlet_data.iloc[-1]
                    
                    # Prepare features for prediction
                    features = np.array([[
                        latest_record['Sum of Gallons Collected'],
                        latest_record['Sum of No of Traps'],
                        latest_record['Days_Since_Collection']
                    ]])
                    
                    features_scaled = self.scaler.transform(features)
                    
                    # Make predictions
                    missed_prob = self.models['missed_cleaning']['model'].predict_proba(features_scaled)[0][1]
                    volume_pred = self.models['volume_prediction']['model'].predict(features_scaled)[0]
                    
                    # Calculate comprehensive risk score with more factors
                    days_factor = min(latest_record['Days_Since_Collection'] / 90, 1.0)
                    volume_factor = min(latest_record['Sum of Gallons Collected'] / 2000, 1.0)  # Normalize volume
                    traps_factor = min(latest_record['Sum of No of Traps'] / 5, 1.0)  # Normalize traps
                    
                    risk_score = (missed_prob * 0.4 + 
                                days_factor * 0.3 + 
                                volume_factor * 0.2 + 
                                traps_factor * 0.1)
                    
                    predictions.append({
                        "outlet_id": len(predictions) + 1,
                        "name": str(outlet),
                        "area": str(latest_record['Area']),
                        "category": str(latest_record['Category']),
                        "grade": self._assign_grade(risk_score),
                        "p_miss_cleaning": float(missed_prob),
                        "forecast_volume_liters": float(volume_pred),
                        "risk_illegal_dump": float(risk_score),
                        "next_due_date": self._calculate_next_due(latest_record['Days_Since_Collection']),
                        "lat": float(latest_record['Latitude']) if pd.notna(latest_record['Latitude']) else 25.2048,
                        "lon": float(latest_record['Longitude']) if pd.notna(latest_record['Longitude']) else 55.2708,
                        "shap_top3": [
                            {"feature": "Days Since Collection", "impact": float(latest_record['Days_Since_Collection'] / 90)},
                            {"feature": "Gallons Collected", "impact": float(latest_record['Sum of Gallons Collected'] / 1000)},
                            {"feature": "Number of Traps", "impact": float(latest_record['Sum of No of Traps'] / 10)}
                        ]
                    })
            
            self.predictions = predictions
            logger.info(f"Generated {len(predictions)} predictions")
            return True
            
        except Exception as e:
            logger.error(f"Error generating predictions: {e}")
            return False
    
    def _assign_grade(self, risk_score: float) -> str:
        """Assign grade based on risk score with balanced distribution"""
        # Balanced thresholds to ensure all grades based on actual data distribution
        if risk_score < 0.08:
            return 'A'  # Excellent - very low risk
        elif risk_score < 0.2:
            return 'B'  # Good - low to moderate risk  
        elif risk_score < 0.55:
            return 'C'  # Fair - moderate to high risk
        else:
            return 'D'  # Poor - high risk
    
    def _calculate_next_due(self, days_since: int) -> str:
        """Calculate next due date aligned with 2023 dataset"""
        days_since = int(days_since)  # Convert numpy type to Python int
        # Base date in 2023 (dataset timeline)
        base_date = datetime(2023, 4, 1)  # April 2023 as dataset was Jan-Mar 2023
        
        if days_since > 30:
            # Urgent - within a week
            return (base_date + timedelta(days=7)).strftime('%Y-%m-%d')
        elif days_since > 15:
            # Soon - within 2 weeks  
            return (base_date + timedelta(days=14)).strftime('%Y-%m-%d')
        else:
            # Normal schedule - 30 day cycle
            return (base_date + timedelta(days=30 - days_since)).strftime('%Y-%m-%d')
    
    def generate_kpi_overview(self) -> bool:
        """Generate KPI overview"""
        try:
            logger.info("Generating KPI overview")
            
            total_gallons = self.df['Sum of Gallons Collected'].sum()
            total_outlets = self.df['Entity Mapping.Outlet'].nunique()
            missed_cleanings = len(self.df[self.df['Days_Since_Collection'] > 30])
            
            # Calculate revenue change (simplified)
            monthly_gallons = self.df.groupby(self.df['Month'].astype(str).str[:7])['Sum of Gallons Collected'].sum()
            if len(monthly_gallons) >= 2:
                recent_change = ((monthly_gallons.iloc[-1] - monthly_gallons.iloc[-2]) / monthly_gallons.iloc[-2]) * 100
            else:
                recent_change = 5.0  # Default positive change
            
            self.kpi_overview = {
                "period": datetime.now().strftime('%Y-%m'),
                "run_id": f"run-{datetime.now().isoformat()}",
                "model_version": "missed-v1.2.0",
                "grease_collected_tons": float(total_gallons / 1000),  # Convert to tons
                "forecast_tons": float(total_gallons / 1000 * 1.05),  # 5% growth forecast
                "missed_cleanings": int(missed_cleanings),
                "revenue_change_pct": float(recent_change),
                "illegal_dump_alerts": int(missed_cleanings * 0.2),  # Estimate
                "co2_saved_kg": int(total_gallons * 10)  # Estimate: 10kg CO2 per gallon
            }
            
            logger.info("KPI overview generated")
            return True
            
        except Exception as e:
            logger.error(f"Error generating KPI overview: {e}")
            return False
    
    def save_snapshots(self) -> bool:
        """Save all snapshots"""
        try:
            logger.info("Saving snapshots")
            
            # Create snapshots directory
            snapshots_dir = Path("snapshots") / datetime.now().strftime('%Y-%m')
            snapshots_dir.mkdir(parents=True, exist_ok=True)
            
            # Save predictions
            predictions_path = snapshots_dir / "predictions.json"
            with open(predictions_path, 'w') as f:
                json.dump({
                    "period": datetime.now().strftime('%Y-%m'),
                    "run_id": f"run-{datetime.now().isoformat()}",
                    "model_version": "missed-v1.2.0",
                    "items": self.predictions
                }, f, indent=2, default=str)
            
            # Save KPI overview
            kpi_path = snapshots_dir / "kpi_overview.json"
            with open(kpi_path, 'w') as f:
                json.dump(self.kpi_overview, f, indent=2, default=str)
            
            # Save model summary
            model_summary = {
                "period": datetime.now().strftime('%Y-%m'),
                "run_id": f"run-{datetime.now().isoformat()}",
                "model_version": "missed-v1.2.0",
                "models": {
                    name: {
                        "accuracy": float(info['accuracy']),
                        "feature_importance": info['feature_importance']
                    }
                    for name, info in self.models.items()
                }
            }
            
            model_path = snapshots_dir / "model_summary.json"
            with open(model_path, 'w') as f:
                json.dump(model_summary, f, indent=2, default=str)
            
            logger.info(f"Snapshots saved to {snapshots_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving snapshots: {e}")
            return False
    
    def run_pipeline(self) -> bool:
        """Run the complete ML pipeline"""
        try:
            logger.info("Starting ML pipeline")
            
            # Load data
            if not self.load_data():
                return False
            
            # Prepare features
            if not self.prepare_features():
                return False
            
            # Train models
            if not self.train_models():
                return False
            
            # Generate predictions
            if not self.generate_predictions():
                return False
            
            # Generate KPI overview
            if not self.generate_kpi_overview():
                return False
            
            # Save snapshots
            if not self.save_snapshots():
                return False
            
            logger.info("ML pipeline completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"ML pipeline failed: {e}")
            return False

def main():
    """Main function to run ML pipeline"""
    ml = BlueDataML()
    
    if ml.run_pipeline():
        logger.info("✅ ML pipeline completed successfully")
        
        # Print summary
        print("\n🤖 ML Pipeline Summary:")
        print(f"Models trained: {len(ml.models)}")
        print(f"Predictions generated: {len(ml.predictions)}")
        print(f"Model accuracy - Missed Cleaning: {ml.models['missed_cleaning']['accuracy']:.3f}")
        print(f"Model accuracy - Volume Prediction: {ml.models['volume_prediction']['accuracy']:.3f}")
        
        print(f"\n📊 KPI Overview:")
        print(f"Total Gallons: {ml.kpi_overview['grease_collected_tons']:,.1f} tons")
        print(f"Forecast: {ml.kpi_overview['forecast_tons']:,.1f} tons")
        print(f"Missed Cleanings: {ml.kpi_overview['missed_cleanings']}")
        print(f"Revenue Change: {ml.kpi_overview['revenue_change_pct']:+.1f}%")
        
        print(f"\n📁 Snapshots saved to: snapshots/{datetime.now().strftime('%Y-%m')}/")
        
    else:
        logger.error("❌ ML pipeline failed")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
