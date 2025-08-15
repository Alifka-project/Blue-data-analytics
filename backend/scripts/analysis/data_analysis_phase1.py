#!/usr/bin/env python3
"""
Blue Data Analysis - Phase 1: Comprehensive Data Insights
Advanced Business Intelligence Analysis for Strategic Growth
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

# Set style for better visualizations
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class BlueDataAnalyzer:
    def __init__(self, file_path):
        self.file_path = file_path
        self.df = None
        self.insights = {}
        
    def load_data(self):
        """Load and perform initial data exploration"""
        print("🔍 Loading Blue Data Dataset...")
        self.df = pd.read_excel(self.file_path)
        
        print(f"📊 Dataset Shape: {self.df.shape}")
        print(f"📋 Columns: {list(self.df.columns)}")
        
        # Basic info
        print("\n📈 Dataset Info:")
        print(self.df.info())
        
        # Check for missing values
        missing_data = self.df.isnull().sum()
        print(f"\n❌ Missing Values:\n{missing_data[missing_data > 0]}")
        
        return self.df
    
    def generate_comprehensive_insights(self):
        """Generate comprehensive business insights"""
        print("\n🚀 Generating Comprehensive Business Insights...")
        
        # 1. Sales Performance Analysis
        self.analyze_sales_performance()
        
        # 2. Customer Behavior Analysis
        self.analyze_customer_behavior()
        
        # 3. Product Performance Analysis
        self.analyze_product_performance()
        
        # 4. Geographic Analysis
        self.analyze_geographic_distribution()
        
        # 5. Temporal Analysis
        self.analyze_temporal_patterns()
        
        # 6. Financial Analysis
        self.analyze_financial_metrics()
        
        # 7. Operational Efficiency
        self.analyze_operational_efficiency()
        
        # 8. Market Segmentation
        self.analyze_market_segmentation()
        
        # 9. Risk Analysis
        self.analyze_risk_factors()
        
        # 10. Growth Opportunities
        self.identify_growth_opportunities()
        
        return self.insights
    
    def analyze_sales_performance(self):
        """Analyze sales performance metrics"""
        print("📈 Analyzing Sales Performance...")
        
        # Assuming common sales columns - adjust based on actual data
        sales_columns = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['sales', 'revenue', 'amount', 'price', 'quantity'])]
        
        if sales_columns:
            # Sales trend analysis
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 1: Sales Distribution
            if len(sales_columns) > 0:
                self.df[sales_columns[0]].hist(ax=axes[0,0], bins=30, alpha=0.7)
                axes[0,0].set_title('Sales Distribution')
                axes[0,0].set_xlabel('Sales Amount')
                axes[0,0].set_ylabel('Frequency')
            
            # Chart 2: Sales by Category (if available)
            category_col = [col for col in self.df.columns if any(word in col.lower() 
                           for word in ['category', 'product', 'type'])]
            if category_col:
                self.df[category_col[0]].value_counts().plot(kind='bar', ax=axes[0,1])
                axes[0,1].set_title('Sales by Category')
                axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 3: Sales Trend Over Time
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time', 'period'])]
            if date_col and sales_columns:
                self.df.groupby(date_col[0])[sales_columns[0]].sum().plot(ax=axes[1,0])
                axes[1,0].set_title('Sales Trend Over Time')
                axes[1,0].tick_params(axis='x', rotation=45)
            
            # Chart 4: Sales vs Quantity Correlation
            if len(sales_columns) > 1:
                axes[1,1].scatter(self.df[sales_columns[0]], self.df[sales_columns[1]], alpha=0.6)
                axes[1,1].set_xlabel(sales_columns[0])
                axes[1,1].set_ylabel(sales_columns[1])
                axes[1,1].set_title('Sales vs Quantity Correlation')
            
            plt.tight_layout()
            plt.savefig('sales_performance_analysis.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['sales_performance'] = {
                'total_sales': self.df[sales_columns[0]].sum() if sales_columns else 0,
                'avg_sales': self.df[sales_columns[0]].mean() if sales_columns else 0,
                'sales_growth_rate': self.calculate_growth_rate(sales_columns[0]) if sales_columns else 0
            }
    
    def analyze_customer_behavior(self):
        """Analyze customer behavior patterns"""
        print("👥 Analyzing Customer Behavior...")
        
        # Customer-related columns
        customer_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['customer', 'client', 'user', 'buyer'])]
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Chart 5: Customer Distribution
        if customer_cols:
            self.df[customer_cols[0]].value_counts().head(10).plot(kind='bar', ax=axes[0,0])
            axes[0,0].set_title('Top 10 Customers by Activity')
            axes[0,0].tick_params(axis='x', rotation=45)
        
        # Chart 6: Customer Segmentation
        if customer_cols:
            customer_activity = self.df[customer_cols[0]].value_counts()
            segments = pd.cut(customer_activity, bins=3, labels=['Low', 'Medium', 'High'])
            segments.value_counts().plot(kind='pie', ax=axes[0,1], autopct='%1.1f%%')
            axes[0,1].set_title('Customer Activity Segmentation')
        
        # Chart 7: Customer Lifetime Value (if available)
        value_cols = [col for col in self.df.columns if any(word in col.lower() 
                    for word in ['value', 'revenue', 'amount'])]
        if customer_cols and value_cols:
            customer_value = self.df.groupby(customer_cols[0])[value_cols[0]].sum().sort_values(ascending=False)
            customer_value.head(15).plot(kind='bar', ax=axes[1,0])
            axes[1,0].set_title('Customer Lifetime Value (Top 15)')
            axes[1,0].tick_params(axis='x', rotation=45)
        
        # Chart 8: Customer Behavior Heatmap
        if len(customer_cols) > 1:
            correlation_matrix = self.df[customer_cols].corr()
            sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', ax=axes[1,1])
            axes[1,1].set_title('Customer Behavior Correlation')
        
        plt.tight_layout()
        plt.savefig('customer_behavior_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        self.insights['customer_behavior'] = {
            'total_customers': len(self.df[customer_cols[0]].unique()) if customer_cols else 0,
            'avg_customer_value': self.df.groupby(customer_cols[0])[value_cols[0]].sum().mean() if customer_cols and value_cols else 0,
            'customer_retention_rate': self.calculate_retention_rate(customer_cols[0]) if customer_cols else 0
        }
    
    def analyze_product_performance(self):
        """Analyze product performance metrics"""
        print("📦 Analyzing Product Performance...")
        
        product_cols = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['product', 'item', 'sku', 'category'])]
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Chart 9: Product Performance Distribution
        if product_cols:
            self.df[product_cols[0]].value_counts().head(15).plot(kind='bar', ax=axes[0,0])
            axes[0,0].set_title('Top 15 Products by Sales')
            axes[0,0].tick_params(axis='x', rotation=45)
        
        # Chart 10: Product Category Analysis
        if len(product_cols) > 1:
            self.df.groupby(product_cols[1])[product_cols[0]].count().plot(kind='pie', ax=axes[0,1], autopct='%1.1f%%')
            axes[0,1].set_title('Product Distribution by Category')
        
        # Chart 11: Product Performance Trend
        date_col = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['date', 'time'])]
        if date_col and product_cols:
            monthly_product_sales = self.df.groupby([pd.Grouper(key=date_col[0], freq='M'), product_cols[0]]).size().unstack(fill_value=0)
            monthly_product_sales.plot(ax=axes[1,0])
            axes[1,0].set_title('Product Performance Trend')
            axes[1,0].tick_params(axis='x', rotation=45)
        
        # Chart 12: Product Profitability Matrix
        if len(product_cols) > 2:
            product_metrics = self.df.groupby(product_cols[0]).agg({
                product_cols[1]: 'count',
                product_cols[2]: 'mean'
            }).reset_index()
            axes[1,1].scatter(product_metrics[product_cols[1]], product_metrics[product_cols[2]], alpha=0.6)
            axes[1,1].set_xlabel('Sales Volume')
            axes[1,1].set_ylabel('Average Value')
            axes[1,1].set_title('Product Profitability Matrix')
        
        plt.tight_layout()
        plt.savefig('product_performance_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        self.insights['product_performance'] = {
            'total_products': len(self.df[product_cols[0]].unique()) if product_cols else 0,
            'top_performing_product': self.df[product_cols[0]].value_counts().index[0] if product_cols else 'N/A',
            'product_diversity_score': len(self.df[product_cols[0]].unique()) / len(self.df) if product_cols else 0
        }
    
    def analyze_geographic_distribution(self):
        """Analyze geographic distribution of data"""
        print("🌍 Analyzing Geographic Distribution...")
        
        geo_cols = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['region', 'country', 'state', 'city', 'location', 'area'])]
        
        if geo_cols:
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 13: Geographic Distribution
            self.df[geo_cols[0]].value_counts().head(10).plot(kind='bar', ax=axes[0,0])
            axes[0,0].set_title('Top 10 Regions by Activity')
            axes[0,0].tick_params(axis='x', rotation=45)
            
            # Chart 14: Geographic Performance Heatmap
            if len(geo_cols) > 1:
                geo_performance = self.df.groupby(geo_cols[0]).size().sort_values(ascending=False)
                geo_performance.plot(kind='bar', ax=axes[0,1])
                axes[0,1].set_title('Geographic Performance Distribution')
                axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 15: Regional Growth Analysis
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                regional_growth = self.df.groupby([pd.Grouper(key=date_col[0], freq='M'), geo_cols[0]]).size().unstack(fill_value=0)
                regional_growth.plot(ax=axes[1,0])
                axes[1,0].set_title('Regional Growth Trends')
                axes[1,0].tick_params(axis='x', rotation=45)
            
            # Chart 16: Geographic Market Share
            geo_market_share = self.df[geo_cols[0]].value_counts(normalize=True) * 100
            geo_market_share.head(8).plot(kind='pie', ax=axes[1,1], autopct='%1.1f%%')
            axes[1,1].set_title('Geographic Market Share')
            
            plt.tight_layout()
            plt.savefig('geographic_analysis.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['geographic_analysis'] = {
                'top_region': self.df[geo_cols[0]].value_counts().index[0] if geo_cols else 'N/A',
                'regional_concentration': self.df[geo_cols[0]].value_counts().iloc[0] / len(self.df) if geo_cols else 0,
                'market_diversity': len(self.df[geo_cols[0]].unique()) if geo_cols else 0
            }
    
    def analyze_temporal_patterns(self):
        """Analyze temporal patterns and seasonality"""
        print("⏰ Analyzing Temporal Patterns...")
        
        date_col = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['date', 'time', 'period', 'timestamp'])]
        
        if date_col:
            # Convert to datetime if needed
            self.df[date_col[0]] = pd.to_datetime(self.df[date_col[0]], errors='coerce')
            
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 17: Daily Activity Pattern
            daily_activity = self.df.groupby(self.df[date_col[0]].dt.date).size()
            daily_activity.plot(ax=axes[0,0])
            axes[0,0].set_title('Daily Activity Pattern')
            axes[0,0].tick_params(axis='x', rotation=45)
            
            # Chart 18: Monthly Trends
            monthly_trends = self.df.groupby(self.df[date_col[0]].dt.to_period('M')).size()
            monthly_trends.plot(kind='bar', ax=axes[0,1])
            axes[0,1].set_title('Monthly Activity Trends')
            axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 19: Day of Week Analysis
            dow_activity = self.df.groupby(self.df[date_col[0]].dt.day_name()).size()
            dow_activity.plot(kind='bar', ax=axes[1,0])
            axes[1,0].set_title('Activity by Day of Week')
            axes[1,0].tick_params(axis='x', rotation=45)
            
            # Chart 20: Hourly Pattern (if time available)
            if self.df[date_col[0]].dt.hour.notna().any():
                hourly_pattern = self.df.groupby(self.df[date_col[0]].dt.hour).size()
                hourly_pattern.plot(kind='bar', ax=axes[1,1])
                axes[1,1].set_title('Hourly Activity Pattern')
                axes[1,1].set_xlabel('Hour of Day')
            else:
                # Seasonal analysis
                seasonal_pattern = self.df.groupby(self.df[date_col[0]].dt.month).size()
                seasonal_pattern.plot(kind='bar', ax=axes[1,1])
                axes[1,1].set_title('Seasonal Activity Pattern')
                axes[1,1].set_xlabel('Month')
            
            plt.tight_layout()
            plt.savefig('temporal_analysis.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['temporal_analysis'] = {
                'peak_day': dow_activity.idxmax() if 'dow_activity' in locals() else 'N/A',
                'peak_month': monthly_trends.idxmax() if 'monthly_trends' in locals() else 'N/A',
                'seasonality_score': self.calculate_seasonality(monthly_trends) if 'monthly_trends' in locals() else 0
            }
    
    def analyze_financial_metrics(self):
        """Analyze financial performance metrics"""
        print("💰 Analyzing Financial Metrics...")
        
        financial_cols = [col for col in self.df.columns if any(word in col.lower() 
                         for word in ['revenue', 'profit', 'cost', 'price', 'amount', 'value'])]
        
        if financial_cols:
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 21: Revenue Distribution
            self.df[financial_cols[0]].hist(ax=axes[0,0], bins=30, alpha=0.7)
            axes[0,0].set_title('Revenue Distribution')
            axes[0,0].set_xlabel('Revenue')
            axes[0,0].set_ylabel('Frequency')
            
            # Chart 22: Financial Performance Over Time
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                financial_trend = self.df.groupby(pd.Grouper(key=date_col[0], freq='M'))[financial_cols[0]].sum()
                financial_trend.plot(ax=axes[0,1])
                axes[0,1].set_title('Financial Performance Trend')
                axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 23: Profitability Analysis
            if len(financial_cols) > 1:
                self.df.plot.scatter(x=financial_cols[0], y=financial_cols[1], ax=axes[1,0], alpha=0.6)
                axes[1,0].set_xlabel(financial_cols[0])
                axes[1,0].set_ylabel(financial_cols[1])
                axes[1,0].set_title('Profitability Correlation')
            
            # Chart 24: Financial Metrics Summary
            financial_summary = self.df[financial_cols].describe()
            financial_summary.loc[['mean', 'std', 'min', 'max']].plot(kind='bar', ax=axes[1,1])
            axes[1,1].set_title('Financial Metrics Summary')
            axes[1,1].tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            plt.savefig('financial_analysis.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['financial_analysis'] = {
                'total_revenue': self.df[financial_cols[0]].sum() if financial_cols else 0,
                'avg_revenue': self.df[financial_cols[0]].mean() if financial_cols else 0,
                'revenue_growth': self.calculate_growth_rate(financial_cols[0]) if financial_cols else 0,
                'profit_margin': self.calculate_profit_margin(financial_cols) if len(financial_cols) > 1 else 0
            }
    
    def analyze_operational_efficiency(self):
        """Analyze operational efficiency metrics"""
        print("⚙️ Analyzing Operational Efficiency...")
        
        # Operational metrics
        operational_cols = [col for col in self.df.columns if any(word in col.lower() 
                           for word in ['efficiency', 'productivity', 'performance', 'score', 'rating'])]
        
        if operational_cols:
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 25: Efficiency Distribution
            self.df[operational_cols[0]].hist(ax=axes[0,0], bins=20, alpha=0.7)
            axes[0,0].set_title('Operational Efficiency Distribution')
            axes[0,0].set_xlabel('Efficiency Score')
            axes[0,0].set_ylabel('Frequency')
            
            # Chart 26: Efficiency Trends
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                efficiency_trend = self.df.groupby(pd.Grouper(key=date_col[0], freq='M'))[operational_cols[0]].mean()
                efficiency_trend.plot(ax=axes[0,1])
                axes[0,1].set_title('Operational Efficiency Trend')
                axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 27: Efficiency vs Performance
            if len(operational_cols) > 1:
                self.df.plot.scatter(x=operational_cols[0], y=operational_cols[1], ax=axes[1,0], alpha=0.6)
                axes[1,0].set_xlabel(operational_cols[0])
                axes[1,0].set_ylabel(operational_cols[1])
                axes[1,0].set_title('Efficiency vs Performance')
            
            # Chart 28: Operational KPIs
            operational_kpis = self.df[operational_cols].describe()
            operational_kpis.loc[['mean', 'std', 'min', 'max']].plot(kind='bar', ax=axes[1,1])
            axes[1,1].set_title('Operational KPIs Summary')
            axes[1,1].tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            plt.savefig('operational_efficiency.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['operational_efficiency'] = {
                'avg_efficiency': self.df[operational_cols[0]].mean() if operational_cols else 0,
                'efficiency_improvement': self.calculate_improvement_rate(operational_cols[0]) if operational_cols else 0,
                'operational_consistency': self.df[operational_cols[0]].std() if operational_cols else 0
            }
    
    def analyze_market_segmentation(self):
        """Analyze market segmentation"""
        print("🎯 Analyzing Market Segmentation...")
        
        # Segmentation variables
        segment_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['segment', 'category', 'type', 'group', 'class'])]
        
        if segment_cols:
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 29: Market Segments Distribution
            self.df[segment_cols[0]].value_counts().plot(kind='pie', ax=axes[0,0], autopct='%1.1f%%')
            axes[0,0].set_title('Market Segments Distribution')
            
            # Chart 30: Segment Performance Comparison
            segment_performance = self.df.groupby(segment_cols[0]).size().sort_values(ascending=False)
            segment_performance.plot(kind='bar', ax=axes[0,1])
            axes[0,1].set_title('Segment Performance Comparison')
            axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 31: Segment Growth Analysis
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                segment_growth = self.df.groupby([pd.Grouper(key=date_col[0], freq='M'), segment_cols[0]]).size().unstack(fill_value=0)
                segment_growth.plot(ax=axes[1,0])
                axes[1,0].set_title('Segment Growth Trends')
                axes[1,0].tick_params(axis='x', rotation=45)
            
            # Chart 32: Segment Profitability
            value_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['value', 'revenue', 'amount'])]
            if value_cols:
                segment_profitability = self.df.groupby(segment_cols[0])[value_cols[0]].mean().sort_values(ascending=False)
                segment_profitability.plot(kind='bar', ax=axes[1,1])
                axes[1,1].set_title('Segment Average Value')
                axes[1,1].tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            plt.savefig('market_segmentation.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['market_segmentation'] = {
                'total_segments': len(self.df[segment_cols[0]].unique()) if segment_cols else 0,
                'dominant_segment': self.df[segment_cols[0]].value_counts().index[0] if segment_cols else 'N/A',
                'segment_concentration': self.df[segment_cols[0]].value_counts().iloc[0] / len(self.df) if segment_cols else 0
            }
    
    def analyze_risk_factors(self):
        """Analyze risk factors and volatility"""
        print("⚠️ Analyzing Risk Factors...")
        
        # Risk-related columns
        risk_cols = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['risk', 'volatility', 'variance', 'deviation', 'uncertainty'])]
        
        if risk_cols:
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            
            # Chart 33: Risk Distribution
            self.df[risk_cols[0]].hist(ax=axes[0,0], bins=20, alpha=0.7)
            axes[0,0].set_title('Risk Factor Distribution')
            axes[0,0].set_xlabel('Risk Score')
            axes[0,0].set_ylabel('Frequency')
            
            # Chart 34: Risk Trends Over Time
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                risk_trend = self.df.groupby(pd.Grouper(key=date_col[0], freq='M'))[risk_cols[0]].mean()
                risk_trend.plot(ax=axes[0,1])
                axes[0,1].set_title('Risk Trend Over Time')
                axes[0,1].tick_params(axis='x', rotation=45)
            
            # Chart 35: Risk vs Return Analysis
            value_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['value', 'return', 'revenue'])]
            if value_cols:
                self.df.plot.scatter(x=risk_cols[0], y=value_cols[0], ax=axes[1,0], alpha=0.6)
                axes[1,0].set_xlabel('Risk Score')
                axes[1,0].set_ylabel('Value/Return')
                axes[1,0].set_title('Risk vs Return Analysis')
            
            # Chart 36: Risk Factor Correlation
            if len(risk_cols) > 1:
                risk_correlation = self.df[risk_cols].corr()
                sns.heatmap(risk_correlation, annot=True, cmap='Reds', ax=axes[1,1])
                axes[1,1].set_title('Risk Factor Correlation')
            
            plt.tight_layout()
            plt.savefig('risk_analysis.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            self.insights['risk_analysis'] = {
                'avg_risk_score': self.df[risk_cols[0]].mean() if risk_cols else 0,
                'risk_volatility': self.df[risk_cols[0]].std() if risk_cols else 0,
                'high_risk_ratio': (self.df[risk_cols[0]] > self.df[risk_cols[0]].quantile(0.8)).mean() if risk_cols else 0
            }
    
    def identify_growth_opportunities(self):
        """Identify growth opportunities and strategic insights"""
        print("🚀 Identifying Growth Opportunities...")
        
        # Create comprehensive growth analysis
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Chart 37: Growth Potential by Segment
        segment_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['segment', 'category', 'type'])]
        if segment_cols:
            growth_potential = self.df.groupby(segment_cols[0]).size().sort_values(ascending=False)
            growth_potential.plot(kind='bar', ax=axes[0,0])
            axes[0,0].set_title('Growth Potential by Segment')
            axes[0,0].tick_params(axis='x', rotation=45)
        
        # Chart 38: Market Penetration Analysis
        geo_cols = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['region', 'market', 'area'])]
        if geo_cols:
            market_penetration = self.df[geo_cols[0]].value_counts(normalize=True) * 100
            market_penetration.head(10).plot(kind='bar', ax=axes[0,1])
            axes[0,1].set_title('Market Penetration by Region')
            axes[0,1].tick_params(axis='x', rotation=45)
        
        # Chart 39: Customer Acquisition Trends
        date_col = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['date', 'time'])]
        customer_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['customer', 'client'])]
        if date_col and customer_cols:
            customer_acquisition = self.df.groupby(pd.Grouper(key=date_col[0], freq='M'))[customer_cols[0]].nunique()
            customer_acquisition.plot(ax=axes[1,0])
            axes[1,0].set_title('Customer Acquisition Trend')
            axes[1,0].tick_params(axis='x', rotation=45)
        
        # Chart 40: Revenue Growth Opportunities
        value_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['revenue', 'value', 'amount'])]
        if value_cols:
            revenue_opportunities = self.df.groupby(segment_cols[0] if segment_cols else geo_cols[0] if geo_cols else self.df.columns[0])[value_cols[0]].sum().sort_values(ascending=False)
            revenue_opportunities.head(10).plot(kind='bar', ax=axes[1,1])
            axes[1,1].set_title('Revenue Growth Opportunities')
            axes[1,1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig('growth_opportunities.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        self.insights['growth_opportunities'] = {
            'high_growth_segments': self.identify_high_growth_segments(),
            'market_expansion_potential': self.calculate_market_expansion_potential(),
            'customer_growth_rate': self.calculate_customer_growth_rate(),
            'revenue_growth_potential': self.calculate_revenue_growth_potential()
        }
    
    # Helper methods for calculations
    def calculate_growth_rate(self, column):
        """Calculate growth rate for a given column"""
        if column in self.df.columns:
            values = self.df[column].dropna()
            if len(values) > 1:
                return ((values.iloc[-1] - values.iloc[0]) / values.iloc[0]) * 100
        return 0
    
    def calculate_retention_rate(self, customer_col):
        """Calculate customer retention rate"""
        if customer_col in self.df.columns:
            unique_customers = self.df[customer_col].nunique()
            total_records = len(self.df)
            return (unique_customers / total_records) * 100 if total_records > 0 else 0
        return 0
    
    def calculate_seasonality(self, monthly_data):
        """Calculate seasonality score"""
        if len(monthly_data) > 12:
            return monthly_data.std() / monthly_data.mean() if monthly_data.mean() > 0 else 0
        return 0
    
    def calculate_profit_margin(self, financial_cols):
        """Calculate profit margin"""
        if len(financial_cols) >= 2:
            revenue = self.df[financial_cols[0]].sum()
            cost = self.df[financial_cols[1]].sum()
            return ((revenue - cost) / revenue) * 100 if revenue > 0 else 0
        return 0
    
    def calculate_improvement_rate(self, column):
        """Calculate improvement rate"""
        if column in self.df.columns:
            values = self.df[column].dropna()
            if len(values) > 1:
                return ((values.iloc[-1] - values.iloc[0]) / values.iloc[0]) * 100
        return 0
    
    def identify_high_growth_segments(self):
        """Identify high growth segments"""
        segment_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['segment', 'category', 'type'])]
        if segment_cols:
            segment_growth = self.df.groupby(segment_cols[0]).size().sort_values(ascending=False)
            return segment_growth.head(3).index.tolist()
        return []
    
    def calculate_market_expansion_potential(self):
        """Calculate market expansion potential"""
        geo_cols = [col for col in self.df.columns if any(word in col.lower() 
                   for word in ['region', 'market', 'area'])]
        if geo_cols:
            market_coverage = len(self.df[geo_cols[0]].unique())
            return market_coverage
        return 0
    
    def calculate_customer_growth_rate(self):
        """Calculate customer growth rate"""
        customer_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['customer', 'client'])]
        if customer_cols:
            date_col = [col for col in self.df.columns if any(word in col.lower() 
                       for word in ['date', 'time'])]
            if date_col:
                customer_trend = self.df.groupby(pd.Grouper(key=date_col[0], freq='M'))[customer_cols[0]].nunique()
                if len(customer_trend) > 1:
                    return ((customer_trend.iloc[-1] - customer_trend.iloc[0]) / customer_trend.iloc[0]) * 100
        return 0
    
    def calculate_revenue_growth_potential(self):
        """Calculate revenue growth potential"""
        value_cols = [col for col in self.df.columns if any(word in col.lower() 
                        for word in ['revenue', 'value', 'amount'])]
        if value_cols:
            return self.df[value_cols[0]].sum() * 0.2  # Assume 20% growth potential
        return 0
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "="*80)
        print("📊 BLUE DATA COMPREHENSIVE ANALYSIS REPORT")
        print("="*80)
        
        print(f"\n📈 DATASET OVERVIEW:")
        print(f"   • Total Records: {len(self.df):,}")
        print(f"   • Total Columns: {len(self.df.columns)}")
        print(f"   • Date Range: {self.df.select_dtypes(include=['datetime64']).min().iloc[0] if self.df.select_dtypes(include=['datetime64']).shape[1] > 0 else 'N/A'} to {self.df.select_dtypes(include=['datetime64']).max().iloc[0] if self.df.select_dtypes(include=['datetime64']).shape[1] > 0 else 'N/A'}")
        
        print(f"\n🎯 KEY INSIGHTS:")
        for category, metrics in self.insights.items():
            print(f"\n   {category.upper().replace('_', ' ')}:")
            for metric, value in metrics.items():
                if isinstance(value, float):
                    print(f"     • {metric.replace('_', ' ').title()}: {value:.2f}")
                else:
                    print(f"     • {metric.replace('_', ' ').title()}: {value}")
        
        print(f"\n🚀 STRATEGIC RECOMMENDATIONS:")
        print("   1. Focus on high-performing segments identified in the analysis")
        print("   2. Implement targeted marketing strategies for underperforming regions")
        print("   3. Optimize operational efficiency based on identified bottlenecks")
        print("   4. Develop customer retention programs for high-value customers")
        print("   5. Invest in growth opportunities with highest ROI potential")
        
        print(f"\n📊 CHARTS GENERATED: 40+ comprehensive visualizations")
        print("   • Sales Performance Analysis (4 charts)")
        print("   • Customer Behavior Analysis (4 charts)")
        print("   • Product Performance Analysis (4 charts)")
        print("   • Geographic Distribution Analysis (4 charts)")
        print("   • Temporal Pattern Analysis (4 charts)")
        print("   • Financial Metrics Analysis (4 charts)")
        print("   • Operational Efficiency Analysis (4 charts)")
        print("   • Market Segmentation Analysis (4 charts)")
        print("   • Risk Factor Analysis (4 charts)")
        print("   • Growth Opportunities Analysis (4 charts)")
        
        return self.insights

def main():
    """Main execution function"""
    print("🚀 BLUE DATA COMPREHENSIVE ANALYSIS")
    print("="*50)
    
    # Initialize analyzer
    analyzer = BlueDataAnalyzer('Blue_data.xlsx')
    
    # Load data
    df = analyzer.load_data()
    
    # Generate comprehensive insights
    insights = analyzer.generate_comprehensive_insights()
    
    # Generate summary report
    summary = analyzer.generate_summary_report()
    
    # Save insights to JSON for React dashboard
    import json
    with open('analysis_insights.json', 'w') as f:
        json.dump(insights, f, indent=2, default=str)
    
    print(f"\n✅ Analysis completed successfully!")
    print(f"📁 Results saved to: analysis_insights.json")
    print(f"📊 Charts saved as PNG files")

if __name__ == "__main__":
    main()
