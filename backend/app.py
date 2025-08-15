from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
import plotly.express as px
import plotly.graph_objects as go
import plotly.utils
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global variables to store data and models
df = None
models = {}
encoders = {}
scalers = {}

def load_and_process_data():
    """Load and process the Blue-data2.xlsx file"""
    global df
    
    try:
        # Load the Excel file
        df = pd.read_excel('Blue-data2.xlsx')
        
        # Basic data cleaning
        df = df.dropna(subset=['Outlet_Name', 'Outlet_Type', 'Location'])
        
        # Convert date columns to datetime
        date_columns = [col for col in df.columns if 'Date' in col or 'date' in col.lower()]
        for col in date_columns:
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            except:
                pass
        
        # Fill missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(0)
        
        # Create derived features
        df['Days_Since_Last_Cleaning'] = (datetime.now() - df['Last_Cleaning_Date']).dt.days
        df['Cleaning_Frequency'] = df['Total_Cleanings'] / df['Days_Since_Last_Cleaning'].clip(lower=1)
        
        # Calculate risk scores
        df['Risk_Score'] = (
            df['Days_Since_Last_Cleaning'] * 0.3 +
            (100 - df['Trap_Efficiency']) * 0.4 +
            (df['Missed_Cleanings'] * 10) * 0.3
        )
        
        print(f"Data loaded successfully: {len(df)} records")
        return True
        
    except Exception as e:
        print(f"Error loading data: {e}")
        return False

def train_models():
    """Train machine learning models for predictions"""
    global models, encoders, scalers
    
    try:
        # Prepare features for missed cleaning prediction
        feature_columns = ['Outlet_Type', 'Location', 'Trap_Efficiency', 'Days_Since_Last_Cleaning', 'Total_Cleanings']
        
        # Encode categorical variables
        le_outlet = LabelEncoder()
        le_location = LabelEncoder()
        
        X = df[feature_columns].copy()
        X['Outlet_Type_Encoded'] = le_outlet.fit_transform(X['Outlet_Type'])
        X['Location_Encoded'] = le_location.fit_transform(X['Location'])
        
        # Drop original categorical columns
        X = X.drop(['Outlet_Type', 'Location'], axis=1)
        
        # Create target variable (high risk of missed cleaning)
        y_missed = (df['Risk_Score'] > 70).astype(int)
        
        # Train missed cleaning classifier
        X_train, X_test, y_train, y_test = train_test_split(X, y_missed, test_size=0.2, random_state=42)
        
        rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_classifier.fit(X_train, y_train)
        
        # Train volume prediction model
        volume_features = ['Outlet_Type_Encoded', 'Location_Encoded', 'Trap_Efficiency', 'Total_Cleanings']
        y_volume = df['Gallons_Collected']
        
        X_vol_train, X_vol_test, y_vol_train, y_vol_test = train_test_split(
            X[volume_features], y_volume, test_size=0.2, random_state=42
        )
        
        rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_regressor.fit(X_vol_train, y_vol_train)
        
        # Store models and encoders
        models['missed_cleaning'] = rf_classifier
        models['volume_prediction'] = rf_regressor
        encoders['outlet_type'] = le_outlet
        encoders['location'] = le_location
        
        print("Models trained successfully")
        return True
        
    except Exception as e:
        print(f"Error training models: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/data/summary', methods=['GET'])
def get_data_summary():
    """Get comprehensive data summary for Page 1"""
    if df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        # Calculate summary statistics
        summary = {
            'total_outlets': len(df),
            'total_gallons': int(df['Gallons_Collected'].sum()),
            'total_services': int(df['Total_Cleanings'].sum()),
            'avg_trap_efficiency': float(df['Trap_Efficiency'].mean()),
            'high_risk_outlets': int(len(df[df['Risk_Score'] > 70])),
            'total_revenue': float(df['Revenue'].sum()) if 'Revenue' in df.columns else 0,
            
            # Monthly trends
            'monthly_gallons': df.groupby(df['Last_Cleaning_Date'].dt.to_period('M'))['Gallons_Collected'].sum().tail(12).to_dict(),
            'monthly_services': df.groupby(df['Last_Cleaning_Date'].dt.to_period('M'))['Total_Cleanings'].sum().tail(12).to_dict(),
            
            # Top risk outlets
            'top_risk_outlets': df.nlargest(10, 'Risk_Score')[['Outlet_Name', 'Location', 'Risk_Score', 'Days_Since_Last_Cleaning']].to_dict('records'),
            
            # Location analysis
            'location_breakdown': df.groupby('Location').agg({
                'Gallons_Collected': 'sum',
                'Total_Cleanings': 'sum',
                'Outlet_Name': 'count'
            }).to_dict('index')
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/exploration', methods=['GET'])
def get_data_exploration():
    """Get detailed data exploration for Page 2"""
    if df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        # Get filter parameters
        outlet_type = request.args.get('outlet_type')
        location = request.args.get('location')
        grade = request.args.get('grade')
        
        # Apply filters
        filtered_df = df.copy()
        if outlet_type:
            filtered_df = filtered_df[filtered_df['Outlet_Type'] == outlet_type]
        if location:
            filtered_df = filtered_df[filtered_df['Location'] == location]
        if grade:
            filtered_df = filtered_df[filtered_df['Grade'] == grade]
        
        exploration = {
            'filtered_data': filtered_df.to_dict('records'),
            'outlet_types': df['Outlet_Type'].unique().tolist(),
            'locations': df['Location'].unique().tolist(),
            'grades': df['Grade'].unique().tolist() if 'Grade' in df.columns else [],
            
            # Rankings
            'top_outlets_by_volume': filtered_df.nlargest(20, 'Gallons_Collected')[['Outlet_Name', 'Location', 'Gallons_Collected', 'Trap_Efficiency']].to_dict('records'),
            'top_outlets_by_efficiency': filtered_df.nlargest(20, 'Trap_Efficiency')[['Outlet_Name', 'Location', 'Trap_Efficiency', 'Gallons_Collected']].to_dict('records'),
            'outlets_by_missed_cleanings': filtered_df.nlargest(20, 'Missed_Cleanings')[['Outlet_Name', 'Location', 'Missed_Cleanings', 'Risk_Score']].to_dict('records'),
            
            # Trends
            'trends_by_outlet_type': filtered_df.groupby('Outlet_Type').agg({
                'Gallons_Collected': 'mean',
                'Trap_Efficiency': 'mean',
                'Total_Cleanings': 'mean'
            }).to_dict('index'),
            
            'trends_by_location': filtered_df.groupby('Location').agg({
                'Gallons_Collected': 'sum',
                'Outlet_Name': 'count',
                'Risk_Score': 'mean'
            }).to_dict('index')
        }
        
        return jsonify(exploration)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get predictions for Page 3"""
    if not models:
        return jsonify({'error': 'Models not trained'}), 500
    
    try:
        # Get predictions for next month
        future_date = datetime.now() + timedelta(days=30)
        
        # Predict missed cleanings
        X_pred = df[['Outlet_Type', 'Location', 'Trap_Efficiency', 'Days_Since_Last_Cleaning', 'Total_Cleanings']].copy()
        X_pred['Outlet_Type_Encoded'] = encoders['outlet_type'].transform(X_pred['Outlet_Type'])
        X_pred['Location_Encoded'] = encoders['location'].transform(X_pred['Location'])
        X_pred = X_pred.drop(['Outlet_Type', 'Location'], axis=1)
        
        missed_cleaning_probs = models['missed_cleaning'].predict_proba(X_pred)[:, 1]
        volume_predictions = models['volume_prediction'].predict(X_pred[['Outlet_Type_Encoded', 'Location_Encoded', 'Trap_Efficiency', 'Total_Cleanings']])
        
        # Create predictions dataframe
        predictions_df = df.copy()
        predictions_df['Missed_Cleaning_Probability'] = missed_cleaning_probs
        predictions_df['Predicted_Volume'] = volume_predictions
        
        predictions = {
            'model_accuracy': {
                'missed_cleaning': float(accuracy_score(
                    (df['Risk_Score'] > 70).astype(int),
                    models['missed_cleaning'].predict(X_pred)
                )),
                'volume_prediction': float(r2_score(
                    df['Gallons_Collected'],
                    models['volume_prediction'].predict(X_pred[['Outlet_Type_Encoded', 'Location_Encoded', 'Trap_Efficiency', 'Total_Cleanings']])
                ))
            },
            
            'feature_importance': {
                'missed_cleaning': dict(zip(
                    ['Trap_Efficiency', 'Days_Since_Last_Cleaning', 'Total_Cleanings', 'Outlet_Type', 'Location'],
                    models['missed_cleaning'].feature_importances_
                )),
                'volume_prediction': dict(zip(
                    ['Trap_Efficiency', 'Total_Cleanings', 'Outlet_Type', 'Location'],
                    models['volume_prediction'].feature_importances_
                ))
            },
            
            'predictions': predictions_df[['Outlet_Name', 'Location', 'Missed_Cleaning_Probability', 'Predicted_Volume', 'Risk_Score']].to_dict('records'),
            
            'monthly_forecast': {
                'next_month_gallons': float(volume_predictions.sum()),
                'next_month_services': int(len(df) * 1.1),  # Assume 10% growth
                'high_risk_outlets_next_month': int(len(predictions_df[predictions_df['Missed_Cleaning_Probability'] > 0.7]))
            }
        }
        
        return jsonify(predictions)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduling', methods=['GET'])
def get_scheduling():
    """Get inspection scheduling for Page 5"""
    if df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        # Get high-risk outlets for scheduling
        high_risk = df[df['Risk_Score'] > 70].copy()
        high_risk = high_risk.sort_values('Risk_Score', ascending=False)
        
        # Group by location for route optimization
        location_groups = high_risk.groupby('Location').agg({
            'Outlet_Name': 'count',
            'Risk_Score': 'mean',
            'Gallons_Collected': 'sum'
        }).reset_index()
        
        # Create weekly schedule
        weekly_schedule = []
        current_week = datetime.now()
        
        for i in range(4):  # 4 weeks
            week_start = current_week + timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)
            
            week_outlets = high_risk.head((i + 1) * 10)  # Distribute outlets across weeks
            week_schedule = {
                'week': f"Week {i + 1}",
                'start_date': week_start.strftime('%Y-%m-%d'),
                'end_date': week_end.strftime('%Y-%m-%d'),
                'outlets': week_outlets[['Outlet_Name', 'Location', 'Risk_Score', 'Days_Since_Last_Cleaning']].to_dict('records')
            }
            weekly_schedule.append(week_schedule)
        
        scheduling = {
            'weekly_schedule': weekly_schedule,
            'route_optimization': location_groups.to_dict('records'),
            'total_inspections_planned': len(high_risk),
            'estimated_duration_weeks': 4,
            'high_priority_outlets': high_risk.head(20)[['Outlet_Name', 'Location', 'Risk_Score', 'Days_Since_Last_Cleaning']].to_dict('records')
        }
        
        return jsonify(scheduling)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot', methods=['POST'])
def chatbot_query():
    """Enhanced chatbot endpoint for Page 4"""
    if df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    try:
        data = request.json
        query = data.get('query', '').lower()
        
        # Business logic for different query types
        if 'revenue' in query and 'drop' in query:
            # Analyze revenue trends
            monthly_revenue = df.groupby(df['Last_Cleaning_Date'].dt.to_period('M'))['Revenue'].sum() if 'Revenue' in df.columns else None
            
            if monthly_revenue is not None and len(monthly_revenue) > 1:
                recent_trend = monthly_revenue.tail(3)
                if recent_trend.iloc[-1] < recent_trend.iloc[-2]:
                    response = {
                        'answer': f"Revenue dropped from {recent_trend.iloc[-2]:.0f} to {recent_trend.iloc[-1]:.0f} in the last month. This could be due to:",
                        'reasons': [
                            "Seasonal business fluctuations",
                            "Reduced service frequency in some outlets",
                            "Economic factors affecting customer spending"
                        ],
                        'recommendations': [
                            "Increase marketing efforts to high-value customers",
                            "Review pricing strategy for competitive markets",
                            "Implement loyalty programs to retain customers"
                        ]
                    }
                else:
                    response = {
                        'answer': "Revenue is actually trending upward in recent months.",
                        'reasons': ["Increased service efficiency", "Growing customer base", "Improved pricing strategy"],
                        'recommendations': ["Continue current successful practices", "Expand to new markets", "Invest in technology improvements"]
                    }
            else:
                response = {
                    'answer': "Revenue data is not available for trend analysis.",
                    'reasons': ["Insufficient historical data", "Data collection issues"],
                    'recommendations': ["Implement better revenue tracking", "Collect more historical data"]
                }
                
        elif 'zone' in query and ('visit' in query or 'inspector' in query):
            # Zone-based recommendations
            zone_analysis = df.groupby('Location').agg({
                'Risk_Score': 'mean',
                'Outlet_Name': 'count',
                'Days_Since_Last_Cleaning': 'mean'
            }).sort_values('Risk_Score', ascending=False)
            
            high_risk_zones = zone_analysis.head(3)
            response = {
                'answer': f"Based on risk analysis, the following zones need immediate inspector attention:",
                'high_risk_zones': high_risk_zones.to_dict('index'),
                'recommendations': [
                    f"Zone {zone}: {data['Outlet_Name']} outlets, avg risk score {data['Risk_Score']:.1f}"
                    for zone, data in high_risk_zones.iterrows()
                ],
                'action_items': [
                    "Schedule inspections for high-risk zones this week",
                    "Allocate additional inspectors to critical areas",
                    "Implement preventive maintenance programs"
                ]
            }
            
        elif 'missed cleaning' in query or 'inspection' in query:
            # Missed cleaning analysis
            missed_cleanings = df[df['Missed_Cleanings'] > 0]
            total_missed = len(missed_cleanings)
            
            response = {
                'answer': f"Current missed cleaning situation: {total_missed} outlets have missed cleanings.",
                'statistics': {
                    'total_missed_outlets': total_missed,
                    'avg_days_overdue': float(missed_cleanings['Days_Since_Last_Cleaning'].mean()),
                    'high_risk_missed': int(len(missed_cleanings[missed_cleanings['Risk_Score'] > 70]))
                },
                'recommendations': [
                    "Prioritize high-risk outlets for immediate service",
                    "Implement automated reminder systems",
                    "Review scheduling algorithms for better coverage"
                ]
            }
            
        else:
            # General business insights
            response = {
                'answer': "Here are some key business insights from your data:",
                'insights': [
                    f"Total outlets: {len(df)}",
                    f"Average trap efficiency: {df['Trap_Efficiency'].mean():.1f}%",
                    f"Total gallons collected: {df['Gallons_Collected'].sum():,.0f}",
                    f"High-risk outlets: {len(df[df['Risk_Score'] > 70])}"
                ],
                'recommendations': [
                    "Focus on outlets with low trap efficiency",
                    "Implement preventive maintenance schedules",
                    "Use predictive analytics for better resource allocation"
                ]
            }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Blue Data Analytics Backend...")
    
    # Load data and train models
    if load_and_process_data():
        if train_models():
            print("✅ Backend ready! Starting Flask server...")
            app.run(debug=True, host='0.0.0.0', port=5000)
        else:
            print("❌ Failed to train models")
    else:
        print("❌ Failed to load data")
