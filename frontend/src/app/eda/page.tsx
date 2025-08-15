"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, MapPin, AlertTriangle, Filter, Download } from "lucide-react";
import { DistributionChart } from "@/components/charts/DistributionChart";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import { HotspotMap } from "@/components/maps/HotspotMap";

interface EDAData {
  period: string;
  total_records: number;
  total_outlets: number;
  areas: Record<string, number>;
  categories: Record<string, number>;
  grades: Record<string, number>;
  coordinate_coverage: {
    has_coordinates: boolean;
    lat_range: [number, number];
    lon_range: [number, number];
  };
}

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

export default function EDAPage() {
  const [edaData, setEdaData] = useState<EDAData | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filters
  const [filters, setFilters] = useState({
    area: 'all',
    category: 'all',
    grade: 'all'
  });

  useEffect(() => {
    const fetchEDAData = async () => {
      try {
        // Fetch portfolio data for map and real stats
        const portfolioResponse = await fetch('/api/predictions/portfolio'); // Get ALL data
        const portfolioResult = await portfolioResponse.json();

        if (portfolioResult.success) {
          setPortfolioData(portfolioResult.data.items || []);
        }

        // Generate real EDA data from portfolio data
        if (portfolioResult.success && portfolioResult.data.items) {
          const items = portfolioResult.data.items;
          
          // Calculate real distributions
          const areaDistribution: Record<string, number> = {};
          const categoryDistribution: Record<string, number> = {};
          const gradeDistribution: Record<string, number> = {};
          
          items.forEach((item: any) => {
            areaDistribution[item.area] = (areaDistribution[item.area] || 0) + 1;
            categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
            gradeDistribution[item.grade] = (gradeDistribution[item.grade] || 0) + 1;
          });
          
          // Calculate coordinate ranges from real data
          const lats = items.map((item: any) => item.lat).filter((lat: any) => lat != null);
          const lons = items.map((item: any) => item.lon).filter((lon: any) => lon != null);
          
          const realEDAData: EDAData = {
            period: portfolioResult.data.period || "2023-03",
            total_records: items.length,
            total_outlets: items.length,
            areas: areaDistribution,
            categories: categoryDistribution,
            grades: gradeDistribution,
            coordinate_coverage: {
              has_coordinates: lats.length > 0 && lons.length > 0,
              lat_range: lats.length > 0 ? [Math.min(...lats), Math.max(...lats)] : [0, 0],
              lon_range: lons.length > 0 ? [Math.min(...lons), Math.max(...lons)] : [0, 0]
            }
          };
          
          setEdaData(realEDAData);
        }
      } catch (err) {
        setError('Error loading EDA data');
      } finally {
        setLoading(false);
      }
    };

    fetchEDAData();
  }, []);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort portfolio data
  const filteredPortfolioData = portfolioData
    .filter(item => {
      if (filters.area !== 'all' && item.area !== filters.area) return false;
      if (filters.category !== 'all' && item.category !== filters.category) return false;
      if (filters.grade !== 'all' && item.grade !== filters.grade) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'area':
          aValue = a.area.toLowerCase();
          bValue = b.area.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'grade':
          aValue = a.grade;
          bValue = b.grade;
          break;
        case 'risk':
          aValue = a.p_miss_cleaning;
          bValue = b.p_miss_cleaning;
          break;
        case 'forecast':
          aValue = a.forecast_volume_liters;
          bValue = b.forecast_volume_liters;
          break;
        case 'next_due':
          aValue = new Date(a.next_due_date);
          bValue = new Date(b.next_due_date);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading EDA data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !edaData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading EDA</h2>
            <p className="text-muted-foreground">{error || 'No data available'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout period={edaData.period}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Data Exploration & Analysis
          </h1>
          <p className="text-muted-foreground text-lg">

          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{edaData.total_records.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">data points analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Outlets</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{edaData.total_outlets.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">service locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Areas Covered</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(edaData.areas).length}</div>
              <p className="text-xs text-muted-foreground">geographic zones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coordinates</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {portfolioData.filter(item => item.lat && item.lon).length.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                outlets with coordinates from dataset
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Data Filters
            </CardTitle>
            <CardDescription>
              Filter data by area, category, and grade to analyze specific segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.area} onValueChange={(value) => setFilters(prev => ({ ...prev, area: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {Array.from(new Set(portfolioData.map(item => item.area))).map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(portfolioData.map(item => item.category))).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.grade} onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {['A', 'B', 'C', 'D'].map(grade => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ area: 'all', category: 'all', grade: 'all' })}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Badge variant="secondary">
                  {filteredPortfolioData.length} outlets
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analysis Tabs */}
        <Tabs defaultValue="distributions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="spatial">Spatial Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
          </TabsList>

          <TabsContent value="distributions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Area Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Outlet Distribution by Area</CardTitle>
                  <CardDescription>
                    Geographic distribution of service locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionChart
                    data={Array.from(new Set(filteredPortfolioData.map(item => item.area))).map(area => ({
                      name: area,
                      value: filteredPortfolioData.filter(item => item.area === area).length
                    }))}
                    title="Outlet Distribution by Area (Filtered)"
                    description="Geographic distribution of service locations"
                  />
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Outlet Distribution by Category</CardTitle>
                  <CardDescription>
                    Business type distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionChart
                    data={Array.from(new Set(filteredPortfolioData.map(item => item.category))).map(category => ({
                      name: category,
                      value: filteredPortfolioData.filter(item => item.category === category).length
                    }))}
                    title="Outlet Distribution by Category (Filtered)"
                    description="Business type distribution"
                  />
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Grade Distribution</CardTitle>
                  <CardDescription>
                    Risk-based grading across all outlets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionChart
                    data={Object.entries(edaData.grades).map(([name, value]) => ({ name, value }))}
                    title="Performance Grade Distribution"
                    description="Risk-based grading across all outlets"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk vs Grade Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk vs Grade Analysis</CardTitle>
                  <CardDescription>
                    Relationship between outlet grades and risk levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['A', 'B', 'C', 'D'].map(grade => {
                      const gradeData = filteredPortfolioData.filter(item => item.grade === grade);
                      const avgRisk = gradeData.length > 0 ? 
                        gradeData.reduce((sum, item) => sum + item.p_miss_cleaning, 0) / gradeData.length : 0;
                      const maxRisk = gradeData.length > 0 ? Math.max(...gradeData.map(item => item.p_miss_cleaning)) : 0;
                      const minRisk = gradeData.length > 0 ? Math.min(...gradeData.map(item => item.p_miss_cleaning)) : 0;
                      
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Grade {grade}</span>
                            <div className="text-sm text-muted-foreground">
                              {gradeData.length} outlets | Avg: {(avgRisk * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-muted/30 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${
                                  avgRisk > 0.7 ? 'bg-red-500' : 
                                  avgRisk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${avgRisk * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Min: {(minRisk * 100).toFixed(0)}%</span>
                              <span>Max: {(maxRisk * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Category vs Volume Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Category vs Forecast Volume</CardTitle>
                  <CardDescription>
                    Predicted volume patterns by business category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(filteredPortfolioData.map(item => item.category))).slice(0, 6).map(category => {
                      const categoryData = filteredPortfolioData.filter(item => item.category === category);
                      const avgVolume = categoryData.length > 0 ? 
                        categoryData.reduce((sum, item) => sum + item.forecast_volume_liters, 0) / categoryData.length : 0;
                      const maxVolume = Math.max(...filteredPortfolioData.map(item => item.forecast_volume_liters));
                      const percentage = (avgVolume / maxVolume) * 100;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{category}</span>
                            <div className="text-sm text-muted-foreground">
                              {avgVolume.toLocaleString()} L avg
                            </div>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Area Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Area Risk Patterns</CardTitle>
                  <CardDescription>
                    Risk distribution across geographic areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(filteredPortfolioData.map(item => item.area))).slice(0, 8).map(area => {
                      const areaData = filteredPortfolioData.filter(item => item.area === area);
                      const highRisk = areaData.filter(item => item.p_miss_cleaning > 0.7).length;
                      const mediumRisk = areaData.filter(item => item.p_miss_cleaning > 0.4 && item.p_miss_cleaning <= 0.7).length;
                      const lowRisk = areaData.length - highRisk - mediumRisk;
                      
                      return (
                        <div key={area} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{area}</span>
                            <span className="text-xs text-muted-foreground">{areaData.length} outlets</span>
                          </div>
                          <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted/30">
                            <div className="bg-green-500" style={{ width: `${(lowRisk / areaData.length) * 100}%` }} />
                            <div className="bg-yellow-500" style={{ width: `${(mediumRisk / areaData.length) * 100}%` }} />
                            <div className="bg-red-500" style={{ width: `${(highRisk / areaData.length) * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="text-green-600">Low: {lowRisk}</span>
                            <span className="text-yellow-600">Med: {mediumRisk}</span>
                            <span className="text-red-600">High: {highRisk}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Coordinate Coverage Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>📍 Geographic Coverage</CardTitle>
                  <CardDescription>
                    Coordinate distribution and coverage analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Coverage Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredPortfolioData.length}
                        </div>
                        <div className="text-sm text-blue-600">hotspots</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {filteredPortfolioData.filter(item => item.p_miss_cleaning > 0.7).length}
                        </div>
                        <div className="text-sm text-red-600">high risk</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Array.from(new Set(filteredPortfolioData.map(item => item.area))).length}
                        </div>
                        <div className="text-sm text-green-600">areas covered</div>
                      </div>
                    </div>

                    {/* Geographic Map Visualization */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-96">
                        <HotspotMap 
                          data={filteredPortfolioData.map(item => ({
                            id: item.outlet_id,
                            outlet_id: item.outlet_id,
                            name: item.name,
                            area: item.area,
                            category: item.category,
                            lat: item.lat,
                            lon: item.lon,
                            p_miss_cleaning: item.p_miss_cleaning,
                            risk_score: item.p_miss_cleaning,
                            next_due_date: item.next_due_date,
                            grade: item.grade
                          }))}
                          title="📍 All Outlet Locations"
                          description="Geographic distribution with risk-based color coding"
                          height={384}
                        />
                      </div>
                    </div>
                    
                    {/* Coordinate Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center">
                          🌐 Latitude Range
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {filteredPortfolioData.length > 0 ? 
                            `${Math.min(...filteredPortfolioData.map(item => item.lat)).toFixed(4)}° to ${Math.max(...filteredPortfolioData.map(item => item.lat)).toFixed(4)}°` 
                            : 'No data available'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Span: {filteredPortfolioData.length > 0 ? 
                            (Math.max(...filteredPortfolioData.map(item => item.lat)) - 
                             Math.min(...filteredPortfolioData.map(item => item.lat))).toFixed(4) + '°' 
                            : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center">
                          🌐 Longitude Range
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {filteredPortfolioData.length > 0 ? 
                            `${Math.min(...filteredPortfolioData.map(item => item.lon)).toFixed(4)}° to ${Math.max(...filteredPortfolioData.map(item => item.lon)).toFixed(4)}°` 
                            : 'No data available'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Span: {filteredPortfolioData.length > 0 ? 
                            (Math.max(...filteredPortfolioData.map(item => item.lon)) - 
                             Math.min(...filteredPortfolioData.map(item => item.lon))).toFixed(4) + '°' 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Risk Legend */}
                    <div className="flex items-center justify-center gap-6 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Low Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Medium Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-sm">High Risk</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Click on hotspots for details
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="spatial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spatial Heatmap</CardTitle>
                <CardDescription>
                  Missed cleaning density visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HotspotMap 
                  data={filteredPortfolioData.map(item => ({
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
                  title="Spatial Distribution (Filtered)"
                  description="Geographic distribution with filtering - Focus on Restaurant category for inspection risk selection"
                  height={400}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Volume Collection Waterfall Analysis</CardTitle>
                <CardDescription>
                  Collection efficiency breakdown by risk category and grade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Risk Category Performance */}
                  <div>
                    <h4 className="font-semibold mb-3">Risk Category Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-red-800 font-semibold">High Risk (&gt;70%)</div>
                        <div className="text-2xl font-bold text-red-600">
                          {filteredPortfolioData.filter(item => item.p_miss_cleaning > 0.7).length.toLocaleString()}
                        </div>
                        <div className="text-sm text-red-600">
                          {(filteredPortfolioData.filter(item => item.p_miss_cleaning > 0.7)
                            .reduce((sum, item) => sum + item.forecast_volume_liters, 0) / 1000).toFixed(0)}K liters
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-yellow-800 font-semibold">Medium Risk (40-70%)</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {filteredPortfolioData.filter(item => item.p_miss_cleaning > 0.4 && item.p_miss_cleaning <= 0.7).length.toLocaleString()}
                        </div>
                        <div className="text-sm text-yellow-600">
                          {(filteredPortfolioData.filter(item => item.p_miss_cleaning > 0.4 && item.p_miss_cleaning <= 0.7)
                            .reduce((sum, item) => sum + item.forecast_volume_liters, 0) / 1000).toFixed(0)}K liters
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-green-800 font-semibold">Low Risk (≤40%)</div>
                        <div className="text-2xl font-bold text-green-600">
                          {filteredPortfolioData.filter(item => item.p_miss_cleaning <= 0.4).length.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">
                          {(filteredPortfolioData.filter(item => item.p_miss_cleaning <= 0.4)
                            .reduce((sum, item) => sum + item.forecast_volume_liters, 0) / 1000).toFixed(0)}K liters
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grade Performance Analysis */}
                  <div>
                    <h4 className="font-semibold mb-3">Performance by Grade</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {['A', 'B', 'C', 'D'].map(grade => {
                        const gradeItems = filteredPortfolioData.filter(item => item.grade === grade);
                        return (
                          <div key={grade} className="bg-muted/30 p-3 rounded text-center">
                            <div className="font-bold text-lg">Grade {grade}</div>
                            <div className="text-sm text-muted-foreground">{gradeItems.length} outlets</div>
                            <div className="text-xs">
                              Avg Risk: {gradeItems.length > 0 ? (gradeItems.reduce((sum, item) => sum + item.p_miss_cleaning, 0) / gradeItems.length * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Outlet Data Table</span>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </CardTitle>
                <CardDescription>
                  Detailed view of filtered outlet data with risk metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Outlet
                            {sortField === 'name' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('area')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Area
                            {sortField === 'area' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('category')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Category
                            {sortField === 'category' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('grade')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Grade
                            {sortField === 'grade' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('risk')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Risk
                            {sortField === 'risk' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('forecast')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Forecast (L)
                            {sortField === 'forecast' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <button
                            onClick={() => handleSort('next_due')}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            Next Due
                            {sortField === 'next_due' && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium">Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPortfolioData.map((outlet) => (
                        <tr key={outlet.outlet_id} className="border-b hover:bg-muted/20">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{outlet.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {outlet.outlet_id}</p>
                            </div>
                          </td>
                          <td className="p-3">{outlet.area}</td>
                          <td className="p-3">{outlet.category}</td>
                          <td className="p-3">
                            <Badge 
                              variant={outlet.grade === 'A' ? 'default' : 
                                     outlet.grade === 'B' ? 'secondary' : 
                                     outlet.grade === 'C' ? 'outline' : 'destructive'}
                            >
                              {outlet.grade}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className={`font-bold ${
                              outlet.p_miss_cleaning > 0.7 ? 'text-red-600' : 
                              outlet.p_miss_cleaning > 0.4 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {(outlet.p_miss_cleaning * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-3">{outlet.forecast_volume_liters.toLocaleString()}</td>
                          <td className="p-3">{outlet.next_due_date}</td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div>Lat: {outlet.lat.toFixed(4)}</div>
                              <div>Lon: {outlet.lon.toFixed(4)}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPortfolioData.length > 20 && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 20 of {filteredPortfolioData.length} outlets. Use filters to refine results.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
