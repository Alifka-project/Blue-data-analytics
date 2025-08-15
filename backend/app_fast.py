from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Generate mock data instantly
def generate_fast_data():
    outlets = []
    types = ["Restaurant", "Hotel", "Cafe"]
    locations = ["Al Quoz", "Al Barsha", "Al Karama"]
    
    for i in range(50):  # Smaller dataset for speed
        outlets.append({
            "Outlet_Name": f"Outlet_{i+1}",
            "Outlet_Type": random.choice(types),
            "Location": random.choice(locations),
            "Gallons_Collected": random.randint(1000, 8000),
            "Trap_Efficiency": random.randint(65, 90),
            "Total_Cleanings": random.randint(2, 15),
            "Missed_Cleanings": random.randint(0, 3),
            "Days_Since_Last_Cleaning": random.randint(5, 60),
            "Risk_Score": random.randint(25, 85),
            "Revenue": random.randint(800, 4000)
        })
    return outlets

# Pre-generate data
data = generate_fast_data()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "timestamp": datetime.now().isoformat()})

@app.route('/api/data/summary', methods=['GET'])
def summary():
    return jsonify({
        "total_outlets": len(data),
        "total_gallons": sum(o["Gallons_Collected"] for o in data),
        "total_services": sum(o["Total_Cleanings"] for o in data),
        "avg_trap_efficiency": round(sum(o["Trap_Efficiency"] for o in data) / len(data), 1),
        "high_risk_outlets": len([o for o in data if o["Risk_Score"] > 70]),
        "total_revenue": sum(o["Revenue"] for o in data),
        "monthly_gallons": {"2024-01": 45000, "2024-02": 48000, "2024-03": 52000},
        "monthly_services": {"2024-01": 450, "2024-02": 480, "2024-03": 520},
        "top_risk_outlets": sorted(data, key=lambda x: x["Risk_Score"], reverse=True)[:5],
        "location_breakdown": {
            "Al Quoz": {"Gallons_Collected": 150000, "Total_Cleanings": 150, "Outlet_Name": 20},
            "Al Barsha": {"Gallons_Collected": 120000, "Total_Cleanings": 120, "Outlet_Name": 15},
            "Al Karama": {"Gallons_Collected": 100000, "Total_Cleanings": 100, "Outlet_Name": 15}
        }
    })

@app.route('/api/data/exploration', methods=['GET'])
def exploration():
    return jsonify({
        "filtered_data": data,
        "outlet_types": ["Restaurant", "Hotel", "Cafe"],
        "locations": ["Al Quoz", "Al Barsha", "Al Karama"],
        "grades": ["A", "B", "C"],
        "top_outlets_by_volume": sorted(data, key=lambda x: x["Gallons_Collected"], reverse=True)[:10],
        "top_outlets_by_efficiency": sorted(data, key=lambda x: x["Trap_Efficiency"], reverse=True)[:10],
        "outlets_by_missed_cleanings": sorted(data, key=lambda x: x["Missed_Cleanings"], reverse=True)[:10],
        "trends_by_outlet_type": {
            "Restaurant": {"Gallons_Collected": 3500, "Trap_Efficiency": 78, "Total_Cleanings": 8},
            "Hotel": {"Gallons_Collected": 4200, "Trap_Efficiency": 82, "Total_Cleanings": 10},
            "Cafe": {"Gallons_Collected": 2800, "Trap_Efficiency": 75, "Total_Cleanings": 6}
        },
        "trends_by_location": {
            "Al Quoz": {"Gallons_Collected": 150000, "Outlet_Name": 20, "Risk_Score": 72},
            "Al Barsha": {"Gallons_Collected": 120000, "Outlet_Name": 15, "Risk_Score": 68},
            "Al Karama": {"Gallons_Collected": 100000, "Outlet_Name": 15, "Risk_Score": 65}
        }
    })

@app.route('/api/predictions', methods=['GET'])
def predictions():
    return jsonify({
        "model_accuracy": {"missed_cleaning": 0.87, "volume_prediction": 0.82},
        "feature_importance": {
            "missed_cleaning": {"Trap_Efficiency": 0.35, "Days_Since_Last_Cleaning": 0.42, "Total_Cleanings": 0.23},
            "volume_prediction": {"Trap_Efficiency": 0.38, "Total_Cleanings": 0.45, "Outlet_Type": 0.17}
        },
        "predictions": [{"Outlet_Name": o["Outlet_Name"], "Location": o["Location"], "Missed_Cleaning_Probability": random.uniform(0.1, 0.8), "Predicted_Volume": o["Gallons_Collected"] * random.uniform(0.9, 1.1), "Risk_Score": o["Risk_Score"]} for o in data[:20]],
        "monthly_forecast": {"next_month_gallons": 180000, "next_month_services": 180, "high_risk_outlets_next_month": 12}
    })

@app.route('/api/scheduling', methods=['GET'])
def scheduling():
    high_risk = [o for o in data if o["Risk_Score"] > 70][:20]
    return jsonify({
        "weekly_schedule": [
            {"week": "Week 1", "start_date": "2024-01-15", "end_date": "2024-01-21", "outlets": high_risk[:5]},
            {"week": "Week 2", "start_date": "2024-01-22", "end_date": "2024-01-28", "outlets": high_risk[5:10]},
            {"week": "Week 3", "start_date": "2024-01-29", "end_date": "2024-02-04", "outlets": high_risk[10:15]},
            {"week": "Week 4", "start_date": "2024-02-05", "end_date": "2024-02-11", "outlets": high_risk[15:20]}
        ],
        "route_optimization": [
            {"Location": "Al Quoz", "Outlet_Name": 8, "Risk_Score": 75.5, "Gallons_Collected": 120000},
            {"Location": "Al Barsha", "Outlet_Name": 6, "Risk_Score": 72.3, "Gallons_Collected": 90000},
            {"Location": "Al Karama", "Outlet_Name": 6, "Risk_Score": 70.8, "Gallons_Collected": 75000}
        ],
        "total_inspections_planned": len(high_risk),
        "estimated_duration_weeks": 4,
        "high_priority_outlets": high_risk
    })

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    query = request.json.get('query', '').lower()
    
    if 'revenue' in query and 'drop' in query:
        return jsonify({
            'answer': "Revenue dropped from 125K to 118K last month due to:",
            'reasons': ["Seasonal fluctuations", "Reduced service frequency", "Economic factors"],
            'recommendations': ["Increase marketing", "Review pricing", "Loyalty programs"]
        })
    elif 'zone' in query:
        return jsonify({
            'answer': "High-risk zones needing attention:",
            'high_risk_zones': {
                'Al Quoz': {'Outlet_Name': 8, 'Risk_Score': 75.5},
                'Al Barsha': {'Outlet_Name': 6, 'Risk_Score': 72.3}
            },
            'recommendations': ["Schedule inspections", "Allocate inspectors", "Preventive maintenance"],
            'action_items': ["Visit Al Quoz this week", "Focus on high-risk outlets"]
        })
    else:
        return jsonify({
            'answer': "Key business insights:",
            'insights': [f"Total outlets: {len(data)}", "Avg efficiency: 78%", "High-risk: 12 outlets"],
            'recommendations': ["Focus on efficiency", "Preventive maintenance", "Resource optimization"]
        })

if __name__ == '__main__':
    print("🚀 Starting FAST Blue Data Backend...")
    print("✅ Ready in 0.1 seconds!")
    app.run(debug=False, host='0.0.0.0', port=5001)


