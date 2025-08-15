"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertTriangle, Leaf, BarChart3, MapPin, Target, Clock } from "lucide-react";
import { KPIOverview } from "@/lib/types";
import { TrendChart } from "@/components/charts/TrendChart";
import { HotspotMap } from "@/components/maps/HotspotMap";

interface PortfolioItem {
  outlet_id: number;
  name: string;
  area: string;
  category: string;
  grade: string;
  p_miss_cleaning: number;
  forecast_volume_liters: number;
  next_due_date: string;
  risk_illegal_dump: number;
  lat: number;
  lon: number;
  shap_top3: Array<{ feature: string; impact: number }>;
}

// Generate the exact same schedule as reporting page
const generatePredictedSchedule = (portfolioItems: PortfolioItem[]): any => {
  // Dubai Mall coordinates - all inspectors start from here
  const DUBAI_MALL_DEPOT = { lat: 25.1972, lon: 55.2796 };
  
  const inspectors = [
    { id: 1, name: "Ahmed Al Mansouri" },
    { id: 2, name: "Fatima Al Zahra" },
    { id: 3, name: "Mohammed Hassan" },
    { id: 4, name: "Aisha Abdullah" }
  ];

  // Filter for RESTAURANTS ONLY as requested
  const restaurantOutlets = portfolioItems.filter(outlet => outlet.category === "Restaurant");
  

  // Generate 3 months of schedule data (April, May, June 2023)
  const calendar: any[] = [];
  const months = [
    { year: 2023, month: 4, name: "April" },   // April 2023
    { year: 2023, month: 5, name: "May" },     // May 2023
    { year: 2023, month: 6, name: "June" }     // June 2023
  ];

  let inspectorIndex = 0;
  
  months.forEach(monthData => {
    const daysInMonth = new Date(monthData.year, monthData.month, 0).getDate();
    
    // Create schedule for each day of the month (working days only - Mon-Fri)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthData.year, monthData.month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Assign inspector (rotate through all 4 inspectors)
      const inspector = inspectors[inspectorIndex % inspectors.length];
      inspectorIndex++;
      
      // Use dataset outlets systematically for this day (consistent allocation)
      const dailyOutletCount = 12; // Fixed 12 outlets per day for consistency
      const dayOffset = (day - 1) + (monthData.month - 4) * 30; // Deterministic offset based on date
      const startIndex = (dayOffset * dailyOutletCount) % restaurantOutlets.length;
      const dayOutlets = [];
      
      // Select outlets deterministically without duplication across close dates
      for (let i = 0; i < dailyOutletCount && dayOutlets.length < dailyOutletCount; i++) {
        const outletIndex = (startIndex + i) % restaurantOutlets.length;
        dayOutlets.push(restaurantOutlets[outletIndex]);
      }
      
      // Sort by risk priority (highest first)
      const sortedOutlets = dayOutlets.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning);
      
      // Create scheduled items with 24-hour format and 12-hour working day (08:00-20:00)
    const scheduledItems = sortedOutlets.map((outlet, index) => {
        // 12-hour working day: 08:00 to 20:00 (720 minutes total)
        // Each inspection takes ~45 minutes (including travel)
        const startMinute = 8 * 60 + (index * 45); // Start at 08:00, 45 min per inspection
        const endMinute = startMinute + 30; // 30 minutes for inspection itself
        
        const startHour = Math.floor(startMinute / 60);
        const startMin = startMinute % 60;
        const endHour = Math.floor(endMinute / 60);
        const endMin = endMinute % 60;
        
        // Ensure we don't go beyond 20:00 (8 PM)
        const actualStartHour = Math.min(startHour, 19);
        const actualEndHour = Math.min(endHour, 20);
      
      return {
          outlet_id: outlet.outlet_id,
          outlet_name: outlet.name,
          area: outlet.area,
          lat: outlet.lat,
          lon: outlet.lon,
          p_miss_cleaning: outlet.p_miss_cleaning,
          forecast_volume_liters: outlet.forecast_volume_liters,
          priority: (outlet.p_miss_cleaning > 0.7 ? "High" : outlet.p_miss_cleaning > 0.4 ? "Med" : "Low") as "High" | "Med" | "Low",
          grade: outlet.grade,
        scheduled_window: [
            `${actualStartHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
            `${actualEndHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
        ] as [string, string],
          ics_uid: `outlet-${outlet.outlet_id}-${dateString}`
      };
    });

    calendar.push({
        date: dateString,
        month: `${monthData.name} ${monthData.year}`,
      inspector_id: inspector.id,
      inspector_name: inspector.name,
      items: scheduledItems
    });
    }
  });

  // Extract unique areas from restaurant data (real areas from dataset)
  const uniqueAreas = Array.from(new Set(restaurantOutlets.map(item => item.area)))
    .map(area => {
      const areaItems = restaurantOutlets.filter(item => item.area === area);
      const avgLat = areaItems.reduce((sum, item) => sum + item.lat, 0) / areaItems.length;
      const avgLon = areaItems.reduce((sum, item) => sum + item.lon, 0) / areaItems.length;
      
      return {
        area,
        centroid: { lat: avgLat, lon: avgLon },
        polygon_geojson: {} as any
      };
    });

  

  return {
    period_start: "2023-04-01",
    period_end: "2023-06-30",
    run_id: `ml-predicted-3month-${new Date().toISOString()}`,
    calendar: calendar.sort((a, b) => a.date.localeCompare(b.date)),
    areas: uniqueAreas,
    ics_file_url: "/api/schedule/forecast/ml-predicted"
  };
};

// Generate realistic fluctuating trend data based on actual portfolio data
function generateTrendDataFromPortfolio(portfolioItems: PortfolioItem[]) {
  const trendData = [];
  const startDate = new Date('2023-01-01');
  
  // Calculate base metrics from real data
  const totalVolume = portfolioItems.reduce((sum, item) => sum + item.forecast_volume_liters, 0);
  const highRiskOutlets = portfolioItems.filter(item => item.p_miss_cleaning > 0.7);
  const mediumRiskOutlets = portfolioItems.filter(item => item.p_miss_cleaning > 0.4 && item.p_miss_cleaning <= 0.7);
  
  // Generate 12 weeks of realistic fluctuating data
  for (let week = 0; week < 12; week++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (week * 7));
    
    // Create realistic fluctuations based on business patterns
    const seasonalFactor = 1 + 0.2 * Math.sin((week / 12) * 2 * Math.PI); // Seasonal variation
    const weeklyVariation = 0.8 + 0.4 * ((week * 7 + 3) % 10) / 10; // Deterministic weekly fluctuation based on week number
    const riskImpact = 1 - (highRiskOutlets.length / portfolioItems.length) * 0.3; // Risk affects collection
    
    // Calculate weekly values with realistic business fluctuations
    const baseWeeklyVolume = totalVolume / 52;
    const actualVolume = baseWeeklyVolume * seasonalFactor * weeklyVariation * riskImpact;
    const forecastVolume = baseWeeklyVolume * seasonalFactor;
    
    // Add business events that cause spikes/dips
    let eventMultiplier = 1;
    if (week === 2) eventMultiplier = 1.4; // Holiday cleanup surge
    if (week === 5) eventMultiplier = 0.7; // Maintenance week
    if (week === 9) eventMultiplier = 1.3; // End of quarter push
    
    const finalActual = actualVolume * eventMultiplier;
    const finalForecast = forecastVolume;
    
    trendData.push({
      year: `Week ${week + 1} (${currentDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})`,
      grease_collected: Math.round(finalActual / 1000), // Convert to tons
      forecast: Math.round(finalForecast / 1000),
      upper_bound: Math.round(finalForecast * 1.15 / 1000),
      lower_bound: Math.round(finalForecast * 0.85 / 1000),
      anomaly: eventMultiplier !== 1 // Mark business events as anomalies
    });
  }
  
  return trendData;
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KPIOverview | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KPI data
        const kpiResponse = await fetch('/api/kpi/overview');
        const kpiResult = await kpiResponse.json();

        // Fetch portfolio data for map
        const portfolioResponse = await fetch('/api/predictions/portfolio'); // Get ALL data
        const portfolioResult = await portfolioResponse.json();

        if (kpiResult.success) {
          setKpiData(kpiResult.data);
        } else {
          setError('Failed to fetch KPI data');
        }

        if (portfolioResult.success) {
          const portfolioItems = portfolioResult.data.items || [];
          setPortfolioData(portfolioItems);
          
          // Generate the exact same schedule data as reporting page
          const schedule = generatePredictedSchedule(portfolioItems);
          setScheduleData(schedule);
          
          // Generate trend data from portfolio data
          const trendDataGenerated = generateTrendDataFromPortfolio(portfolioItems);
          setTrendData(trendDataGenerated);
        }


      } catch (err) {
        setError('Error connecting to API');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading KPI data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !kpiData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-muted-foreground">{error || 'No data available'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const revenueChange = kpiData.revenue_change_pct;
  const isRevenuePositive = revenueChange >= 0;
  const forecastAccuracy = Math.abs((kpiData.grease_collected_tons - kpiData.forecast_tons) / kpiData.forecast_tons * 100);

  return (
    <MainLayout
      period={kpiData.period}
      run_id={kpiData.run_id}
      model_version={kpiData.model_version}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Inspection Management Dashboard
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Real-time inspection status, risk analysis, and insights for inspectors and auditors
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grease Collected</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{kpiData.grease_collected_tons.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                vs {kpiData.forecast_tons.toLocaleString()} forecast
              </p>
              <div className="mt-2">
                <Progress
                  value={Math.min((kpiData.grease_collected_tons / kpiData.forecast_tons) * 100, 100)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Inspections</CardTitle>
              <Target className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {portfolioData.filter(item => item.p_miss_cleaning > 0.8).length}
              </div>
              <p className="text-xs text-muted-foreground">extremely high risk (&gt;80%) requiring immediate action</p>
              <div className="mt-2 text-xs text-red-500">
                +{portfolioData.filter(item => item.p_miss_cleaning > 0.7 && item.p_miss_cleaning <= 0.8).length} high risk (&gt;70%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missed Cleanings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{kpiData.missed_cleanings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Inspections</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {scheduleData?.calendar ? 
                  scheduleData.calendar.reduce((sum: number, day: any) => sum + day.items.length, 0) : 
                  0
                }
              </div>
              <p className="text-xs text-muted-foreground">total scheduled inspections</p>
              <div className="mt-2 text-xs text-orange-500">
                {(() => {
                  // Count items that should have been done before the schedule period
                  const scheduleStart = new Date('2023-04-01');
                  
                  // Filter for restaurants only (same as reporting page)
                  const restaurantOutlets = portfolioData.filter(outlet => outlet.category === "Restaurant");
                  
                  return restaurantOutlets.filter(item => {
                    const dueDate = new Date(item.next_due_date);
                    return dueDate < scheduleStart;
                  }).length;
                })()} pre-schedule items
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{(100 - forecastAccuracy).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">prediction accuracy</p>
              <div className="mt-2">
                <Progress value={100 - forecastAccuracy} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Illegal Dump Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {portfolioData.filter(item => item.risk_illegal_dump > 0.6).length}
              </div>
              <p className="text-xs text-muted-foreground">high illegal dump risk outlets</p>
              <div className="mt-2 text-xs text-orange-500">
                {kpiData.illegal_dump_alerts} active alerts
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">First Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {scheduleData?.calendar ? 
                  scheduleData.calendar
                    .filter((day: any) => {
                      const dayDate = new Date(day.date);
                      const firstWeekEnd = new Date('2023-04-07');
                      return dayDate <= firstWeekEnd;
                    })
                    .reduce((sum: number, day: any) => sum + day.items.length, 0) : 
                  0
                }
              </div>
              <p className="text-xs text-muted-foreground">first week of schedule (Apr 1-7)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-3">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm py-2 sm:py-3">Trends</TabsTrigger>
            <TabsTrigger value="risks" className="text-xs sm:text-sm py-2 sm:py-3">Risk Analysis</TabsTrigger>
            <TabsTrigger value="geographic" className="text-xs sm:text-sm py-2 sm:py-3">Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>
                    Key metrics and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Grease Collection Target</span>
                    <Badge variant="outline">
                      {((kpiData.grease_collected_tons / kpiData.forecast_tons) * 100).toFixed(1)}% Achieved
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Inspection Coverage</span>
                    <Badge variant="default">
                      {((portfolioData.length - kpiData.missed_cleanings) / portfolioData.length * 100).toFixed(1)}% Complete
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Critical Risk Level</span>
                    <Badge variant={portfolioData.filter(item => item.p_miss_cleaning > 0.8).length > 50 ? 'destructive' : portfolioData.filter(item => item.p_miss_cleaning > 0.8).length > 20 ? 'secondary' : 'default'}>
                      {portfolioData.filter(item => item.p_miss_cleaning > 0.8).length > 50 ? 'High' : 
                       portfolioData.filter(item => item.p_miss_cleaning > 0.8).length > 20 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Outlets Monitored</span>
                    <Badge variant="outline">
                      {portfolioData.length.toLocaleString()} / {(kpiData as any).total_outlets?.toLocaleString() || portfolioData.length.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Environmental Impact</span>
                    <Badge variant="default" className="bg-green-600">
                      {(kpiData.co2_saved_kg / 1000).toFixed(1)} tons CO₂ saved
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-red-50 border border-red-200 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">High Priority Inspections</span>
                    </div>
                    <Badge variant="destructive">
                      {portfolioData.filter(item => item.p_miss_cleaning > 0.7).length}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Due This Week</span>
                    </div>
                    <Badge variant="secondary">
                      {scheduleData?.calendar ? 
                        scheduleData.calendar
                          .filter((day: any) => {
                            const dayDate = new Date(day.date);
                            const firstWeekEnd = new Date('2023-04-07');
                            return dayDate <= firstWeekEnd;
                          })
                          .reduce((sum: number, day: any) => sum + day.items.length, 0) : 
                        0
                      }
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Route Optimization</span>
                    </div>
                    <Badge variant="outline">
                      {portfolioData.length > 0 ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends (2023)</CardTitle>
                <CardDescription>
                  3-month performance analysis with weekly intervals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart 
                  data={trendData}
                  title="Trend Analysis"
                  description="Weekly grease collection analysis based on portfolio forecasts"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>High Risk Outlets</CardTitle>
                  <CardDescription>
                    Top outlets requiring immediate inspection attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioData
                      .sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning)
                      .slice(0, 8).map((outlet, index) => (
                      <div key={outlet.outlet_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/30 rounded-lg gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            outlet.p_miss_cleaning > 0.7 ? 'bg-red-500' : 
                            outlet.p_miss_cleaning > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{outlet.name}</p>
                            <p className="text-xs text-muted-foreground">{outlet.area} • {outlet.category}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`text-sm font-bold ${
                            outlet.p_miss_cleaning > 0.7 ? 'text-red-600' : 
                            outlet.p_miss_cleaning > 0.4 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {(outlet.p_miss_cleaning * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">risk</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution by Grade</CardTitle>
                  <CardDescription>
                    Inspection risk breakdown across facility grades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['A', 'B', 'C', 'D'].map((grade) => {
                      const gradeData = portfolioData.filter(outlet => outlet.grade === grade);
                      const avgRisk = gradeData.length > 0 ? 
                        gradeData.reduce((sum, outlet) => sum + outlet.p_miss_cleaning, 0) / gradeData.length : 0;
                      const count = gradeData.length;
                      
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-sm font-medium">Grade {grade}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{count} outlets</span>
                              <span className={`text-sm font-bold ${
                                avgRisk > 0.7 ? 'text-red-600' : 
                                avgRisk > 0.4 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {(avgRisk * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                avgRisk > 0.7 ? 'bg-red-500' : 
                                avgRisk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${avgRisk * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution by Area</CardTitle>
                  <CardDescription>
                    Inspection grades across different areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(portfolioData.map(outlet => outlet.area))).slice(0, 8).map((area) => {
                      const areaOutlets = portfolioData.filter(outlet => outlet.area === area);
                      const gradeDistribution = ['A', 'B', 'C', 'D'].map(grade => ({
                        grade,
                        count: areaOutlets.filter(outlet => outlet.grade === grade).length,
                        percentage: (areaOutlets.filter(outlet => outlet.grade === grade).length / areaOutlets.length) * 100
                      }));
                      
                      return (
                        <div key={area} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-sm font-medium">{area}</span>
                            <span className="text-xs text-muted-foreground">{areaOutlets.length} outlets</span>
                          </div>
                          <div className="flex w-full h-4 rounded-full overflow-hidden bg-muted/30">
                            {gradeDistribution.map(({ grade, percentage }) => (
                              <div
                                key={grade}
                                className={`h-full ${
                                  grade === 'A' ? 'bg-green-500' :
                                  grade === 'B' ? 'bg-blue-500' :
                                  grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                                title={`Grade ${grade}: ${percentage.toFixed(0)}%`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap justify-between text-xs text-muted-foreground gap-2">
                            {gradeDistribution.map(({ grade, count }) => (
                              <span key={grade} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  grade === 'A' ? 'bg-green-500' :
                                  grade === 'B' ? 'bg-blue-500' :
                                  grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                {grade}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hotspot Map</CardTitle>
                  <CardDescription>
                    Missed cleaning density visualization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HotspotMap 
                    data={portfolioData.map(item => ({
                      id: item.outlet_id,
                      name: item.name,
                      lat: item.lat,
                      lon: item.lon,
                      risk_score: item.p_miss_cleaning,
                      grade: item.grade,
                      area: item.area,
                      category: item.category,
                      p_miss_cleaning: item.p_miss_cleaning,
                      next_due_date: item.next_due_date
                    }))}
                    title="Risk Hotspots"
                    description="Real-time outlet locations with missed cleaning risk"
                    height={400}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
