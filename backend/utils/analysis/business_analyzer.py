import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from pathlib import Path
import sys

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.settings import DATA_RESULTS, DATA_SETTINGS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BusinessAnalyzer:
    """Handles business intelligence and insights generation for the Blue Data Analytics project"""
    
    def __init__(self, df=None):
        self.df = df
        self.analysis_results = {}
        
    def set_data(self, df):
        """Set the dataframe for analysis"""
        self.df = df
        
    def analyze_revenue_trends(self):
        """Analyze revenue trends and patterns"""
        if self.df is None:
            return None
            
        try:
            logger.info("💰 Analyzing revenue trends...")
            
            # Monthly revenue trends
            monthly_revenue = self.df.groupby(self.df['Month'].dt.to_period('M'))['Sum of Gallons Collected'].sum()
            
            # Calculate growth rates
            growth_rates = []
            for i in range(1, len(monthly_revenue)):
                growth_rate = ((monthly_revenue.iloc[i] - monthly_revenue.iloc[i-1]) / monthly_revenue.iloc[i-1]) * 100
                growth_rates.append(growth_rate)
            
            # Identify trends
            avg_growth = np.mean(growth_rates) if growth_rates else 0
            trend_direction = "increasing" if avg_growth > 0 else "decreasing" if avg_growth < 0 else "stable"
            
            # Seasonal patterns
            seasonal_patterns = self.df.groupby(self.df['Month'].dt.month)['Sum of Gallons Collected'].mean()
            
            analysis = {
                "total_revenue": float(monthly_revenue.sum()),
                "monthly_revenue": {str(period): float(value) for period, value in monthly_revenue.items()},
                "avg_monthly_growth": float(avg_growth),
                "trend_direction": trend_direction,
                "seasonal_patterns": {int(month): float(value) for month, value in seasonal_patterns.items()},
                "peak_month": int(seasonal_patterns.idxmax()),
                "low_month": int(seasonal_patterns.idxmin())
            }
            
            self.analysis_results['revenue_trends'] = analysis
            logger.info("✅ Revenue trends analysis completed")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze revenue trends: {e}")
            return None
    
    def analyze_operational_efficiency(self):
        """Analyze operational efficiency metrics"""
        if self.df is None:
            return None
            
        try:
            logger.info("⚡ Analyzing operational efficiency...")
            
            # Service frequency analysis
            outlet_service_freq = self.df.groupby('Entity Mapping.Outlet').size()
            avg_services_per_outlet = outlet_service_freq.mean()
            
            # Trap efficiency analysis
            trap_efficiency = self.df.groupby('Entity Mapping.Outlet').agg({
                'Sum of Gallons Collected': 'sum',
                'Sum of No of Traps': 'sum'
            })
            trap_efficiency['Gallons_per_Trap'] = trap_efficiency['Sum of Gallons Collected'] / trap_efficiency['Sum of No of Traps']
            
            # Service lead time analysis
            if 'Service Lead Time' in self.df.columns:
                service_lead_times = pd.to_numeric(self.df['Service Lead Time'], errors='coerce')
                avg_lead_time = service_lead_times.mean()
            else:
                avg_lead_time = np.nan
            
            # Risk assessment
            high_risk_outlets = self.df[self.df['Days_Since_Collection'] > DATA_SETTINGS['high_risk_threshold_days']]
            risk_percentage = (len(high_risk_outlets) / len(self.df)) * 100
            
            analysis = {
                "total_outlets": int(self.df['Entity Mapping.Outlet'].nunique()),
                "avg_services_per_outlet": float(avg_services_per_outlet),
                "avg_gallons_per_trap": float(trap_efficiency['Gallons_per_Trap'].mean()),
                "avg_service_lead_time": float(avg_lead_time) if not np.isnan(avg_lead_time) else None,
                "high_risk_outlets": int(len(high_risk_outlets)),
                "risk_percentage": float(risk_percentage),
                "efficiency_score": float(100 - risk_percentage)  # Higher is better
            }
            
            self.analysis_results['operational_efficiency'] = analysis
            logger.info("✅ Operational efficiency analysis completed")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze operational efficiency: {e}")
            return None
    
    def analyze_geographic_performance(self):
        """Analyze performance by geographic areas"""
        if self.df is None:
            return None
            
        try:
            logger.info("🗺️ Analyzing geographic performance...")
            
            # Area performance
            area_performance = self.df.groupby('Area').agg({
                'Sum of Gallons Collected': 'sum',
                'Entity Mapping.Outlet': 'nunique',
                'Days_Since_Collection': 'mean'
            }).round(2)
            
            # Zone performance
            zone_performance = self.df.groupby('Zone').agg({
                'Sum of Gallons Collected': 'sum',
                'Entity Mapping.Outlet': 'nunique',
                'Days_Since_Collection': 'mean'
            }).round(2)
            
            # Identify high-performing and low-performing areas
            area_performance['Performance_Score'] = (
                (area_performance['Sum of Gallons Collected'] / area_performance['Sum of Gallons Collected'].max()) * 0.6 +
                (1 - area_performance['Days_Since_Collection'] / area_performance['Days_Since_Collection'].max()) * 0.4
            )
            
            top_areas = area_performance.nlargest(3, 'Performance_Score')
            bottom_areas = area_performance.nsmallest(3, 'Performance_Score')
            
            analysis = {
                "area_performance": {
                    area: {
                        "total_gallons": float(gallons),
                        "outlet_count": int(outlets),
                        "avg_days_since": float(days),
                        "performance_score": float(score)
                    }
                    for area, (gallons, outlets, days, score) in area_performance.iterrows()
                },
                "zone_performance": {
                    zone: {
                        "total_gallons": float(gallons),
                        "outlet_count": int(outlets),
                        "avg_days_since": float(days)
                    }
                    for zone, (gallons, outlets, days) in zone_performance.iterrows()
                },
                "top_performing_areas": list(top_areas.index),
                "bottom_performing_areas": list(bottom_areas.index),
                "geographic_insights": {
                    "most_active_area": area_performance['Sum of Gallons Collected'].idxmax(),
                    "most_efficient_area": area_performance['Days_Since_Collection'].idxmin(),
                    "area_with_most_outlets": area_performance['Entity Mapping.Outlet'].idxmax()
                }
            }
            
            self.analysis_results['geographic_performance'] = analysis
            logger.info("✅ Geographic performance analysis completed")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze geographic performance: {e}")
            return None
    
    def analyze_outlet_categories(self):
        """Analyze performance by outlet categories"""
        if self.df is None:
            return None
            
        try:
            logger.info("🏪 Analyzing outlet categories...")
            
            # Category performance
            category_performance = self.df.groupby('Category').agg({
                'Sum of Gallons Collected': 'sum',
                'Entity Mapping.Outlet': 'nunique',
                'Days_Since_Collection': 'mean'
            }).round(2)
            
            # Calculate category efficiency
            category_performance['Efficiency_Score'] = (
                (category_performance['Sum of Gallons Collected'] / category_performance['Sum of Gallons Collected'].max()) * 0.7 +
                (1 - category_performance['Days_Since_Collection'] / category_performance['Days_Since_Collection'].max()) * 0.3
            )
            
            # Identify best and worst performing categories
            best_category = category_performance['Efficiency_Score'].idxmax()
            worst_category = category_performance['Efficiency_Score'].idxmin()
            
            analysis = {
                "category_performance": {
                    category: {
                        "total_gallons": float(gallons),
                        "outlet_count": int(outlets),
                        "avg_days_since": float(days),
                        "efficiency_score": float(score)
                    }
                    for category, (gallons, outlets, days, score) in category_performance.iterrows()
                },
                "best_performing_category": best_category,
                "worst_performing_category": worst_category,
                "category_insights": {
                    "most_volatile_category": category_performance['Days_Since_Collection'].idxmax(),
                    "most_consistent_category": category_performance['Days_Since_Collection'].idxmin(),
                    "highest_volume_category": category_performance['Sum of Gallons Collected'].idxmax()
                }
            }
            
            self.analysis_results['outlet_categories'] = analysis
            logger.info("✅ Outlet categories analysis completed")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze outlet categories: {e}")
            return None
    
    def generate_business_insights(self):
        """Generate comprehensive business insights"""
        if self.df is None:
            return None
            
        try:
            logger.info("💡 Generating comprehensive business insights...")
            
            # Run all analyses
            revenue_analysis = self.analyze_revenue_trends()
            efficiency_analysis = self.analyze_operational_efficiency()
            geographic_analysis = self.analyze_geographic_performance()
            category_analysis = self.analyze_outlet_categories()
            
            # Generate actionable insights
            insights = {
                "key_metrics": {
                    "total_revenue": revenue_analysis['total_revenue'] if revenue_analysis else 0,
                    "total_outlets": efficiency_analysis['total_outlets'] if efficiency_analysis else 0,
                    "efficiency_score": efficiency_analysis['efficiency_score'] if efficiency_analysis else 0,
                    "risk_percentage": efficiency_analysis['risk_percentage'] if efficiency_analysis else 0
                },
                "trends": {
                    "revenue_trend": revenue_analysis['trend_direction'] if revenue_analysis else "unknown",
                    "avg_growth": revenue_analysis['avg_monthly_growth'] if revenue_analysis else 0
                },
                "recommendations": self._generate_recommendations(),
                "risk_alerts": self._generate_risk_alerts(),
                "opportunities": self._identify_opportunities()
            }
            
            self.analysis_results['business_insights'] = insights
            
            # Save results
            self._save_analysis_results()
            
            logger.info("✅ Business insights generation completed")
            return insights
            
        except Exception as e:
            logger.error(f"❌ Failed to generate business insights: {e}")
            return None
    
    def _generate_recommendations(self):
        """Generate actionable recommendations"""
        recommendations = []
        
        if 'operational_efficiency' in self.analysis_results:
            eff = self.analysis_results['operational_efficiency']
            if eff['risk_percentage'] > 20:
                recommendations.append("Increase service frequency for high-risk outlets")
            if eff['efficiency_score'] < 70:
                recommendations.append("Implement preventive maintenance programs")
        
        if 'revenue_trends' in self.analysis_results:
            rev = self.analysis_results['revenue_trends']
            if rev['trend_direction'] == 'decreasing':
                recommendations.append("Review pricing strategy and service offerings")
        
        if 'geographic_performance' in self.analysis_results:
            geo = self.analysis_results['geographic_performance']
            if len(geo['bottom_performing_areas']) > 0:
                recommendations.append(f"Focus resources on improving performance in {', '.join(geo['bottom_performing_areas'])}")
        
        return recommendations
    
    def _generate_risk_alerts(self):
        """Generate risk alerts"""
        alerts = []
        
        if 'operational_efficiency' in self.analysis_results:
            eff = self.analysis_results['operational_efficiency']
            if eff['risk_percentage'] > 30:
                alerts.append(f"High risk alert: {eff['risk_percentage']:.1f}% of outlets need immediate attention")
        
        return alerts
    
    def _identify_opportunities(self):
        """Identify business opportunities"""
        opportunities = []
        
        if 'outlet_categories' in self.analysis_results:
            cat = self.analysis_results['outlet_categories']
            best_cat = cat['best_performing_category']
            opportunities.append(f"Expand services in {best_cat} category - highest efficiency")
        
        if 'geographic_performance' in self.analysis_results:
            geo = self.analysis_results['geographic_performance']
            most_active = geo['geographic_insights']['most_active_area']
            opportunities.append(f"Focus expansion in {most_active} - highest activity area")
        
        return opportunities
    
    def _save_analysis_results(self):
        """Save analysis results to file"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            results_file = DATA_RESULTS / f"business_analysis_{timestamp}.json"
            
            import json
            with open(results_file, 'w') as f:
                json.dump(self.analysis_results, f, indent=2, default=str)
            
            logger.info(f"✅ Analysis results saved to {results_file}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save analysis results: {e}")
    
    def get_analysis_summary(self):
        """Get summary of all analyses"""
        return {
            "analyses_completed": list(self.analysis_results.keys()),
            "total_insights": len(self.analysis_results),
            "last_updated": datetime.now().isoformat()
        }
