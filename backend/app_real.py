from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global variables to store data and models
df = None
models = {}
encoders = {}

def load_and_process_data():
    """Load and process the real Blue-data2.xlsx file"""
    global df
    
    print("📊 Loading Blue-data2.xlsx...")
    df = pd.read_excel('Blue-data2.xlsx')
    print(f"✅ Loaded {len(df)} records with {len(df.columns)} columns")
    
    # Clean and prepare data
    df['Collected Date'] = pd.to_datetime(df['Collected Date'], errors='coerce')
    df['Month'] = pd.to_datetime(df['Month'], errors='coerce')
    
    # Fill missing values
    df['Area'].fillna('Unknown', inplace=True)
    df['Zone'].fillna('Unknown', inplace=True)
    df['Category'].fillna('Unknown', inplace=True)
    
    # Convert numeric columns
    df['Sum of Gallons Collected'] = pd.to_numeric(df['Sum of Gallons Collected'], errors='coerce')
    df['Sum of No of Traps'] = pd.to_numeric(df['Sum of No of Traps'], errors='coerce')
    
    # Calculate derived metrics
    df['Days_Since_Collection'] = (datetime.now() - df['Collected Date']).dt.days
    df['Gallons_per_Trap'] = df['Sum of Gallons Collected'] / df['Sum of No of Traps']
    
    print("✅ Data processing completed")

def train_models():
    """Train ML models for predictions"""
    global models, encoders
    
    print("🤖 Training ML models...")
    
    # Prepare features for missed cleaning prediction
    feature_cols = ['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection', 'Gallons_per_Trap']
    
    # Create target for missed cleaning (outlets with no recent service)
    df['Missed_Cleaning'] = (df['Days_Since_Collection'] > 30).astype(int)
    
    # Prepare data for modeling
    model_data = df[feature_cols + ['Missed_Cleaning']].dropna()
    
    if len(model_data) > 100:  # Only train if we have enough data
        X = model_data[feature_cols]
        y = model_data['Missed_Cleaning']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Random Forest for missed cleaning prediction
        rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_classifier.fit(X_train, y_train)
        
        # Calculate accuracy
        accuracy = rf_classifier.score(X_test, y_test)
        
        models['missed_cleaning'] = {
            'model': rf_classifier,
            'accuracy': accuracy,
            'feature_importance': dict(zip(feature_cols, rf_classifier.feature_importances_))
        }
        
        print(f"✅ Missed cleaning model trained with {accuracy:.2f} accuracy")
    else:
        print("⚠️ Not enough data for model training")
    
    # Train volume prediction model
    volume_data = df[['Sum of Gallons Collected', 'Sum of No of Traps', 'Days_Since_Collection']].dropna()
    
    if len(volume_data) > 100:
        X_vol = volume_data[['Sum of No of Traps', 'Days_Since_Collection']]
        y_vol = volume_data['Sum of Gallons Collected']
        
        X_train_vol, X_test_vol, y_train_vol, y_test_vol = train_test_split(X_vol, y_vol, test_size=0.2, random_state=42)
        
        rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_regressor.fit(X_train_vol, y_train_vol)
        
        # Calculate R² score
        r2_score = rf_regressor.score(X_test_vol, y_test_vol)
        
        models['volume_prediction'] = {
            'model': rf_regressor,
            'accuracy': r2_score,
            'feature_importance': dict(zip(['Sum of No of Traps', 'Days_Since_Collection'], rf_regressor.feature_importances_))
        }
        
        print(f"✅ Volume prediction model trained with R² = {r2_score:.2f}")
    
    print("✅ Model training completed")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ready", 
        "timestamp": datetime.now().isoformat(),
        "data_loaded": df is not None,
        "models_trained": len(models)
    })

@app.route('/api/data/summary', methods=['GET'])
def summary():
    if df is None:
        return jsonify({"error": "Data not loaded"}), 500
    
    # Calculate summary statistics
    total_gallons = df['Sum of Gallons Collected'].sum()
    total_services = len(df)
    total_outlets = df['Entity Mapping.Outlet'].nunique()
    
    # Monthly trends
    monthly_gallons = df.groupby(df['Month'].dt.to_period('M'))['Sum of Gallons Collected'].sum()
    monthly_services = df.groupby(df['Month'].dt.to_period('M')).size()
    
    # Top risk outlets (by days since last collection)
    high_risk = df[df['Days_Since_Collection'] > 30].groupby('Entity Mapping.Outlet').agg({
        'Days_Since_Collection': 'max',
        'Sum of Gallons Collected': 'sum',
        'Area': 'first'
    }).sort_values('Days_Since_Collection', ascending=False).head(5)
    
    # Location breakdown
    location_breakdown = df.groupby('Area').agg({
        'Sum of Gallons Collected': 'sum',
        'Entity Mapping.Outlet': 'nunique'
    }).round(2)
    
    return jsonify({
        "total_outlets": int(total_outlets),
        "total_gallons": float(total_gallons),
        "total_services": total_services,
        "avg_gallons_per_service": float(total_gallons / total_services) if total_services > 0 else 0,
        "high_risk_outlets": len(high_risk),
        "monthly_gallons": {str(period): float(value) for period, value in monthly_gallons.items()},
        "monthly_services": {str(period): int(value) for period, value in monthly_services.items()},
        "top_risk_outlets": [
            {
                "outlet": outlet,
                "days_since": int(days),
                "total_gallons": float(gallons),
                "area": area
            }
            for outlet, (days, gallons, area) in high_risk.iterrows()
        ],
        "location_breakdown": {
            area: {
                "total_gallons": float(gallons),
                "outlet_count": int(outlets)
            }
            for area, (gallons, outlets) in location_breakdown.iterrows()
        }
    })

@app.route('/api/data/exploration', methods=['GET'])
def exploration():
    if df is None:
        return jsonify({"error": "Data not loaded"}), 500
    
    # Get filter parameters
    area_filter = request.args.get('area', '')
    category_filter = request.args.get('category', '')
    
    # Apply filters
    filtered_df = df.copy()
    if area_filter:
        filtered_df = filtered_df[filtered_df['Area'] == area_filter]
    if category_filter:
        filtered_df = filtered_df[filtered_df['Category'] == category_filter]
    
    # Top outlets by volume
    top_by_volume = filtered_df.groupby('Entity Mapping.Outlet').agg({
        'Sum of Gallons Collected': 'sum',
        'Area': 'first',
        'Category': 'first'
    }).sort_values('Sum of Gallons Collected', ascending=False).head(10)
    
    # Outlets by missed cleanings
    outlets_missed = filtered_df[filtered_df['Days_Since_Collection'] > 30].groupby('Entity Mapping.Outlet').agg({
        'Days_Since_Collection': 'max',
        'Sum of Gallons Collected': 'sum',
        'Area': 'first'
    }).sort_values('Days_Since_Collection', ascending=False).head(10)
    
    # Trends by area
    trends_by_area = filtered_df.groupby('Area').agg({
        'Sum of Gallons Collected': 'sum',
        'Entity Mapping.Outlet': 'nunique',
        'Days_Since_Collection': 'mean'
    }).round(2)
    
    # Trends by category
    trends_by_category = filtered_df.groupby('Category').agg({
        'Sum of Gallons Collected': 'sum',
        'Entity Mapping.Outlet': 'nunique',
        'Days_Since_Collection': 'mean'
    }).round(2)
    
    return jsonify({
        "filtered_data": filtered_df.head(100).to_dict('records'),  # Limit to first 100 for performance
        "outlet_types": df['Category'].unique().tolist(),
        "locations": df['Area'].unique().tolist(),
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

@app.route('/api/predictions', methods=['GET'])
def predictions():
    if df is None or not models:
        return jsonify({"error": "Models not trained"}), 500
    
    # Get predictions for all outlets
    unique_outlets = df['Entity Mapping.Outlet'].unique()
    
    predictions_list = []
    for outlet in unique_outlets[:50]:  # Limit to first 50 for performance
        outlet_data = df[df['Entity Mapping.Outlet'] == outlet]
        
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
            if 'missed_cleaning' in models:
                missed_prob = models['missed_cleaning']['model'].predict_proba(features)[0][1]
            
            volume_pred = latest_record['Sum of Gallons Collected']
            if 'volume_prediction' in models:
                vol_features = np.array([[
                    latest_record['Sum of No of Traps'],
                    latest_record['Days_Since_Collection']
                ]])
                volume_pred = models['volume_prediction']['model'].predict(vol_features)[0]
            
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
            "missed_cleaning": models.get('missed_cleaning', {}).get('accuracy', 0),
            "volume_prediction": models.get('volume_prediction', {}).get('accuracy', 0)
        },
        "feature_importance": {
            "missed_cleaning": models.get('missed_cleaning', {}).get('feature_importance', {}),
            "volume_prediction": models.get('volume_prediction', {}).get('feature_importance', {})
        },
        "predictions": predictions_list,
        "monthly_forecast": {
            "next_month_gallons": float(df['Sum of Gallons Collected'].sum() * 1.05),  # 5% growth estimate
            "next_month_services": int(len(df) * 1.05),
            "high_risk_outlets_next_month": len(df[df['Days_Since_Collection'] > 30])
        }
    })

@app.route('/api/scheduling', methods=['GET'])
def scheduling():
    if df is None:
        return jsonify({"error": "Data not loaded"}), 500
    
    # Get high-risk outlets for scheduling
    high_risk_outlets = df[df['Days_Since_Collection'] > 30].groupby('Entity Mapping.Outlet').agg({
        'Days_Since_Collection': 'max',
        'Sum of Gallons Collected': 'sum',
        'Area': 'first',
        'Zone': 'first'
    }).sort_values('Days_Since_Collection', ascending=False)
    
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

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    if df is None:
        return jsonify({"error": "Data not loaded"}), 500
    
    query = request.json.get('query', '').lower()
    
    # Calculate current metrics
    total_gallons = df['Sum of Gallons Collected'].sum()
    total_outlets = df['Entity Mapping.Outlet'].nunique()
    high_risk_count = len(df[df['Days_Since_Collection'] > 30])
    
    if 'revenue' in query or 'gallons' in query:
        monthly_trend = df.groupby(df['Month'].dt.to_period('M'))['Sum of Gallons Collected'].sum()
        if len(monthly_trend) >= 2:
            recent_trend = monthly_trend.iloc[-1] - monthly_trend.iloc[-2]
            trend_direction = "increased" if recent_trend > 0 else "decreased"
            
            return jsonify({
                'answer': f"Gallons collected {trend_direction} from {monthly_trend.iloc[-2]:.0f} to {monthly_trend.iloc[-1]:.0f}",
                'reasons': ["Seasonal variations", "Service frequency changes", "New outlet additions"],
                'recommendations': ["Optimize collection routes", "Increase service frequency", "Monitor outlet performance"]
            })
    
    elif 'zone' in query or 'area' in query:
        high_risk_areas = df[df['Days_Since_Collection'] > 30].groupby('Area').size().sort_values(ascending=False)
        
        return jsonify({
            'answer': "High-risk areas needing attention:",
            'high_risk_areas': {
                area: int(count) for area, count in high_risk_areas.head(3).items()
            },
            'recommendations': ["Schedule inspections", "Allocate inspectors", "Preventive maintenance"],
            'action_items': [f"Focus on {area} this week" for area in high_risk_areas.head(2).index]
        })
    
    elif 'outlet' in query and 'risk' in query:
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
        return jsonify({
            'answer': "Key business insights:",
            'insights': [
                f"Total outlets: {total_outlets}",
                f"Total gallons: {total_gallons:,.0f}",
                f"High-risk outlets: {high_risk_count}"
            ],
            'recommendations': ["Focus on efficiency", "Preventive maintenance", "Resource optimization"]
        })

if __name__ == '__main__':
    print("🚀 Starting Blue Data Analytics Backend (Real Data)...")
    
    # Load data and train models
    load_and_process_data()
    train_models()
    
    print("✅ Backend ready! Starting Flask server...")
    app.run(debug=False, host='0.0.0.0', port=5001)


