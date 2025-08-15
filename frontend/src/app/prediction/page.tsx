"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, MapPin, Calendar, AlertTriangle, Eye, Filter } from "lucide-react";
import { PortfolioItem } from "@/lib/types";
import { RouteViewer } from "@/components/maps/RouteViewer";

export default function PredictionPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<PortfolioItem | null>(null);
  const [filters, setFilters] = useState({
    area: 'all',
    category: 'all',
    grade: 'all',
    minRisk: 0
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
    
        const response = await fetch('/api/predictions/portfolio'); // Get ALL data
        const result = await response.json();
        

        
        if (result.success) {
          setPortfolioData(result.data.items || []);

        } else {
          setError('Failed to fetch portfolio data');

        }
      } catch (err) {
        
        setError('Error connecting to API');
      } finally {
        setLoading(false);

      }
    };

    fetchPortfolio();
  }, []);

  const filteredPortfolio = portfolioData.filter(item => {
    if (filters.area && filters.area !== "all" && item.area !== filters.area) return false;
    if (filters.category && filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.grade && filters.grade !== "all" && item.grade !== filters.grade) return false;
    if (filters.minRisk > 0 && item.risk_illegal_dump < filters.minRisk) return false;
    return true;
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.8) return 'text-red-600';
    if (risk >= 0.6) return 'text-orange-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading portfolio data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Portfolio</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Portfolio & Route Viewer
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Predict missed cleaning (now/next), forecast volumes, and view smart schedules
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outlets</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{portfolioData.length}</div>
              <p className="text-xs text-muted-foreground">in portfolio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {portfolioData.filter(item => item.p_miss_cleaning > 0.7).length}
              </div>
              <p className="text-xs text-muted-foreground">outlets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {(portfolioData.reduce((sum, item) => sum + item.risk_illegal_dump, 0) / portfolioData.length * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">portfolio average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Due</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {portfolioData.filter(item => {
                  const nextDue = new Date(item.next_due_date);
                  const today = new Date();
                  const diffDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm py-2 sm:py-3">Portfolio Table</TabsTrigger>
            <TabsTrigger value="route-viewer" className="text-xs sm:text-sm py-2 sm:py-3">Route Viewer</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Portfolio Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Area</label>
                    <Select value={filters.area} onValueChange={(value) => setFilters(prev => ({ ...prev, area: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        {Array.from(new Set(portfolioData.map(item => item.area))).map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Array.from(new Set(portfolioData.map(item => item.category))).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Grade</label>
                    <Select value={filters.grade} onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {['A', 'B', 'C', 'D'].map(grade => (
                          <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Risk</label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                      max="1"
                      value={filters.minRisk}
                      onChange={(e) => setFilters(prev => ({ ...prev, minRisk: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Table */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Data</CardTitle>
                <CardDescription>
                  {filteredPortfolio.length} outlets matching current filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Outlet</TableHead>
                        <TableHead className="min-w-[100px]">Area</TableHead>
                        <TableHead className="min-w-[100px]">Category</TableHead>
                        <TableHead className="min-w-[80px]">Grade</TableHead>
                        <TableHead className="min-w-[80px]">Risk</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPortfolio.slice(0, 20).map((item) => (
                        <TableRow key={item.outlet_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {item.outlet_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.area}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(item.grade)}>
                              {item.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${getRiskColor(item.risk_illegal_dump)}`}>
                              {(item.risk_illegal_dump * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOutlet(item)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{item.name} - Outlet Details</DialogTitle>
                                  <DialogDescription>
                                    Detailed analysis and predictions for this outlet
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Basic Info</h4>
                                      <p className="text-sm text-muted-foreground">Area: {item.area}</p>
                                      <p className="text-sm text-muted-foreground">Category: {item.category}</p>
                                      <p className="text-sm text-muted-foreground">Grade: {item.grade}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Coordinates</h4>
                                      <p className="text-sm text-muted-foreground">Lat: {item.lat.toFixed(6)}</p>
                                      <p className="text-sm text-muted-foreground">Lon: {item.lon.toFixed(6)}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold">Risk Analysis</h4>
                                    <div className="space-y-2">
                                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span>Missed Cleaning Probability:</span>
                                        <span className="font-semibold">{(item.p_miss_cleaning * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span>Illegal Dump Risk:</span>
                                        <span className="font-semibold">{(item.risk_illegal_dump * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span>Volume Forecast:</span>
                                        <span className="font-semibold">{item.forecast_volume_liters.toLocaleString()} L</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold">SHAP Top 3 Drivers</h4>
                                    <div className="space-y-2">
                                      {item.shap_top3.map((driver, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                          <span className="text-sm">{driver.feature}</span>
                                          <Badge variant="outline">{driver.impact.toFixed(3)}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route-viewer" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Viewer</CardTitle>
                <CardDescription>
                  View optimized routes and outlet locations on the map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteViewer 
                  portfolioData={portfolioData}
                  title="Route Viewer"
                  description="Interactive map showing outlet locations and optimized routes"
                  height={400}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
