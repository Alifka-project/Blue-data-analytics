// Mock data for Blue Data Analytics Dashboard
export const mockInsightsData = {
  service_performance: {
    total_services: 29945,
    total_gallons_collected: 1671702,
    service_efficiency_score: 0.721,
    average_service_duration: 0.4,
    trap_efficiency: 55.8
  },
  customer_behavior: {
    total_customers: 3314,
    customer_retention_rate: 0.97,
    high_value_customers: 593,
    avg_customer_value_gallons: 504,
    repeat_customers: 3214,
    services_per_customer: 9.0,
    avg_services_per_customer: 9.0
  },
  product_performance: {
    top_performing_category: "Restaurant",
    category_breakdown: {
      "Restaurant": {
        Service_Count: 14500,
        Total_Gallons: 810000,
        Unique_Customers: 1600,
        Avg_Gallons: 55.9,
        Avg_Traps: 2.1
      },
      "Accommodation": {
        Service_Count: 7500,
        Total_Gallons: 420000,
        Unique_Customers: 850,
        Avg_Gallons: 56.0,
        Avg_Traps: 2.0
      },
      "Cafeteria": {
        Service_Count: 4500,
        Total_Gallons: 250000,
        Unique_Customers: 500,
        Avg_Gallons: 55.6,
        Avg_Traps: 2.2
      }
    }
  },
  geographic_analysis: {
    total_regions: 23,
    area_breakdown: {
      "Al Quoz": {
        Total_Gallons: 451000,
        Unique_Customers: 150,
        Service_Count: 500,
        Avg_Gallons: 3007,
        Avg_Traps: 2.1
      },
      "Al Barsha": {
        Total_Gallons: 300000,
        Unique_Customers: 120,
        Service_Count: 400,
        Avg_Gallons: 2500,
        Avg_Traps: 2.0
      },
      "Al Karama": {
        Total_Gallons: 225000,
        Unique_Customers: 90,
        Service_Count: 300,
        Avg_Gallons: 2500,
        Avg_Traps: 2.1
      },
      "Al Garhoud": {
        Total_Gallons: 180000,
        Unique_Customers: 75,
        Service_Count: 250,
        Avg_Gallons: 2400,
        Avg_Traps: 2.0
      },
      "Al Qudra": {
        Total_Gallons: 150000,
        Unique_Customers: 60,
        Service_Count: 200,
        Avg_Gallons: 2500,
        Avg_Traps: 2.1
      },
      "Al Maktoum": {
        Total_Gallons: 120000,
        Unique_Customers: 50,
        Service_Count: 180,
        Avg_Gallons: 2400,
        Avg_Traps: 2.0
      },
      "Al Wasl": {
        Total_Gallons: 100000,
        Unique_Customers: 40,
        Service_Count: 150,
        Avg_Gallons: 2500,
        Avg_Traps: 2.1
      },
      "Al Safa": {
        Total_Gallons: 80000,
        Unique_Customers: 35,
        Service_Count: 120,
        Avg_Gallons: 2286,
        Avg_Traps: 2.0
      },
      "Al Hudaiba": {
        Total_Gallons: 70000,
        Unique_Customers: 30,
        Service_Count: 100,
        Avg_Gallons: 2333,
        Avg_Traps: 2.1
      },
      "Al Jumeirah": {
        Total_Gallons: 60000,
        Unique_Customers: 25,
        Service_Count: 80,
        Avg_Gallons: 2400,
        Avg_Traps: 2.0
      }
    }
  },
  temporal_analysis: {
    monthly_pattern: [
      { month: "January", gallons: 500000, services: 3000, efficiency: 72 },
      { month: "February", gallons: 450000, services: 2800, efficiency: 72 },
      { month: "March", gallons: 480000, services: 2900, efficiency: 72 },
      { month: "April", gallons: 520000, services: 3100, efficiency: 73 },
      { month: "May", gallons: 490000, services: 2950, efficiency: 72 },
      { month: "June", gallons: 510000, services: 3050, efficiency: 73 },
      { month: "July", gallons: 530000, services: 3150, efficiency: 74 },
      { month: "August", gallons: 550000, services: 3250, efficiency: 75 },
      { month: "September", gallons: 540000, services: 3200, efficiency: 74 },
      { month: "October", gallons: 560000, services: 3300, efficiency: 75 },
      { month: "November", gallons: 580000, services: 3400, efficiency: 76 },
      { month: "December", gallons: 570000, services: 3350, efficiency: 75 }
    ]
  },
  operational_efficiency: {
    peak_day: "Tuesday",
    peak_hours: "10:00-14:00",
    avg_service_duration: 0.4,
    efficiency_score: 0.721
  }
};

export const mockPredictionsData = {
  customer_behavior: {
    accuracy: 0.903,
    precision: 0.89,
    recall: 0.91,
    f1_score: 0.90,
    feature_importance: {
      Customer_Value: 0.45,
      Service_Frequency: 0.32,
      Seasonal_Factor: 0.28,
      Month: 0.35
    }
  },
  sales_forecasting: {
    r2_score: 0.852,
    mae: 0.12,
    rmse: 0.18,
    forecast_6months: {
      month_1: 1850000,
      month_2: 1920000,
      month_3: 1980000,
      month_4: 2050000,
      month_5: 2120000,
      month_6: 2200000
    }
  },
  regional_expansion: {
    accuracy: 0.92,
    recommended_regions: ["Al Qudra", "Al Garhoud", "Al Maktoum"],
    expansion_potential: 0.25
  },
  operational_efficiency: {
    accuracy: 0.88,
    predicted_improvement: 0.15,
    cost_savings: 125000
  }
};

export const mockBusinessInsights = {
  strategic_recommendations: [
    {
      id: 1,
      category: "Revenue Growth",
      title: "Focus on Restaurant Services in Al Quoz",
      description: "Restaurant category shows 48.5% market concentration with highest revenue potential",
      impact: "High",
      priority: "Immediate"
    },
    {
      id: 2,
      category: "Customer Retention",
      title: "Leverage 97% Retention Rate for Expansion",
      description: "Exceptional customer retention indicates strong service quality and loyalty",
      impact: "High",
      priority: "High"
    },
    {
      id: 3,
      category: "Operational Efficiency",
      title: "Optimize Tuesday Operations",
      description: "Tuesday shows peak performance - allocate more resources during this period",
      impact: "Medium",
      priority: "Medium"
    }
  ],
  key_metrics: {
    revenue_growth: 0.153,
    customer_retention: 0.97,
    service_efficiency: 0.721,
    market_expansion: 0.25
  },
  market_opportunities: [
    {
      region: "Al Qudra",
      potential: 0.35,
      investment_required: 50000,
      expected_roi: 0.28
    },
    {
      region: "Al Garhoud",
      potential: 0.28,
      investment_required: 35000,
      expected_roi: 0.22
    }
  ]
};
