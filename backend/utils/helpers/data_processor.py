import pandas as pd
import numpy as np
from datetime import datetime
import logging
from pathlib import Path
import sys

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.settings import EXCEL_FILE, DATA_PROCESSED, DATA_SETTINGS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataProcessor:
    """Handles data loading, cleaning, and processing for the Blue Data Analytics project"""
    
    def __init__(self):
        self.df = None
        self.processed_data_path = DATA_PROCESSED / "processed_data.pkl"
        
    def load_data(self, file_path=None):
        """Load data from Excel file"""
        if file_path is None:
            file_path = EXCEL_FILE
            
        try:
            logger.info(f"📊 Loading data from {file_path}")
            self.df = pd.read_excel(file_path)
            logger.info(f"✅ Loaded {len(self.df)} records with {len(self.df.columns)} columns")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to load data: {e}")
            return False
    
    def clean_data(self):
        """Clean and prepare the data"""
        if self.df is None:
            logger.error("❌ No data loaded. Call load_data() first.")
            return False
            
        try:
            logger.info("🧹 Cleaning and preparing data...")
            
            # Convert date columns
            self.df['Collected Date'] = pd.to_datetime(self.df['Collected Date'], errors='coerce')
            self.df['Month'] = pd.to_datetime(self.df['Month'], errors='coerce')
            
            # Fill missing values
            self.df['Area'].fillna('Unknown', inplace=True)
            self.df['Zone'].fillna('Unknown', inplace=True)
            self.df['Category'].fillna('Unknown', inplace=True)
            
            # Convert numeric columns
            self.df['Sum of Gallons Collected'] = pd.to_numeric(self.df['Sum of Gallons Collected'], errors='coerce')
            self.df['Sum of No of Traps'] = pd.to_numeric(self.df['Sum of No of Traps'], errors='coerce')
            
            # Calculate derived metrics
            self.df['Days_Since_Collection'] = (datetime.now() - self.df['Collected Date']).dt.days
            self.df['Gallons_per_Trap'] = self.df['Sum of Gallons Collected'] / self.df['Sum of No of Traps']
            
            # Handle infinite values
            self.df['Gallons_per_Trap'].replace([np.inf, -np.inf], np.nan, inplace=True)
            
            logger.info("✅ Data cleaning completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to clean data: {e}")
            return False
    
    def save_processed_data(self):
        """Save processed data to pickle file"""
        if self.df is None:
            logger.error("❌ No data to save")
            return False
            
        try:
            self.df.to_pickle(self.processed_data_path)
            logger.info(f"✅ Processed data saved to {self.processed_data_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save processed data: {e}")
            return False
    
    def load_processed_data(self):
        """Load previously processed data"""
        if self.processed_data_path.exists():
            try:
                self.df = pd.read_pickle(self.processed_data_path)
                logger.info(f"✅ Loaded processed data from {self.processed_data_path}")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to load processed data: {e}")
                return False
        return False
    
    def get_data_summary(self):
        """Get summary statistics of the data"""
        if self.df is None:
            return None
            
        return {
            "total_records": len(self.df),
            "total_columns": len(self.df.columns),
            "total_outlets": self.df['Entity Mapping.Outlet'].nunique(),
            "total_gallons": self.df['Sum of Gallons Collected'].sum(),
            "date_range": {
                "earliest": self.df['Collected Date'].min().strftime('%Y-%m-%d'),
                "latest": self.df['Collected Date'].max().strftime('%Y-%m-%d')
            },
            "missing_values": self.df.isnull().sum().to_dict()
        }
    
    def get_high_risk_outlets(self, threshold_days=None):
        """Get outlets that haven't been serviced recently"""
        if threshold_days is None:
            threshold_days = DATA_SETTINGS['high_risk_threshold_days']
            
        if self.df is None:
            return pd.DataFrame()
            
        high_risk = self.df[self.df['Days_Since_Collection'] > threshold_days]
        return high_risk.groupby('Entity Mapping.Outlet').agg({
            'Days_Since_Collection': 'max',
            'Sum of Gallons Collected': 'sum',
            'Area': 'first',
            'Zone': 'first'
        }).sort_values('Days_Since_Collection', ascending=False)
    
    def get_monthly_trends(self):
        """Get monthly trends for gallons and services"""
        if self.df is None:
            return {}, {}
            
        monthly_gallons = self.df.groupby(self.df['Month'].dt.to_period('M'))['Sum of Gallons Collected'].sum()
        monthly_services = self.df.groupby(self.df['Month'].dt.to_period('M')).size()
        
        return monthly_gallons, monthly_services
    
    def get_location_breakdown(self):
        """Get breakdown by location/area"""
        if self.df is None:
            return {}
            
        return self.df.groupby('Area').agg({
            'Sum of Gallons Collected': 'sum',
            'Entity Mapping.Outlet': 'nunique'
        }).round(2)
    
    def get_category_breakdown(self):
        """Get breakdown by outlet category"""
        if self.df is None:
            return {}
            
        return self.df.groupby('Category').agg({
            'Sum of Gallons Collected': 'sum',
            'Entity Mapping.Outlet': 'nunique'
        }).round(2)
