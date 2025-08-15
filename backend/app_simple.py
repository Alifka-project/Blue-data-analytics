from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# Mock data to simulate the dashboard functionality
def generate_mock_data():
    """Generate mock data for the dashboard"""
    
    # Mock outlets data
    outlets = []
    outlet_types = ["Restaurant", "Accommodation", "Cafeteria", "Hotel", "Cafe"]
    locations = ["Al Quoz", "Al Barsha", "Al Karama", "Al Garhoud", "Al Qudra", "Al Maktoum", "Al Wasl", "Al Safa"]
    
    for i in range(100):
        outlet = {
            "Outlet_Name": f"Outlet_{i+1:03d}",
            "Outlet_Type": random.choice(outlet_types),
            "Location": random.choice(locations),
            "Gallons_Collected": random.randint(1000, 10000),
            "Trap_Efficiency": random.randint(60, 95),
            "Total_Cleanings": random.randint(1, 20),
            "Missed_Cleanings": random.randint(0, 5),
            "Days_Since_Last_Cleaning": random.randint(1, 90),
            "Risk_Score": random.randint(20, 90),
            "Revenue": random.randint(500, 5000)
        }
        outlets.append(outlet)
    
    return outlets

# Generate mock data
mock_outlets = generate_mock_data()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/data/summary', methods=['GET'])
def get_data_summary():
    """Get comprehensive data summary for Page 1"""
    try:
        # Calculate summary statistics
        total_gallons = sum(outlet['Gallons_Collected'] for outlet in mock_outlets)
        total_services = sum(outlet['Total_Cleanings'] for outlet in mock_outlets)
        avg_trap_efficiency = sum(outlet['Trap_Efficiency'] for outlet in mock_outlets) / len(mock_outlets)
        high_risk_outlets = len([outlet for outlet in mock_outlets if outlet['Risk_Score'] > 70])
        total_revenue = sum(outlet['Revenue'] for outlet in mock_outlets)
        
        # Generate monthly trends
        monthly_gallons = {}
        monthly_services = {}
        for i in range(12):
            month = (datetime.now() - timedelta(days=30*i)).strftime('%Y-%m')
            monthly_gallons[month] = random.randint(80000, 120000)
            monthly_services[month] = random.randint(800, 1200)
        
        # Top risk outlets
        top_risk_outlets = sorted(mock_outlets, key=lambda x: x['Risk_Score'], reverse=True)[:10]
        
        # Location breakdown
        location_breakdown = {}
        for outlet in mock_outlets:
            loc = outlet['Location']
            if loc not in location_breakdown:
                location_breakdown[loc] = {
                    'Gallons_Collected': 0,
                    'Total_Cleanings': 0,
                    'Outlet_Name': 0
                }
            location_breakdown[loc]['Gallons_Collected'] += outlet['Gallons_Collected']
            location_breakdown[loc]['Total_Cleanings'] += outlet['Total_Cleanings']
            location_breakdown[loc]['Outlet_Name'] += 1
        
        summary = {
            'total_outlets': len(mock_outlets),
            'total_gallons': total_gallons,
            'total_services': total_services,
            'avg_trap_efficiency': round(avg_trap_efficiency, 1),
            'high_risk_outlets': high_risk_outlets,
            'total_revenue': total_revenue,
            'monthly_gallons': monthly_gallons,
            'monthly_services': monthly_services,
            'top_risk_outlets': top_risk_outlets,
            'location_breakdown': location_breakdown
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/exploration', methods=['GET'])
def get_data_exploration():
    """Get detailed data exploration for Page 2"""
    try:
        # Get filter parameters
        outlet_type = request.args.get('outlet_type')
        location = request.args.get('location')
        grade = request.args.get('grade')
        
        # Apply filters
        filtered_outlets = mock_outlets.copy()
        if outlet_type:
            filtered_outlets = [outlet for outlet in filtered_outlets if outlet['Outlet_Type'] == outlet_type]
        if location:
            filtered_outlets = [outlet for outlet in filtered_outlets if outlet['Location'] == location]
        
        # Get unique values for filters
        outlet_types = list(set(outlet['Outlet_Type'] for outlet in mock_outlets))
        locations = list(set(outlet['Location'] for outlet in mock_outlets))
        
        # Rankings
        top_outlets_by_volume = sorted(filtered_outlets, key=lambda x: x['Gallons_Collected'], reverse=True)[:20]
        top_outlets_by_efficiency = sorted(filtered_outlets, key=lambda x: x['Trap_Efficiency'], reverse=True)[:20]
        outlets_by_missed_cleanings = sorted(filtered_outlets, key=lambda x: x['Missed_Cleanings'], reverse=True)[:20]
        
        # Trends by outlet type
        trends_by_outlet_type = {}
        for outlet_type in outlet_types:
            type_outlets = [outlet for outlet in filtered_outlets if outlet['Outlet_Type'] == outlet_type]
            if type_outlets:
                trends_by_outlet_type[outlet_type] = {
                    'Gallons_Collected': sum(outlet['Gallons_Collected'] for outlet in type_outlets) / len(type_outlets),
                    'Trap_Efficiency': sum(outlet['Trap_Efficiency'] for outlet in type_outlets) / len(type_outlets),
                    'Total_Cleanings': sum(outlet['Total_Cleanings'] for outlet in type_outlets) / len(type_outlets)
                }
        
        # Trends by location
        trends_by_location = {}
        for location in locations:
            loc_outlets = [outlet for outlet in filtered_outlets if outlet['Location'] == location]
            if loc_outlets:
                trends_by_location[location] = {
                    'Gallons_Collected': sum(outlet['Gallons_Collected'] for outlet in loc_outlets),
                    'Outlet_Name': len(loc_outlets),
                    'Risk_Score': sum(outlet['Risk_Score'] for outlet in loc_outlets) / len(loc_outlets)
                }
        
        exploration = {
            'filtered_data': filtered_outlets,
            'outlet_types': outlet_types,
            'locations': locations,
            'grades': ['A', 'B', 'C', 'D'],
            'top_outlets_by_volume': top_outlets_by_volume,
            'top_outlets_by_efficiency': top_outlets_by_efficiency,
            'outlets_by_missed_cleanings': outlets_by_missed_cleanings,
            'trends_by_outlet_type': trends_by_outlet_type,
            'trends_by_location': trends_by_location
        }
        
        return jsonify(exploration)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get predictions for Page 3"""
    try:
        # Generate mock predictions
        predictions = []
        for outlet in mock_outlets:
            prediction = {
                'Outlet_Name': outlet['Outlet_Name'],
                'Location': outlet['Location'],
                'Missed_Cleaning_Probability': random.uniform(0.1, 0.9),
                'Predicted_Volume': outlet['Gallons_Collected'] * random.uniform(0.8, 1.2),
                'Risk_Score': outlet['Risk_Score']
            }
            predictions.append(prediction)
        
        # Mock model accuracy
        model_accuracy = {
            'missed_cleaning': random.uniform(0.75, 0.95),
            'volume_prediction': random.uniform(0.70, 0.90)
        }
        
        # Mock feature importance
        feature_importance = {
            'missed_cleaning': {
                'Trap_Efficiency': random.uniform(0.2, 0.4),
                'Days_Since_Last_Cleaning': random.uniform(0.3, 0.5),
                'Total_Cleanings': random.uniform(0.1, 0.3),
                'Outlet_Type': random.uniform(0.05, 0.15),
                'Location': random.uniform(0.05, 0.15)
            },
            'volume_prediction': {
                'Trap_Efficiency': random.uniform(0.2, 0.4),
                'Total_Cleanings': random.uniform(0.3, 0.5),
                'Outlet_Type': random.uniform(0.1, 0.3),
                'Location': random.uniform(0.1, 0.3)
            }
        }
        
        # Monthly forecast
        monthly_forecast = {
            'next_month_gallons': sum(outlet['Gallons_Collected'] for outlet in mock_outlets) * random.uniform(0.9, 1.1),
            'next_month_services': len(mock_outlets) * random.uniform(0.9, 1.1),
            'high_risk_outlets_next_month': len([outlet for outlet in mock_outlets if outlet['Risk_Score'] > 70])
        }
        
        predictions_data = {
            'model_accuracy': model_accuracy,
            'feature_importance': feature_importance,
            'predictions': predictions,
            'monthly_forecast': monthly_forecast
        }
        
        return jsonify(predictions_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduling', methods=['GET'])
def get_scheduling():
    """Get inspection scheduling for Page 5"""
    try:
        # Get high-risk outlets for scheduling
        high_risk = [outlet for outlet in mock_outlets if outlet['Risk_Score'] > 70]
        high_risk = sorted(high_risk, key=lambda x: x['Risk_Score'], reverse=True)
        
        # Group by location for route optimization
        location_groups = {}
        for outlet in high_risk:
            loc = outlet['Location']
            if loc not in location_groups:
                location_groups[loc] = {
                    'Outlet_Name': 0,
                    'Risk_Score': 0,
                    'Gallons_Collected': 0
                }
            location_groups[loc]['Outlet_Name'] += 1
            location_groups[loc]['Risk_Score'] += outlet['Risk_Score']
            location_groups[loc]['Gallons_Collected'] += outlet['Gallons_Collected']
        
        # Calculate averages
        for loc in location_groups:
            location_groups[loc]['Risk_Score'] = round(location_groups[loc]['Risk_Score'] / location_groups[loc]['Outlet_Name'], 1)
        
        # Create weekly schedule
        weekly_schedule = []
        current_week = datetime.now()
        
        for i in range(4):  # 4 weeks
            week_start = current_week + timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)
            
            week_outlets = high_risk[i*10:(i+1)*10]  # Distribute outlets across weeks
            week_schedule = {
                'week': f"Week {i + 1}",
                'start_date': week_start.strftime('%Y-%m-%d'),
                'end_date': week_end.strftime('%Y-%m-%d'),
                'outlets': week_outlets
            }
            weekly_schedule.append(week_schedule)
        
        scheduling = {
            'weekly_schedule': weekly_schedule,
            'route_optimization': [{'Location': loc, **data} for loc, data in location_groups.items()],
            'total_inspections_planned': len(high_risk),
            'estimated_duration_weeks': 4,
            'high_priority_outlets': high_risk[:20]
        }
        
        return jsonify(scheduling)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot', methods=['POST'])
def chatbot_query():
    """Enhanced chatbot endpoint for Page 4"""
    try:
        data = request.json
        query = data.get('query', '').lower()
        
        # Business logic for different query types
        if 'revenue' in query and 'drop' in query:
            response = {
                'answer': "Revenue dropped from 125,000 to 118,000 in the last month. This could be due to:",
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
                
        elif 'zone' in query and ('visit' in query or 'inspector' in query):
            # Zone-based recommendations
            high_risk_zones = {
                'Al Quoz': {'Outlet_Name': 15, 'Risk_Score': 78.5},
                'Al Barsha': {'Outlet_Name': 12, 'Risk_Score': 75.2},
                'Al Karama': {'Outlet_Name': 10, 'Risk_Score': 72.8}
            }
            
            response = {
                'answer': "Based on risk analysis, the following zones need immediate inspector attention:",
                'high_risk_zones': high_risk_zones,
                'recommendations': [
                    "Zone Al Quoz: 15 outlets, avg risk score 78.5",
                    "Zone Al Barsha: 12 outlets, avg risk score 75.2",
                    "Zone Al Karama: 10 outlets, avg risk score 72.8"
                ],
                'action_items': [
                    "Schedule inspections for high-risk zones this week",
                    "Allocate additional inspectors to critical areas",
                    "Implement preventive maintenance programs"
                ]
            }
            
        elif 'missed cleaning' in query or 'inspection' in query:
            # Missed cleaning analysis
            missed_cleanings = [outlet for outlet in mock_outlets if outlet['Missed_Cleanings'] > 0]
            total_missed = len(missed_cleanings)
            
            response = {
                'answer': f"Current missed cleaning situation: {total_missed} outlets have missed cleanings.",
                'statistics': {
                    'total_missed_outlets': total_missed,
                    'avg_days_overdue': round(sum(outlet['Days_Since_Last_Cleaning'] for outlet in missed_cleanings) / len(missed_cleanings), 1),
                    'high_risk_missed': len([outlet for outlet in missed_cleanings if outlet['Risk_Score'] > 70])
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
                    f"Total outlets: {len(mock_outlets)}",
                    f"Average trap efficiency: {round(sum(outlet['Trap_Efficiency'] for outlet in mock_outlets) / len(mock_outlets), 1)}%",
                    f"Total gallons collected: {sum(outlet['Gallons_Collected'] for outlet in mock_outlets):,}",
                    f"High-risk outlets: {len([outlet for outlet in mock_outlets if outlet['Risk_Score'] > 70])}"
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
    print("🚀 Starting Blue Data Analytics Backend (Simple Version)...")
    print("✅ Backend ready! Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5001)
