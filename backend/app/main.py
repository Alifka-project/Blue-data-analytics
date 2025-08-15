from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
from pathlib import Path
import sys

# Add backend root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import utilities
from utils.helpers.data_processor import DataProcessor
from utils.helpers.model_trainer import ModelTrainer
from utils.analysis.business_analyzer import BusinessAnalyzer
from config.settings import API_HOST, API_PORT, API_DEBUG, BACKEND_LOGS

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BACKEND_LOGS / 'app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize components
data_processor = DataProcessor()
model_trainer = ModelTrainer()
business_analyzer = BusinessAnalyzer()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ready",
        "timestamp": datetime.now().isoformat(),
        "data_loaded": data_processor.df is not None,
        "models_trained": len(model_trainer.models),
        "analyses_completed": len(business_analyzer.analysis_results)
    })

@app.route('/api/data/summary', methods=['GET'])
def summary():
    """Get data summary and KPIs"""
    try:
        if data_processor.df is None:
            return jsonify({"error": "Data not loaded"}), 500
        
        # Get summary statistics
        summary_stats = data_processor.get_data_summary()
        high_risk_outlets = data_processor.get_high_risk_outlets()
        monthly_gallons, monthly_services = data_processor.get_monthly_trends()
        location_breakdown = data_processor.get_location_breakdown()
        
        # Calculate additional metrics
        total_gallons = data_processor.df['Sum of Gallons Collected'].sum()
        total_services = len(data_processor.df)
        total_outlets = data_processor.df['Entity Mapping.Outlet'].nunique()
        
        return jsonify({
            "total_outlets": int(total_outlets),
            "total_gallons": float(total_gallons),
            "total_services": total_services,
            "avg_gallons_per_service": float(total_gallons / total_services) if total_services > 0 else 0,
            "high_risk_outlets": len(high_risk_outlets),
            "monthly_gallons": {str(period): float(value) for period, value in monthly_gallons.items()},
            "monthly_services": {str(period): int(value) for period, value in monthly_services.items()},
            "top_risk_outlets": [
                {
                    "outlet": outlet,
                    "days_since": int(days),
                    "total_gallons": float(gallons),
                    "area": area
                }
                for outlet, (days, gallons, area) in high_risk_outlets.head(5).iterrows()
            ],
            "location_breakdown": {
                area: {
                    "total_gallons": float(gallons),
                    "outlet_count": int(outlets)
                }
                for area, (gallons, outlets) in location_breakdown.iterrows()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in summary endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/exploration', methods=['GET'])
def exploration():
    """Get detailed data exploration with filtering"""
    try:
        if data_processor.df is None:
            return jsonify({"error": "Data not loaded"}), 500
        
        # Get filter parameters
        area_filter = request.args.get('area', '')
        category_filter = request.args.get('category', '')
        
        # Apply filters
        filtered_df = data_processor.df.copy()
        if area_filter:
            filtered_df = filtered_df[filtered_df['Area'] == area_filter]
        if category_filter:
            filtered_df = filtered_df[filtered_df['Category'] == category_filter]
        
        # Get various breakdowns
        top_by_volume = filtered_df.groupby('Entity Mapping.Outlet').agg({
            'Sum of Gallons Collected': 'sum',
            'Area': 'first',
            'Category': 'first'
        }).sort_values('Sum of Gallons Collected', ascending=False).head(10)
        
        outlets_missed = filtered_df[filtered_df['Days_Since_Collection'] > 30].groupby('Entity Mapping.Outlet').agg({
            'Days_Since_Collection': 'max',
            'Sum of Gallons Collected': 'sum',
            'Area': 'first'
        }).sort_values('Days_Since_Collection', ascending=False).head(10)
        
        trends_by_area = filtered_df.groupby('Area').agg({
            'Sum of Gallons Collected': 'sum',
            'Entity Mapping.Outlet': 'nunique',
            'Days_Since_Collection': 'mean'
        }).round(2)
        
        trends_by_category = filtered_df.groupby('Category').agg({
            'Sum of Gallons Collected': 'sum',
            'Entity Mapping.Outlet': 'nunique',
            'Days_Since_Collection': 'mean'
        }).round(2)
        
        return jsonify({
            "filtered_data": filtered_df.head(100).to_dict('records'),
            "outlet_types": data_processor.df['Category'].unique().tolist(),
            "locations": data_processor.df['Area'].unique().tolist(),
            "top_outlets_by_volume": [
                {
                    "outlet": outlet,
                    "total_gallons": float(gallons),
                    "area": area,
                    "category": category
                }
                for outlet, (gallons, area, category) in top_by_volume.iterrows()
            ],
            "outlets_by_missed_cleanings": [
                {
                    "outlet": outlet,
                    "days_since": int(days),
                    "total_gallons": float(gallons),
                    "area": area
                }
                for outlet, (days, gallons, area) in outlets_missed.iterrows()
            ],
            "trends_by_area": {
                area: {
                    "total_gallons": float(gallons),
                    "outlet_count": int(outlets),
                    "avg_days_since": float(days)
                }
                for area, (gallons, outlets, days) in trends_by_area.iterrows()
            },
            "trends_by_category": {
                category: {
                    "total_gallons": float(gallons),
                    "outlet_count": int(outlets),
                    "avg_days_since": float(days)
                }
                for category, (gallons, outlets, days) in trends_by_category.iterrows()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in exploration endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predictions', methods=['GET'])
def predictions():
    """Get ML model predictions"""
    try:
        if data_processor.df is None or not model_trainer.models:
            return jsonify({"error": "Models not trained"}), 500
        
        # Get predictions for outlets
        unique_outlets = data_processor.df['Entity Mapping.Outlet'].unique()
        
        predictions_list = []
        for outlet in unique_outlets[:50]:  # Limit for performance
            outlet_data = data_processor.df[data_processor.df['Entity Mapping.Outlet'] == outlet]
            
            if len(outlet_data) > 0:
                latest_record = outlet_data.iloc[-1]
                
                # Prepare features for prediction
                features = np.array([[
                    latest_record['Sum of Gallons Collected'],
                    latest_record['Sum of No of Traps'],
                    latest_record['Days_Since_Collection'],
                    latest_record['Gallons_per_Trap']
                ]])
                
                # Make predictions
                missed_prob = 0
                if 'missed_cleaning' in model_trainer.models:
                    missed_prob = model_trainer.models['missed_cleaning']['model'].predict_proba(features)[0][1]
                
                volume_pred = latest_record['Sum of Gallons Collected']
                if 'volume_prediction' in model_trainer.models:
                    vol_features = np.array([[
                        latest_record['Sum of No of Traps'],
                        latest_record['Days_Since_Collection']
                    ]])
                    volume_pred = model_trainer.models['volume_prediction']['model'].predict(vol_features)[0]
                
                predictions_list.append({
                    "outlet": outlet,
                    "area": latest_record['Area'],
                    "missed_cleaning_probability": float(missed_prob),
                    "predicted_volume": float(volume_pred),
                    "current_volume": float(latest_record['Sum of Gallons Collected']),
                    "days_since_collection": int(latest_record['Days_Since_Collection'])
                })
        
        return jsonify({
            "model_accuracy": {
                "missed_cleaning": model_trainer.models.get('missed_cleaning', {}).get('accuracy', 0),
                "volume_prediction": model_trainer.models.get('volume_prediction', {}).get('accuracy', 0)
            },
            "feature_importance": {
                "missed_cleaning": model_trainer.models.get('missed_cleaning', {}).get('feature_importance', {}),
                "volume_prediction": model_trainer.models.get('volume_prediction', {}).get('feature_importance', {})
            },
            "predictions": predictions_list,
            "monthly_forecast": {
                "next_month_gallons": float(data_processor.df['Sum of Gallons Collected'].sum() * 1.05),
                "next_month_services": int(len(data_processor.df) * 1.05),
                "high_risk_outlets_next_month": len(data_processor.df[data_processor.df['Days_Since_Collection'] > 30])
            }
        })
        
    except Exception as e:
        logger.error(f"Error in predictions endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/scheduling', methods=['GET'])
def scheduling():
    """Get inspection scheduling and route optimization"""
    try:
        if data_processor.df is None:
            return jsonify({"error": "Data not loaded"}), 500
        
        # Get high-risk outlets for scheduling
        high_risk_outlets = data_processor.get_high_risk_outlets()
        
        # Create weekly schedule
        weekly_schedule = []
        outlets_list = high_risk_outlets.head(20).reset_index()
        
        for i in range(0, len(outlets_list), 5):
            week_outlets = outlets_list.iloc[i:i+5]
            week_num = (i // 5) + 1
            
            start_date = datetime.now() + timedelta(days=week_num * 7)
            end_date = start_date + timedelta(days=6)
            
            weekly_schedule.append({
                "week": f"Week {week_num}",
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "outlets": [
                    {
                        "outlet": row['Entity Mapping.Outlet'],
                        "area": row['Area'],
                        "zone": row['Zone'],
                        "days_since": int(row['Days_Since_Collection']),
                        "total_gallons": float(row['Sum of Gallons Collected'])
                    }
                    for _, row in week_outlets.iterrows()
                ]
            })
        
        # Route optimization by zone
        zone_breakdown = high_risk_outlets.groupby('Zone').agg({
            'Entity Mapping.Outlet': 'count',
            'Sum of Gallons Collected': 'sum'
        }).round(2)
        
        return jsonify({
            "weekly_schedule": weekly_schedule,
            "route_optimization": [
                {
                    "zone": zone,
                    "outlet_count": int(count),
                    "total_gallons": float(gallons)
                }
                for zone, (count, gallons) in zone_breakdown.iterrows()
            ],
            "total_inspections_planned": len(high_risk_outlets),
            "estimated_duration_weeks": len(weekly_schedule),
            "high_priority_outlets": [
                {
                    "outlet": outlet,
                    "area": area,
                    "zone": zone,
                    "days_since": int(days),
                    "total_gallons": float(gallons)
                }
                for outlet, (days, gallons, area, zone) in high_risk_outlets.head(10).iterrows()
            ]
        })
        
    except Exception as e:
        logger.error(f"Error in scheduling endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    """AI chatbot endpoint for business queries"""
    try:
        if data_processor.df is None:
            return jsonify({"error": "Data not loaded"}), 500
        
        query = request.json.get('query', '').lower()
        
        # Set data for business analyzer
        business_analyzer.set_data(data_processor.df)
        
        # Generate insights if not already done
        if not business_analyzer.analysis_results:
            business_analyzer.generate_business_insights()
        
        # Handle different types of queries
        if 'revenue' in query or 'gallons' in query:
            monthly_trend = data_processor.df.groupby(data_processor.df['Month'].dt.to_period('M'))['Sum of Gallons Collected'].sum()
            if len(monthly_trend) >= 2:
                recent_trend = monthly_trend.iloc[-1] - monthly_trend.iloc[-2]
                trend_direction = "increased" if recent_trend > 0 else "decreased"
                
                return jsonify({
                    'answer': f"Gallons collected {trend_direction} from {monthly_trend.iloc[-2]:.0f} to {monthly_trend.iloc[-1]:.0f}",
                    'reasons': ["Seasonal variations", "Service frequency changes", "New outlet additions"],
                    'recommendations': ["Optimize collection routes", "Increase service frequency", "Monitor outlet performance"]
                })
        
        elif 'zone' in query or 'area' in query:
            high_risk_areas = data_processor.df[data_processor.df['Days_Since_Collection'] > 30].groupby('Area').size().sort_values(ascending=False)
            
            return jsonify({
                'answer': "High-risk areas needing attention:",
                'high_risk_areas': {
                    area: int(count) for area, count in high_risk_areas.head(3).items()
                },
                'recommendations': ["Schedule inspections", "Allocate inspectors", "Preventive maintenance"],
                'action_items': [f"Focus on {area} this week" for area in high_risk_areas.head(2).index]
            })
        
        elif 'outlet' in query and 'risk' in query:
            high_risk_count = len(data_processor.df[data_processor.df['Days_Since_Collection'] > 30])
            total_outlets = data_processor.df['Entity Mapping.Outlet'].nunique()
            total_gallons = data_processor.df['Sum of Gallons Collected'].sum()
            
            return jsonify({
                'answer': f"Current risk assessment: {high_risk_count} outlets need immediate attention",
                'insights': [
                    f"Total outlets: {total_outlets}",
                    f"High-risk outlets: {high_risk_count}",
                    f"Total gallons collected: {total_gallons:,.0f}"
                ],
                'recommendations': ["Prioritize high-risk outlets", "Implement preventive maintenance", "Optimize collection schedules"]
            })
        
        else:
            # Return general business insights
            insights = business_analyzer.analysis_results.get('business_insights', {})
            return jsonify({
                'answer': "Key business insights:",
                'insights': [
                    f"Total outlets: {insights.get('key_metrics', {}).get('total_outlets', 'N/A')}",
                    f"Total gallons: {insights.get('key_metrics', {}).get('total_revenue', 'N/A'):,.0f}",
                    f"High-risk outlets: {insights.get('key_metrics', {}).get('risk_percentage', 'N/A'):.1f}%"
                ],
                'recommendations': insights.get('recommendations', ["Focus on efficiency", "Preventive maintenance", "Resource optimization"])
            })
        
    except Exception as e:
        logger.error(f"Error in chatbot endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analysis/business-insights', methods=['GET'])
def business_insights():
    """Get comprehensive business insights"""
    try:
        if data_processor.df is None:
            return jsonify({"error": "Data not loaded"}), 500
        
        # Set data and generate insights
        business_analyzer.set_data(data_processor.df)
        insights = business_analyzer.generate_business_insights()
        
        return jsonify(insights)
        
    except Exception as e:
        logger.error(f"Error in business insights endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analysis/summary', methods=['GET'])
def analysis_summary():
    """Get summary of all analyses"""
    try:
        return jsonify(business_analyzer.get_analysis_summary())
    except Exception as e:
        logger.error(f"Error in analysis summary endpoint: {e}")
        return jsonify({"error": str(e)}), 500

def initialize_app():
    """Initialize the application with data and models"""
    try:
        logger.info("🚀 Initializing Blue Data Analytics Backend...")
        
        # Load and process data
        if not data_processor.load_processed_data():
            logger.info("📊 Loading and processing raw data...")
            if not data_processor.load_data():
                logger.error("❌ Failed to load data")
                return False
            
            if not data_processor.clean_data():
                logger.error("❌ Failed to clean data")
                return False
            
            data_processor.save_processed_data()
        
        # Load or train models
        if not model_trainer.load_models():
            logger.info("🤖 Training new models...")
            if not model_trainer.train_all_models(data_processor.df):
                logger.error("❌ Failed to train models")
                return False
            
            model_trainer.save_models()
        
        # Generate business insights
        business_analyzer.set_data(data_processor.df)
        business_analyzer.generate_business_insights()
        
        logger.info("✅ Application initialization completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Application initialization failed: {e}")
        return False

if __name__ == '__main__':
    # Import datetime here to avoid circular imports
    from datetime import datetime, timedelta
    import numpy as np
    
    # Initialize the application
    if initialize_app():
        logger.info("✅ Backend ready! Starting Flask server...")
        app.run(debug=API_DEBUG, host=API_HOST, port=API_PORT)
    else:
        logger.error("❌ Failed to initialize application")
        exit(1)
