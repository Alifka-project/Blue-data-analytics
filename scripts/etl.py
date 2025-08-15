#!/usr/bin/env python3
"""
ETL Pipeline for Blue Data Analytics Dashboard
Processes Blue-data2.xlsx and prepares data for ML training
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BlueDataETL:
    def __init__(self, data_path: str = "data/raw/Blue-data2.xlsx"):
        self.data_path = Path(data_path)
        self.df = None
        self.processed_df = None
        
    def load_data(self) -> bool:
        """Load data from Excel file"""
        try:
            logger.info(f"Loading data from {self.data_path}")
            
            if not self.data_path.exists():
                logger.error(f"Data file not found: {self.data_path}")
                return False
            
            # Read Excel file
            self.df = pd.read_excel(self.data_path)
            logger.info(f"Loaded {len(self.df)} records with {len(self.df.columns)} columns")
            
            # Log column names for debugging
            logger.info(f"Columns: {list(self.df.columns)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return False
    
    def validate_schema(self) -> bool:
        """Validate data schema and check for required columns"""
        try:
            required_columns = [
                'Entity Mapping.Outlet',
                'Sum of Gallons Collected',
                'Sum of No of Traps',
                'Area',
                'Category'
            ]
            
            missing_columns = [col for col in required_columns if col not in self.df.columns]
            if missing_columns:
                logger.error(f"Missing required columns: {missing_columns}")
                return False
            
            # Check for lat/lon columns
            has_coordinates = any(col.lower() in ['lat', 'lon', 'latitude', 'longitude'] 
                               for col in self.df.columns)
            
            if has_coordinates:
                logger.info("Found coordinate columns in dataset")
            else:
                logger.warning("No coordinate columns found - will generate synthetic coordinates")
            
            logger.info("Schema validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return False
    
    def clean_data(self) -> bool:
        """Clean and prepare data for analysis"""
        try:
            logger.info("Starting data cleaning process")
            
            # Create a copy for processing
            self.processed_df = self.df.copy()
            
            # Handle missing values
            self.processed_df = self.processed_df.fillna({
                'Sum of Gallons Collected': 0,
                'Sum of No of Traps': 1,
                'Area': 'Unknown',
                'Category': 'Unknown'
            })
            
            # Convert date columns if they exist
            date_columns = [col for col in self.processed_df.columns 
                          if 'date' in col.lower() or 'time' in col.lower()]
            
            for col in date_columns:
                try:
                    self.processed_df[col] = pd.to_datetime(self.processed_df[col], errors='coerce')
                except:
                    logger.warning(f"Could not convert {col} to datetime")
            
            # Generate synthetic coordinates if not present
            if not self._has_coordinates():
                self._generate_synthetic_coordinates()
            
            # Feature engineering
            self._engineer_features()
            
            logger.info("Data cleaning completed")
            return True
            
        except Exception as e:
            logger.error(f"Data cleaning failed: {e}")
            return False
    
    def _has_coordinates(self) -> bool:
        """Check if dataset has coordinate columns"""
        coord_columns = ['lat', 'lon', 'latitude', 'longitude']
        return any(col.lower() in coord_columns for col in self.processed_df.columns)
    
    def _generate_synthetic_coordinates(self):
        """Generate synthetic coordinates based on area for demo purposes"""
        logger.info("Generating synthetic coordinates based on area")
        
        # UAE approximate coordinates by area
        area_coordinates = {
            'Dubai Marina': (25.0920, 55.1381),
            'Downtown': (25.1972, 55.2744),
            'JBR': (25.0920, 55.1381),
            'Business Bay': (25.1867, 55.2708),
            'Al Quoz': (25.1500, 55.2500),
            'Jumeirah': (25.2285, 55.2867),
            'Deira': (25.2667, 55.3000),
            'Bur Dubai': (25.2639, 55.2972),
            'Unknown': (25.2048, 55.2708)  # Dubai center
        }
        
        # Generate coordinates with some randomness
        def get_coordinates(area):
            base_lat, base_lon = area_coordinates.get(area, area_coordinates['Unknown'])
            # Add small random offset (±0.01 degrees ≈ ±1km)
            lat_offset = np.random.uniform(-0.01, 0.01)
            lon_offset = np.random.uniform(-0.01, 0.01)
            return base_lat + lat_offset, base_lon + lon_offset
        
        # Apply to each row
        coordinates = [get_coordinates(area) for area in self.processed_df['Area']]
        self.processed_df['lat'] = [coord[0] for coord in coordinates]
        self.processed_df['lon'] = [coord[1] for coord in coordinates]
        
        logger.info("Synthetic coordinates generated")
    
    def _engineer_features(self):
        """Engineer features for ML models"""
        logger.info("Engineering features")
        
        # Calculate days since last collection (if date available)
        if 'Date' in self.processed_df.columns:
            try:
                self.processed_df['Date'] = pd.to_datetime(self.processed_df['Date'])
                today = pd.Timestamp.now()
                self.processed_df['Days_Since_Collection'] = (today - self.processed_df['Date']).dt.days
            except:
                self.processed_df['Days_Since_Collection'] = np.random.randint(1, 90, len(self.processed_df))
        else:
            # Generate synthetic days since collection
            self.processed_df['Days_Since_Collection'] = np.random.randint(1, 90, len(self.processed_df))
        
        # Calculate gallons per trap
        self.processed_df['Gallons_per_Trap'] = (
            self.processed_df['Sum of Gallons Collected'] / 
            self.processed_df['Sum of No of Traps']
        ).fillna(0)
        
        # Create month column for time series analysis
        if 'Date' in self.processed_df.columns:
            self.processed_df['Month'] = self.processed_df['Date'].dt.to_period('M')
        else:
            # Generate synthetic months
            months = pd.date_range('2020-01-01', '2024-01-01', freq='M')
            self.processed_df['Month'] = np.random.choice(months, len(self.processed_df)).astype(str)
        
        # Create risk score based on multiple factors
        self.processed_df['Risk_Score'] = self._calculate_risk_score()
        
        # Create grade based on risk score
        self.processed_df['Grade'] = self._assign_grade()
        
        logger.info("Feature engineering completed")
    
    def _calculate_risk_score(self) -> pd.Series:
        """Calculate risk score based on multiple factors"""
        # Normalize factors to 0-1 range
        gallons_norm = (self.processed_df['Sum of Gallons Collected'] - 
                       self.processed_df['Sum of Gallons Collected'].min()) / \
                      (self.processed_df['Sum of Gallons Collected'].max() - 
                       self.processed_df['Sum of Gallons Collected'].min())
        
        days_norm = (self.processed_df['Days_Since_Collection'] - 
                    self.processed_df['Days_Since_Collection'].min()) / \
                   (self.processed_df['Days_Since_Collection'].max() - 
                    self.processed_df['Days_Since_Collection'].min())
        
        # Weighted risk score
        risk_score = (0.4 * gallons_norm + 0.6 * days_norm)
        return risk_score.fillna(0.5)
    
    def _assign_grade(self) -> pd.Series:
        """Assign grade based on risk score"""
        def grade_assigner(score):
            if score < 0.25:
                return 'A'
            elif score < 0.5:
                return 'B'
            elif score < 0.75:
                return 'C'
            else:
                return 'D'
        
        return self.processed_df['Risk_Score'].apply(grade_assigner)
    
    def save_processed_data(self, output_path: str = "data/processed/processed_data.parquet") -> bool:
        """Save processed data"""
        try:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert mixed data types to string to avoid parquet conversion issues
            for col in self.processed_df.columns:
                if self.processed_df[col].dtype == 'object':
                    self.processed_df[col] = self.processed_df[col].astype(str)
            
            # Save as parquet for efficiency
            self.processed_df.to_parquet(output_path, index=False)
            logger.info(f"Processed data saved to {output_path}")
            
            # Also save as CSV for compatibility
            csv_path = output_path.with_suffix('.csv')
            self.processed_df.to_csv(csv_path, index=False)
            logger.info(f"Processed data also saved to {csv_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving processed data: {e}")
            return False
    
    def generate_summary_stats(self) -> Dict:
        """Generate summary statistics for the dataset"""
        try:
            summary = {
                "total_records": len(self.processed_df),
                "total_outlets": self.processed_df['Entity Mapping.Outlet'].nunique(),
                "total_gallons": float(self.processed_df['Sum of Gallons Collected'].sum()),
                "total_traps": int(self.processed_df['Sum of No of Traps'].sum()),
                "areas": self.processed_df['Area'].value_counts().to_dict(),
                "categories": self.processed_df['Category'].value_counts().to_dict(),
                "grades": self.processed_df['Grade'].value_counts().to_dict(),
                "date_range": {
                    "start": str(self.processed_df['Month'].min()),
                    "end": str(self.processed_df['Month'].max())
                },
                "coordinate_coverage": {
                    "has_coordinates": self._has_coordinates(),
                    "lat_range": [float(self.processed_df['Latitude'].min()), float(self.processed_df['Latitude'].max())],
                    "lon_range": [float(self.processed_df['Longitude'].min()), float(self.processed_df['Longitude'].max())]
                }
            }
            
            logger.info("Summary statistics generated")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary stats: {e}")
            return {}
    
    def run_pipeline(self) -> bool:
        """Run the complete ETL pipeline"""
        try:
            logger.info("Starting ETL pipeline")
            
            # Load data
            if not self.load_data():
                return False
            
            # Validate schema
            if not self.validate_schema():
                return False
            
            # Clean and process data
            if not self.clean_data():
                return False
            
            # Save processed data
            if not self.save_processed_data():
                return False
            
            # Generate summary
            summary = self.generate_summary_stats()
            
            # Save summary
            summary_path = Path("data/processed/summary_stats.json")
            summary_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2, default=str)
            
            logger.info("ETL pipeline completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"ETL pipeline failed: {e}")
            return False

def main():
    """Main function to run ETL pipeline"""
    etl = BlueDataETL()
    
    if etl.run_pipeline():
        logger.info("✅ ETL pipeline completed successfully")
        
        # Print summary
        summary = etl.generate_summary_stats()
        print("\n📊 Dataset Summary:")
        print(f"Total Records: {summary.get('total_records', 'N/A')}")
        print(f"Total Outlets: {summary.get('total_outlets', 'N/A')}")
        total_gallons = summary.get('total_gallons', 0)
        if isinstance(total_gallons, (int, float)) and total_gallons != 0:
            print(f"Total Gallons: {total_gallons:,.0f}")
        else:
            print(f"Total Gallons: N/A")
        print(f"Areas: {len(summary.get('areas', {}))}")
        print(f"Categories: {len(summary.get('categories', {}))}")
        
        if summary.get('coordinate_coverage', {}).get('has_coordinates'):
            print("✅ Coordinates found in dataset")
        else:
            print("⚠️  Synthetic coordinates generated for demo")
            
    else:
        logger.error("❌ ETL pipeline failed")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
