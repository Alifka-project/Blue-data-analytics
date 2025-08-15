#!/usr/bin/env python3
"""
Blue Data Analysis - Phase 1: Real Data Insights Only
Comprehensive Business Intelligence Analysis using ONLY real data from Blue_data.xlsx
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class BlueDataAnalyzer:
    def __init__(self, file_path):
        self.file_path = file_path
        self.df = None
        self.insights = {}

    def load_data(self):
        """Load and prepare real data from Blue_data.xlsx"""
        print("📊 Loading real data from Blue_data.xlsx...")
        self.df = pd.read_excel(self.file_path)
        
        print(f"✅ Dataset loaded: {self.df.shape[0]:,} records, {self.df.shape[1]} columns")
        print(f"📅 Date range: {self.df['Collected Date'].min()} to {self.df['Collected Date'].max()}")
        
        # Basic data cleaning
        self.df['Collected Date'] = pd.to_datetime(self.df['Collected Date'])
        self.df['Discharged Date'] = pd.to_datetime(self.df['Discharged Date'])
        
        # Calculate service duration
        self.df['Service Duration'] = (self.df['Discharged Date'] - self.df['Collected Date']).dt.days
        
        # Extract date components
        self.df['Year'] = self.df['Collected Date'].dt.year
        self.df['Month'] = self.df['Collected Date'].dt.month
        self.df['Day'] = self.df['Collected Date'].dt.day
        self.df['DayOfWeek'] = self.df['Collected Date'].dt.day_name()
        
        print("✅ Data preprocessing completed")
        return self.df

    def analyze_service_performance(self):
        """Analyze service performance using real data"""
        print("🔍 Analyzing service performance...")
        
        # Real service metrics
        total_services = len(self.df)
        avg_gallons = self.df['Sum of Gallons Collected'].mean()
        total_gallons = self.df['Sum of Gallons Collected'].sum()
        avg_traps = self.df['Sum of No of Traps'].mean()
        total_traps = self.df['Sum of No of Traps'].sum()
        
        # Service duration analysis
        avg_duration = self.df['Service Duration'].mean()
        service_efficiency = 1 / (1 + avg_duration)  # Efficiency metric
        
        # Top service providers
        top_providers = self.df['Service Provider'].value_counts().head(5)
        
        self.insights['service_performance'] = {
            'total_services': total_services,
            'avg_gallons_per_service': avg_gallons,
            'total_gallons_collected': total_gallons,
            'avg_traps_per_service': avg_traps,
            'total_traps_serviced': total_traps,
            'avg_service_duration_days': avg_duration,
            'service_efficiency_score': service_efficiency,
            'top_service_providers': top_providers.to_dict()
        }
        
        print(f"✅ Service Performance: {total_services:,} services, {total_gallons:,.0f} gallons collected")
        return self.insights['service_performance']

    def analyze_customer_behavior(self):
        """Analyze customer behavior using real data"""
        print("👥 Analyzing customer behavior...")
        
        # Real customer metrics
        unique_customers = self.df['Entity Mapping.Outlet'].nunique()
        total_services = len(self.df)
        services_per_customer = total_services / unique_customers
        
        # Customer value analysis
        customer_value = self.df.groupby('Entity Mapping.Outlet')['Sum of Gallons Collected'].sum()
        avg_customer_value = customer_value.mean()
        high_value_customers = len(customer_value[customer_value > customer_value.quantile(0.8)])
        
        # Customer retention (customers with multiple services)
        customer_service_count = self.df['Entity Mapping.Outlet'].value_counts()
        repeat_customers = len(customer_service_count[customer_service_count > 1])
        retention_rate = repeat_customers / unique_customers
        
        self.insights['customer_behavior'] = {
            'total_customers': unique_customers,
            'total_services': total_services,
            'avg_services_per_customer': services_per_customer,
            'avg_customer_value_gallons': avg_customer_value,
            'high_value_customers': high_value_customers,
            'customer_retention_rate': retention_rate,
            'repeat_customers': repeat_customers
        }
        
        print(f"✅ Customer Behavior: {unique_customers:,} customers, {retention_rate:.1%} retention rate")
        return self.insights['customer_behavior']

    def analyze_product_performance(self):
        """Analyze product/category performance using real data"""
        print("📦 Analyzing product performance...")
        
        # Real category analysis
        category_performance = self.df.groupby('Category').agg({
            'Sum of Gallons Collected': ['sum', 'mean', 'count'],
            'Sum of No of Traps': ['sum', 'mean'],
            'Entity Mapping.Outlet': 'nunique'
        }).round(2)
        
        category_performance.columns = ['Total_Gallons', 'Avg_Gallons', 'Service_Count', 'Total_Traps', 'Avg_Traps', 'Unique_Customers']
        category_performance = category_performance.sort_values('Total_Gallons', ascending=False)
        
        # Top performing categories
        top_category = category_performance.index[0]
        total_categories = len(category_performance)
        
        # Category diversity
        category_concentration = category_performance.iloc[0]['Total_Gallons'] / category_performance['Total_Gallons'].sum()
        
        self.insights['product_performance'] = {
            'total_categories': total_categories,
            'top_performing_category': top_category,
            'category_concentration': category_concentration,
            'category_breakdown': category_performance.to_dict('index')
        }
        
        print(f"✅ Product Performance: {total_categories} categories, top: {top_category}")
        return self.insights['product_performance']

    def analyze_geographic_analysis(self):
        """Analyze geographic performance using real data"""
        print("🌍 Analyzing geographic performance...")
        
        # Real geographic analysis
        area_performance = self.df.groupby('Area').agg({
            'Sum of Gallons Collected': ['sum', 'mean', 'count'],
            'Entity Mapping.Outlet': 'nunique',
            'Sum of No of Traps': 'sum'
        }).round(2)
        
        area_performance.columns = ['Total_Gallons', 'Avg_Gallons', 'Service_Count', 'Unique_Customers', 'Total_Traps']
        area_performance = area_performance.sort_values('Total_Gallons', ascending=False)
        
        # Top region
        top_region = area_performance.index[0]
        total_regions = len(area_performance)
        
        # Regional concentration
        regional_concentration = area_performance.iloc[0]['Total_Gallons'] / area_performance['Total_Gallons'].sum()
        
        # Market diversity
        market_diversity = area_performance['Unique_Customers'].sum()
        
        self.insights['geographic_analysis'] = {
            'total_regions': total_regions,
            'top_region': top_region,
            'regional_concentration': regional_concentration,
            'market_diversity': market_diversity,
            'area_breakdown': area_performance.to_dict('index')
        }
        
        print(f"✅ Geographic Analysis: {total_regions} regions, top: {top_region}")
        return self.insights['geographic_analysis']

    def analyze_temporal_analysis(self):
        """Analyze temporal patterns using real data"""
        print("📅 Analyzing temporal patterns...")
        
        # Real temporal analysis
        daily_pattern = self.df['DayOfWeek'].value_counts()
        peak_day = daily_pattern.index[0]
        
        monthly_pattern = self.df.groupby(['Year', 'Month'])['Sum of Gallons Collected'].sum()
        peak_month = monthly_pattern.idxmax()
        
        # Seasonality analysis
        monthly_avg = self.df.groupby('Month')['Sum of Gallons Collected'].mean()
        seasonality_score = monthly_avg.std() / monthly_avg.mean()
        
        # Service frequency by time
        avg_services_per_day = len(self.df) / self.df['Collected Date'].nunique()
        
        self.insights['temporal_analysis'] = {
            'peak_day': peak_day,
            'peak_month': f"{peak_month[0]}-{peak_month[1]:02d}",
            'seasonality_score': seasonality_score,
            'avg_services_per_day': avg_services_per_day,
            'daily_pattern': daily_pattern.to_dict(),
            'monthly_pattern': monthly_pattern.to_dict()
        }
        
        print(f"✅ Temporal Analysis: Peak day: {peak_day}, Peak month: {peak_month}")
        return self.insights['temporal_analysis']

    def analyze_operational_efficiency(self):
        """Analyze operational efficiency using real data"""
        print("⚡ Analyzing operational efficiency...")
        
        # Real efficiency metrics
        avg_service_duration = self.df['Service Duration'].mean()
        service_duration_efficiency = 1 / (1 + avg_service_duration)
        
        # Vehicle utilization
        vehicle_performance = self.df.groupby('Assigned Vehicle').agg({
            'Sum of Gallons Collected': 'sum',
            'Entity Mapping.Outlet': 'nunique',
            'Service Report': 'count'
        }).round(2)
        
        vehicle_performance.columns = ['Total_Gallons', 'Unique_Customers', 'Service_Count']
        vehicle_performance = vehicle_performance.sort_values('Total_Gallons', ascending=False)
        
        # Trap efficiency
        trap_efficiency = self.df['Sum of Gallons Collected'].sum() / self.df['Sum of No of Traps'].sum()
        
        # Service provider efficiency
        provider_efficiency = self.df.groupby('Service Provider')['Sum of Gallons Collected'].sum().mean()
        
        self.insights['operational_efficiency'] = {
            'avg_service_duration_days': avg_service_duration,
            'service_duration_efficiency': service_duration_efficiency,
            'trap_efficiency_gallons_per_trap': trap_efficiency,
            'provider_efficiency_avg_gallons': provider_efficiency,
            'vehicle_performance': vehicle_performance.to_dict('index')
        }
        
        print(f"✅ Operational Efficiency: {avg_service_duration:.1f} days avg service duration")
        return self.insights['operational_efficiency']

    def analyze_market_segmentation(self):
        """Analyze market segmentation using real data"""
        print("🎯 Analyzing market segmentation...")
        
        # Real segmentation analysis
        category_segments = self.df['Category'].value_counts()
        dominant_segment = category_segments.index[0]
        total_segments = len(category_segments)
        segment_concentration = category_segments.iloc[0] / category_segments.sum()
        
        # Sub-category analysis
        subcategory_segments = self.df['Sub Category'].value_counts().head(10)
        
        # Zone analysis
        zone_performance = self.df.groupby('Zone')['Sum of Gallons Collected'].sum().sort_values(ascending=False)
        
        self.insights['market_segmentation'] = {
            'total_segments': total_segments,
            'dominant_segment': dominant_segment,
            'segment_concentration': segment_concentration,
            'category_breakdown': category_segments.to_dict(),
            'top_subcategories': subcategory_segments.to_dict(),
            'zone_performance': zone_performance.to_dict()
        }
        
        print(f"✅ Market Segmentation: {total_segments} segments, dominant: {dominant_segment}")
        return self.insights['market_segmentation']

    def analyze_growth_opportunities(self):
        """Analyze growth opportunities using real data"""
        print("📈 Analyzing growth opportunities...")
        
        # Real growth analysis
        category_growth = self.df.groupby(['Category', 'Year'])['Sum of Gallons Collected'].sum().unstack(fill_value=0)
        
        # Calculate growth rates
        if len(category_growth.columns) > 1:
            growth_rates = ((category_growth.iloc[:, -1] - category_growth.iloc[:, 0]) / category_growth.iloc[:, 0] * 100).round(2)
            high_growth_segments = growth_rates[growth_rates > 0].index.tolist()
        else:
            high_growth_segments = category_growth.index.tolist()
        
        # Market expansion potential
        area_coverage = self.df['Area'].nunique()
        total_areas = len(self.df['Area'].unique())
        
        # Customer growth potential
        customer_growth_rate = self.df.groupby('Year')['Entity Mapping.Outlet'].nunique().pct_change().mean()
        
        # Revenue growth potential (based on gallons)
        revenue_growth_potential = self.df.groupby('Year')['Sum of Gallons Collected'].sum().pct_change().mean()
        
        self.insights['growth_opportunities'] = {
            'high_growth_segments': high_growth_segments,
            'market_expansion_potential': total_areas,
            'customer_growth_rate': customer_growth_rate if not pd.isna(customer_growth_rate) else 0,
            'revenue_growth_potential': revenue_growth_potential if not pd.isna(revenue_growth_potential) else 0,
            'category_growth_analysis': category_growth.to_dict()
        }
        
        print(f"✅ Growth Opportunities: {len(high_growth_segments)} high-growth segments identified")
        return self.insights['growth_opportunities']

    def generate_comprehensive_insights(self):
        """Generate all comprehensive insights from real data"""
        print("🚀 Generating comprehensive insights from real data...")
        
        self.analyze_service_performance()
        self.analyze_customer_behavior()
        self.analyze_product_performance()
        self.analyze_geographic_analysis()
        self.analyze_temporal_analysis()
        self.analyze_operational_efficiency()
        self.analyze_market_segmentation()
        self.analyze_growth_opportunities()
        
        print("✅ All insights generated from real data!")
        return self.insights

    def generate_summary_report(self):
        """Generate a comprehensive summary report"""
        print("\n" + "="*80)
        print("📊 BLUE DATA ANALYTICS - REAL DATA INSIGHTS SUMMARY")
        print("="*80)
        
        print(f"\n📈 SERVICE PERFORMANCE:")
        print(f"   • Total Services: {self.insights['service_performance']['total_services']:,}")
        print(f"   • Total Gallons Collected: {self.insights['service_performance']['total_gallons_collected']:,.0f}")
        print(f"   • Average Service Duration: {self.insights['service_performance']['avg_service_duration_days']:.1f} days")
        
        print(f"\n👥 CUSTOMER INSIGHTS:")
        print(f"   • Total Customers: {self.insights['customer_behavior']['total_customers']:,}")
        print(f"   • Customer Retention Rate: {self.insights['customer_behavior']['customer_retention_rate']:.1%}")
        print(f"   • Average Customer Value: {self.insights['customer_behavior']['avg_customer_value_gallons']:,.0f} gallons")
        
        print(f"\n📦 PRODUCT PERFORMANCE:")
        print(f"   • Top Category: {self.insights['product_performance']['top_performing_category']}")
        print(f"   • Total Categories: {self.insights['product_performance']['total_categories']}")
        print(f"   • Category Concentration: {self.insights['product_performance']['category_concentration']:.1%}")
        
        print(f"\n🌍 GEOGRAPHIC ANALYSIS:")
        print(f"   • Top Region: {self.insights['geographic_analysis']['top_region']}")
        print(f"   • Total Regions: {self.insights['geographic_analysis']['total_regions']}")
        print(f"   • Market Diversity: {self.insights['geographic_analysis']['market_diversity']:,} customers")
        
        print(f"\n📅 TEMPORAL PATTERNS:")
        print(f"   • Peak Day: {self.insights['temporal_analysis']['peak_day']}")
        print(f"   • Peak Month: {self.insights['temporal_analysis']['peak_month']}")
        print(f"   • Average Services per Day: {self.insights['temporal_analysis']['avg_services_per_day']:.1f}")
        
        print(f"\n⚡ OPERATIONAL EFFICIENCY:")
        print(f"   • Service Duration Efficiency: {self.insights['operational_efficiency']['service_duration_efficiency']:.3f}")
        print(f"   • Trap Efficiency: {self.insights['operational_efficiency']['trap_efficiency_gallons_per_trap']:.1f} gallons/trap")
        
        print(f"\n🎯 MARKET SEGMENTATION:")
        print(f"   • Dominant Segment: {self.insights['market_segmentation']['dominant_segment']}")
        print(f"   • Total Segments: {self.insights['market_segmentation']['total_segments']}")
        print(f"   • Segment Concentration: {self.insights['market_segmentation']['segment_concentration']:.1%}")
        
        print(f"\n📈 GROWTH OPPORTUNITIES:")
        print(f"   • High-Growth Segments: {len(self.insights['growth_opportunities']['high_growth_segments'])}")
        print(f"   • Market Expansion Potential: {self.insights['growth_opportunities']['market_expansion_potential']} areas")
        
        print("\n" + "="*80)
        print("✅ ALL INSIGHTS GENERATED FROM REAL BLUE_DATA.XLSX DATASET")
        print("="*80)
        
        return self.insights

def main():
    """Main execution function"""
    print("🚀 Starting Blue Data Analytics - Real Data Analysis")
    print("="*60)
    
    analyzer = BlueDataAnalyzer('Blue_data.xlsx')
    df = analyzer.load_data()
    insights = analyzer.generate_comprehensive_insights()
    summary = analyzer.generate_summary_report()
    
        # Save insights to JSON
    import json
    
    # Convert tuple keys to strings for JSON serialization
    def convert_tuples_to_strings(obj):
        if isinstance(obj, dict):
            return {str(k) if isinstance(k, tuple) else k: convert_tuples_to_strings(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_tuples_to_strings(item) for item in obj]
        else:
            return obj
    
    insights_serializable = convert_tuples_to_strings(insights)
    
    with open('analysis_insights.json', 'w') as f:
        json.dump(insights_serializable, f, indent=2, default=str)
    
    print(f"\n💾 Insights saved to 'analysis_insights.json'")
    print("🎉 Real data analysis completed successfully!")

if __name__ == "__main__":
    main()
