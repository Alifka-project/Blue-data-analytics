"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CalendarDays, Download, Mail, MapPin, FileText, Route, Clock, ExternalLink, AlertCircle, CheckCircle, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import { ScheduleForecast, PortfolioItem } from "@/lib/types";
import { AdvancedRouteMap, RouteData, RouteStop } from "@/components/maps/AdvancedRouteMap";
import { SimpleRouteMap } from "@/components/maps/SimpleRouteMap";
import { BasicRouteMap } from "@/components/maps/BasicRouteMap";
import { DubaiRouteMap } from "@/components/maps/DubaiRouteMap";
import { RealDubaiMap } from "@/components/maps/RealDubaiMap";

export default function ReportingPage() {
  const [scheduleData, setScheduleData] = useState<ScheduleForecast | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("2023-04");
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedInspector, setSelectedInspector] = useState<number | null>(null);
  const [selectedRouteData, setSelectedRouteData] = useState<RouteData | null>(null);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showETADialog, setShowETADialog] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  
  // Pagination state for ML Predicted Schedule
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real portfolio data
        const portfolioResponse = await fetch('/api/predictions/portfolio');
        const portfolioResult = await portfolioResponse.json();
        
        if (portfolioResult.success && portfolioResult.data.items) {
          const portfolioItems = portfolioResult.data.items;
          setPortfolioData(portfolioItems);
          
          // Generate predicted inspection schedule from trained ML model
          const schedule = generatePredictedSchedule(portfolioItems);
          setScheduleData(schedule);
          
          // Set default month to April 2023
          setSelectedMonth("2023-04");
          
          // Auto-generate a default route for the first inspector to show something immediately
          setTimeout(() => {
            if (schedule.calendar.length > 0) {
              const firstInspectorId = schedule.calendar[0].inspector_id;
              setSelectedInspector(firstInspectorId);
              
              // Generate route for first inspector
              const inspectorDays = schedule.calendar.filter(day => day.inspector_id === firstInspectorId);
              if (inspectorDays.length > 0) {
                const allItems = inspectorDays.flatMap(day => day.items);
                const sortedItems = allItems.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning).slice(0, 15);
                
                if (sortedItems.length > 0) {
                  const depotLocation = { lat: 25.1972, lon: 55.2796 }; // Dubai Mall
                  const routeStops: RouteStop[] = sortedItems.map((item: any, index: number) => ({
                    outlet_id: item.outlet_id,
                    outlet_name: item.outlet_name,
                    area: item.area,
                    lat: item.lat,
                    lon: item.lon,
                    scheduled_window: [`${8 + index}:00`, `${9 + index}:00`] as [string, string],
                    p_miss_cleaning: item.p_miss_cleaning,
                    forecast_volume_liters: item.forecast_volume_liters,
                    priority: item.priority,
                    order: index + 1,
                    eta: `${8 + index}:${(index * 15).toString().padStart(2, '0')}`,
                    travel_time: Math.max(Math.round((Math.abs(item.lat - 25.2) + Math.abs(item.lon - 55.3)) * 10 + 10), 5),
                    service_time: item.priority === 'High' ? 45 : item.priority === 'Med' ? 30 : 20
                  }));

                  const defaultRouteData: RouteData = {
                    date: `Inspector ${inspectorDays[0].inspector_name} Route`,
                    inspector_id: firstInspectorId,
                    inspector_name: inspectorDays[0].inspector_name,
                    depot_location: depotLocation,
                    stops: routeStops
                  };

                  setSelectedRouteData(defaultRouteData);
          
                }
              }
            }
          }, 1000); // Small delay to ensure UI is ready
        }
      } catch (err) {

        setError('Error loading schedule data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generatePredictedSchedule = (portfolioItems: PortfolioItem[]): ScheduleForecast => {
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

  // Get filtered calendar data based on selected month
  const getFilteredCalendarData = () => {
    if (!scheduleData) return [];
    
    return scheduleData.calendar.filter(day => {
      const dayMonth = day.date.substring(0, 7); // Get YYYY-MM format
      return dayMonth === selectedMonth;
    });
  };

  // Get weeks in the selected month
  const getWeeksInMonth = () => {
    const monthData = getFilteredCalendarData();
    const weeks: any[][] = [];
    
    if (monthData.length === 0) return weeks;
    
    // Group days by week
    let currentWeek: any[] = [];
    let currentWeekStart = new Date(monthData[0].date);
    
    monthData.forEach(day => {
      const dayDate = new Date(day.date);
      const daysSinceWeekStart = Math.floor((dayDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceWeekStart >= 7) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [day];
        currentWeekStart = dayDate;
      } else {
        currentWeek.push(day);
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  // Get filtered data by week
  const getWeeklyFilteredData = () => {
    const weeks = getWeeksInMonth();
    if (weeks.length === 0 || selectedWeek > weeks.length) return [];
    return weeks[selectedWeek - 1] || [];
  };

  // Get paginated data for current page (now uses weekly data)
  const getPaginatedData = () => {
    const weeklyData = getWeeklyFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return weeklyData.slice(startIndex, endIndex);
  };

  // Get total pages for pagination (now based on weekly data)
  const getTotalPages = () => {
    const weeklyData = getWeeklyFilteredData();
    return Math.ceil(weeklyData.length / itemsPerPage);
  };

  // Handle month change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedWeek(1); // Reset to first week when month changes
    setCurrentPage(1); // Reset to first page when month changes
    setSelectedDate("all"); // Reset selected date to show all dates
  };

  // Handle week change
  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
    setCurrentPage(1); // Reset to first page when week changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get available months for the period April-June 2023
  const getAvailableMonths = () => [
    { value: "2023-04", label: "April 2023" },
    { value: "2023-05", label: "May 2023" },
    { value: "2023-06", label: "June 2023" }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Med': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.8) return 'text-red-600';
    if (risk >= 0.6) return 'text-orange-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const generateRouteForInspector = (inspectorId: number) => {
    // Get all days for this inspector
    const inspectorDays = scheduleData?.calendar.filter(day => day.inspector_id === inspectorId) || [];
    
    if (inspectorDays.length === 0) {
      console.warn(`No days found for inspector ${inspectorId}`);
      return;
    }
    
    // Combine all items for this inspector (already filtered to restaurants only)
    const allItems = inspectorDays.flatMap(day => day.items);
    
    
    // Create a multi-day route for the inspector
    const inspectorInfo = inspectorDays[0];
    const depotLocation = { lat: 25.1972, lon: 55.2796 }; // Dubai Mall as depot
    
    // Sort by risk priority and take first 15 for optimal routing
    const sortedItems = allItems.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning).slice(0, 15);
    
    if (sortedItems.length === 0) {
      console.warn(`No outlets found for inspector ${inspectorId}`);
      return;
    }
    
    const routeStops: RouteStop[] = sortedItems.map((item: any, index: number) => ({
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      area: item.area,
      lat: item.lat,
      lon: item.lon,
      scheduled_window: [`${8 + index}:00`, `${9 + index}:00`] as [string, string],
      p_miss_cleaning: item.p_miss_cleaning,
      forecast_volume_liters: item.forecast_volume_liters,
      priority: item.priority,
      order: index + 1,
      eta: `${8 + index}:${(index * 15).toString().padStart(2, '0')}`,
      travel_time: calculateTravelTime(
        index === 0 ? depotLocation : { lat: sortedItems[index - 1].lat, lon: sortedItems[index - 1].lon },
        { lat: item.lat, lon: item.lon }
      ),
      service_time: item.priority === 'High' ? 45 : item.priority === 'Med' ? 30 : 20
    }));

    const routeData: RouteData = {
      date: `Inspector ${inspectorInfo.inspector_name} Route`,
      inspector_id: inspectorInfo.inspector_id,
      inspector_name: inspectorInfo.inspector_name,
      depot_location: depotLocation,
      stops: routeStops
    };

    setSelectedRouteData(routeData);
    
  };

  const generateRouteForArea = (areaName: string) => {
    // Get all items in this area (already filtered to restaurants only)
    const areaItems = scheduleData?.calendar.flatMap(day => 
      day.items.filter(item => item.area === areaName)
    ) || [];
    
    
    if (areaItems.length === 0) {
      console.warn(`No restaurants found in area: ${areaName}`);
      return;
    }
    
    // Use Dubai Mall as depot for all routes
    const depotLocation = { lat: 25.1972, lon: 55.2796 }; // Dubai Mall
    
    // Sort by risk priority and limit to manageable route size
    const sortedItems = areaItems.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning).slice(0, 12);
    
    const routeStops: RouteStop[] = sortedItems.map((item: any, index: number) => ({
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      area: item.area,
      lat: item.lat,
      lon: item.lon,
      scheduled_window: [`${8 + index}:00`, `${9 + index}:00`] as [string, string],
      p_miss_cleaning: item.p_miss_cleaning,
      forecast_volume_liters: item.forecast_volume_liters,
      priority: item.priority,
      order: index + 1,
      eta: `${8 + index}:${(index * 15).toString().padStart(2, '0')}`,
      travel_time: calculateTravelTime(
        index === 0 ? depotLocation : { lat: sortedItems[index - 1].lat, lon: sortedItems[index - 1].lon },
        { lat: item.lat, lon: item.lon }
      ),
      service_time: item.priority === 'High' ? 45 : item.priority === 'Med' ? 30 : 20
    }));

    const routeData: RouteData = {
      date: `Area: ${areaName} Route`,
      inspector_id: 1,
      inspector_name: `${areaName} Route`,
      depot_location: depotLocation,
      stops: routeStops
    };

    setSelectedRouteData(routeData);
    
  };

  const generateRouteForRisk = (riskLevel: "High" | "Med" | "Low") => {
    // Get all items with this risk level (already filtered to restaurants only)
    const riskItems = scheduleData?.calendar.flatMap(day => 
      day.items.filter(item => item.priority === riskLevel)
    ) || [];
    
    
    if (riskItems.length === 0) {
      console.warn(`No ${riskLevel} risk restaurants found`);
      return;
    }
    
    const depotLocation = { lat: 25.1972, lon: 55.2796 }; // Dubai Mall
    
    // Sort by risk score and limit to manageable route size
    const sortedItems = riskItems.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning).slice(0, 10);
    
    const routeStops: RouteStop[] = sortedItems.map((item: any, index: number) => ({
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      area: item.area,
      lat: item.lat,
      lon: item.lon,
      scheduled_window: [`${8 + index}:00`, `${9 + index}:00`] as [string, string],
      p_miss_cleaning: item.p_miss_cleaning,
      forecast_volume_liters: item.forecast_volume_liters,
      priority: item.priority,
      order: index + 1,
      eta: `${8 + index}:${(index * 15).toString().padStart(2, '0')}`,
      travel_time: calculateTravelTime(
        index === 0 ? depotLocation : { lat: sortedItems[index - 1].lat, lon: sortedItems[index - 1].lon },
        { lat: item.lat, lon: item.lon }
      ),
      service_time: item.priority === 'High' ? 45 : item.priority === 'Med' ? 30 : 20
    }));

    const routeData: RouteData = {
      date: `${riskLevel} Risk Route`,
      inspector_id: 1,
      inspector_name: `${riskLevel} Risk Outlets`,
      depot_location: depotLocation,
      stops: routeStops
    };

    setSelectedRouteData(routeData);
    
  };

  const handleViewRoute = (day: any) => {
    // Use Dubai Mall as depot for all routes
    const depotLocation = { lat: 25.1972, lon: 55.2796 }; // Dubai Mall
    
    // Sort stops by risk priority (highest first) for optimal routing
    const sortedItems = [...day.items].sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning);
    
    const routeStops: RouteStop[] = sortedItems.map((item: any, index: number) => ({
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      area: item.area,
      lat: item.lat,
      lon: item.lon,
      scheduled_window: item.scheduled_window,
      p_miss_cleaning: item.p_miss_cleaning,
      forecast_volume_liters: item.forecast_volume_liters,
      priority: item.priority,
      order: index + 1,
      eta: calculateOptimalETA(item.scheduled_window[0], index),
      travel_time: calculateTravelTime(
        index === 0 ? depotLocation : { lat: sortedItems[index - 1].lat, lon: sortedItems[index - 1].lon },
        { lat: item.lat, lon: item.lon }
      ),
      service_time: item.priority === 'High' ? 45 : item.priority === 'Med' ? 30 : 20 // Variable service time based on risk
    }));

    const routeData: RouteData = {
      date: day.date,
      inspector_id: day.inspector_id,
      inspector_name: day.inspector_name,
      depot_location: depotLocation,
      stops: routeStops
    };

    setSelectedRouteData(routeData);
    setShowRouteDialog(true);
  };

  const handleViewETA = (item: any, day: any) => {
    const stop: RouteStop = {
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      area: item.area,
      lat: item.lat,
      lon: item.lon,
      scheduled_window: item.scheduled_window,
      p_miss_cleaning: item.p_miss_cleaning,
      forecast_volume_liters: item.forecast_volume_liters,
      priority: item.priority,
      order: day.items.indexOf(item) + 1,
      eta: calculateOptimalETA(item.scheduled_window[0], day.items.indexOf(item)),
      travel_time: day.items.indexOf(item) === 0 ? 15 : 10,
      service_time: 30
    };

    setSelectedStop(stop);
    setShowETADialog(true);
  };

  const calculateETA = (order: number): string => {
    const startTime = new Date();
    startTime.setHours(8, 0, 0); // Start at 8 AM
    startTime.setMinutes(startTime.getMinutes() + (order - 1) * 45); // 45 min per stop
    return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateOptimalETA = (scheduledStart: string, order: number): string => {
    // Use the actual scheduled time window from ML prediction
    const [hour, minute] = scheduledStart.split(':').map(Number);
    const eta = new Date();
    eta.setHours(hour, minute, 0);
    
    // Add buffer time based on order for travel
    eta.setMinutes(eta.getMinutes() + (order * 5)); // 5 min buffer per previous stop
    
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTravelTime = (from: {lat: number, lon: number}, to: {lat: number, lon: number}): number => {
    // Haversine distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Convert to travel time (assuming 30 km/h average in Dubai)
    const timeHours = distance / 30;
    return Math.max(Math.round(timeHours * 60), 5); // Minimum 5 minutes
  };

  const handleDownloadReport = async (reportType: string) => {
    setDownloadStatus('downloading');
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a downloadable file
      const reportData = generateReportData(reportType);
      const blob = new Blob([reportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (error) {
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  const generateReportData = (reportType: string): string => {
    if (!scheduleData) return '';
    
    const headers = ['Date', 'Inspector', 'Outlet', 'Area', 'Risk', 'Priority', 'Time Window'];
    const rows = scheduleData.calendar.map(day => 
      day.items.map(item => [
        day.date,
        day.inspector_name,
        item.outlet_name,
        item.area,
        `${(item.p_miss_cleaning * 100).toFixed(1)}%`,
        item.priority,
        `${item.scheduled_window[0]}-${item.scheduled_window[1]}`
      ].join(','))
    ).flat();
    
    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownloadICS = async () => {
    if (!scheduleData) return;
    
    setDownloadStatus('downloading');
    
    try {
      // Generate ICS file content
      const icsContent = generateICSContent(scheduleData);
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspection-schedule-${scheduleData.period_start}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (error) {
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  const generateICSContent = (schedule: ScheduleForecast): string => {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Cleanon//Analytics//EN\n';
    
    schedule.calendar.forEach(day => {
      day.items.forEach(item => {
        const startDate = new Date(`${day.date}T${item.scheduled_window[0]}:00`);
        const endDate = new Date(`${day.date}T${item.scheduled_window[1]}:00`);
        
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${item.ics_uid}\n`;
        ics += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `SUMMARY:Inspection - ${item.outlet_name}\n`;
        ics += `DESCRIPTION:Risk: ${(item.p_miss_cleaning * 100).toFixed(1)}% | Priority: ${item.priority} | Volume: ${item.forecast_volume_liters}L\n`;
        ics += `LOCATION:${item.area}\n`;
        ics += 'END:VEVENT\n';
      });
    });
    
    ics += 'END:VCALENDAR';
    return ics;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading schedule data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !scheduleData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Schedule</h2>
            <p className="text-muted-foreground">{error || 'No data available'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout period="Q2 2023 (Apr-Jun)" run_id={scheduleData.run_id}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Predicted Inspection Schedule - Q2 2023
          </h1>
          <p className="text-muted-foreground text-lg">
            ML-based restaurant inspection schedule for April-June 2023 with risk-prioritized routing & ETA<br/>
            <span className="text-sm">📅 Working days only (Mon-Fri) | ⏰ 24-hour format (08:00-20:00) | 🏢 All routes start from Dubai Mall</span>
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Apr 2023 - Jun 2023
              </div>
              <p className="text-xs text-muted-foreground">Q2 2023 restaurant schedule forecast</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scheduleData.calendar.reduce((sum, day) => sum + day.items.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">restaurants scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <Route className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {scheduleData.calendar.reduce((sum, day) => 
                  sum + day.items.filter(item => item.priority === 'High').length, 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">high-risk restaurants (&gt;70%)</p>
            </CardContent>
          </Card>



          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Areas Covered</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleData.areas.length}</div>
              <p className="text-xs text-muted-foreground">restaurant zones</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="scheduling" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scheduling">ML Predicted Schedule</TabsTrigger>
            <TabsTrigger value="reports">Report Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Filters</CardTitle>
                <CardDescription>
                  Filter by month and inspector for Q2 2023 (April-June)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Month</label>
                    <Select value={selectedMonth} onValueChange={handleMonthChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableMonths().map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date (Optional)</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                      min="2023-04-01"
                      max="2023-06-30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Inspector</label>
                    <Select value={selectedInspector?.toString() || "all"} onValueChange={(value) => setSelectedInspector(value === "all" ? null : parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Inspectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Inspectors</SelectItem>
                        {Array.from(new Set(scheduleData.calendar.map(day => day.inspector_id))).map(id => {
                          const day = scheduleData.calendar.find(d => d.inspector_id === id);
                          return (
                            <SelectItem key={id} value={id.toString()}>
                              {day?.inspector_name || `Inspector ${id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleDownloadICS}
                      disabled={downloadStatus === 'downloading'}
                    >
                      {downloadStatus === 'downloading' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      ) : downloadStatus === 'success' ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      ) : downloadStatus === 'error' ? (
                        <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download ICS
                    </Button>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownloadReport('schedule')}
                      disabled={downloadStatus === 'downloading'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle>ML Predicted Restaurant Schedule - {getAvailableMonths().find(m => m.value === selectedMonth)?.label} (Week {selectedWeek})</CardTitle>
                <CardDescription>
        
                  <span className="text-xs">Working hours: 08:00-20:00 (24-hour format) | Depot: Dubai Mall for all inspectors</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary Info */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {getWeeklyFilteredData().length}
                        </div>
                        <div className="text-sm text-blue-600">Days This Week</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {getWeeklyFilteredData().reduce((sum, day) => sum + day.items.length, 0)}
                        </div>
                        <div className="text-sm text-green-600">Weekly Inspections</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {getWeeklyFilteredData().reduce((sum, day) => 
                            sum + day.items.filter((item: any) => item.priority === 'High').length, 0
                          )}
                        </div>
                        <div className="text-sm text-red-600">High Risk Items</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {getTotalPages()}
                        </div>
                        <div className="text-sm text-purple-600">Total Pages</div>
                      </div>
                    </div>
                    <div className="text-center mt-3 text-sm text-blue-700">
            
            
                    </div>
                  </div>

                  {/* Monthly Slider */}
                  <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-700">📅 Monthly Navigation</h4>
                      <div className="text-sm text-slate-500">
                        {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const prevDate = new Date(selectedMonth + '-01');
                          prevDate.setMonth(prevDate.getMonth() - 1);
                          handleMonthChange(prevDate.toISOString().substring(0, 7));
                        }}
                        disabled={selectedMonth === "2023-04"}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous Month
                      </Button>
                      
                      <div className="flex gap-2">
                        {getAvailableMonths().map((month, index) => (
                          <Button
                            key={month.value}
                            variant={selectedMonth === month.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMonthChange(month.value)}
                            className={selectedMonth === month.value ? "bg-blue-600 text-white" : ""}
                          >
                            {month.label.split(' ')[0]}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextDate = new Date(selectedMonth + '-01');
                          nextDate.setMonth(nextDate.getMonth() + 1);
                          handleMonthChange(nextDate.toISOString().substring(0, 7));
                        }}
                        disabled={selectedMonth === "2023-06"}
                      >
                        Next Month
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Weekly Slider */}
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-700">📅 Weekly Navigation</h4>
                      <div className="text-sm text-green-600">
                        Week {selectedWeek} of {getWeeksInMonth().length} | {getWeeklyFilteredData().length} working days
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWeekChange(selectedWeek - 1)}
                        disabled={selectedWeek === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous Week
                      </Button>
                      
                      <div className="flex gap-2">
                        {getWeeksInMonth().map((week, index) => {
                          const weekNumber = index + 1;
                          const weekStart = week[0]?.date ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                          const weekEnd = week[week.length - 1]?.date ? new Date(week[week.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                          
                          return (
                            <Button
                              key={weekNumber}
                              variant={selectedWeek === weekNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleWeekChange(weekNumber)}
                              className={selectedWeek === weekNumber ? "bg-green-600 text-white" : ""}
                              title={`Week ${weekNumber}: ${weekStart} - ${weekEnd}`}
                            >
                              W{weekNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWeekChange(selectedWeek + 1)}
                        disabled={selectedWeek === getWeeksInMonth().length}
                      >
                        Next Week
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    
                    {/* Week Details */}
                    {getWeeklyFilteredData().length > 0 && (
                      <div className="mt-3 text-center text-sm text-green-700">
                        📍 {new Date(getWeeklyFilteredData()[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(getWeeklyFilteredData()[getWeeklyFilteredData().length - 1].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Date Selector */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {selectedDate && selectedDate !== "all" ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : 'All Dates'}
                    </h3>
                                          <Select
                        value={selectedDate}
                        onValueChange={(date) => {
                          setSelectedDate(date);
                          setCurrentPage(1); // Reset to first page when date changes
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates in Week {selectedWeek}</SelectItem>
                          {getWeeklyFilteredData().map(day => (
                            <SelectItem key={day.date} value={day.date}>
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>

                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex justify-center items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {getTotalPages()}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {getPaginatedData()
                    .filter(day => !selectedDate || selectedDate === "all" || day.date === selectedDate)
                    .filter(day => !selectedInspector || day.inspector_id === selectedInspector)
                    .map((day, dayIndex) => (
                      <div key={`${day.date}-${day.inspector_id}-${dayIndex}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Inspector: {day.inspector_name} | Restaurant Schedule
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {day.items.length} restaurants
                            </Badge>
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {day.items.filter((item: any) => item.priority === 'High').length} High Risk
                            </Badge>
                          </div>
                        </div>

                        {/* Restaurant Items */}
                        <div className="space-y-3">
                          {day.items.map((item: any, index: number) => (
                            <div key={`${item.ics_uid}-${dayIndex}-${index}`} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                                {index + 1}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{item.outlet_name}</h4>
                                  <Badge className={getPriorityColor(item.priority)}>
                                    {item.priority} Risk
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Area:</span>
                                    <span className="ml-2 font-medium">{item.area}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="ml-2 font-medium">
                                      {item.scheduled_window[0]} - {item.scheduled_window[1]}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Risk:</span>
                                    <span className={`ml-2 font-medium ${getRiskColor(item.p_miss_cleaning)}`}>
                                      {(item.p_miss_cleaning * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Volume:</span>
                                    <span className="ml-2 font-medium">
                                      {item.forecast_volume_liters.toLocaleString()}L
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewRoute(day)}
                                >
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Route
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewETA(item, day)}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  ETA
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Route Selection & Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Route Visualization</CardTitle>
                <CardDescription>
                  Select inspector or area to view optimized route. All 4 inspectors contribute to the Q2 2023 schedule.<br/>
                  <span className="text-xs">🏢 All routes start from Dubai Mall depot | ⏰ Working hours: 08:00-20:00</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Route Selection Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Inspector</label>
                      <Select 
                        value={selectedInspector?.toString() || "all"} 
                        onValueChange={(value) => {
                          const inspectorId = value === "all" ? null : parseInt(value);
                          setSelectedInspector(inspectorId);
                          if (inspectorId) {
                            generateRouteForInspector(inspectorId);
                          } else {
                            setSelectedRouteData(null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Inspector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Inspectors</SelectItem>
                          {Array.from(new Set(getWeeklyFilteredData().map(day => day.inspector_id))).map(id => {
                            const day = getWeeklyFilteredData().find(d => d.inspector_id === id);
                            return (
                              <SelectItem key={id} value={id.toString()}>
                                {day?.inspector_name || `Inspector ${id}`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Area</label>
                      <Select 
                        onValueChange={(area) => {
                          if (area !== "all") {
                            generateRouteForArea(area);
                          } else {
                            setSelectedRouteData(null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Areas</SelectItem>
                          {Array.from(new Set(getWeeklyFilteredData().flatMap(day => day.items.map((item: any) => item.area)))).map(area => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Risk Level</label>
                      <Select 
                        onValueChange={(risk) => {
                          if (risk !== "all") {
                            generateRouteForRisk(risk as "High" | "Med" | "Low");
                          } else {
                            setSelectedRouteData(null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Risk Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Risk Levels</SelectItem>
                          <SelectItem value="High">High Risk Only</SelectItem>
                          <SelectItem value="Med">Medium Risk Only</SelectItem>
                          <SelectItem value="Low">Low Risk Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Inspector Contribution Summary */}
                  <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-yellow-800 mb-3">Inspector Contribution - Week {selectedWeek} in {getAvailableMonths().find(m => m.value === selectedMonth)?.label}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Array.from(new Set(getWeeklyFilteredData().map(day => day.inspector_id))).map(id => {
                        const inspectorDays = getWeeklyFilteredData().filter(day => day.inspector_id === id);
                        const day = inspectorDays[0];
                        const totalInspections = inspectorDays.reduce((sum, d) => sum + d.items.length, 0);
                        const highRiskInspections = inspectorDays.reduce((sum, d) => 
                          sum + d.items.filter((item: any) => item.priority === 'High').length, 0
                        );
                        
                        return (
                          <div key={id} className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                            <div className="text-lg font-semibold text-yellow-700 mb-1">
                              {day?.inspector_name || `Inspector ${id}`}
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {totalInspections}
                            </div>
                            <div className="text-sm text-yellow-600">Weekly Inspections</div>
                            <div className="text-xs text-red-600 mt-1">
                              {highRiskInspections} High Risk
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center mt-3 text-xs text-yellow-700">
                      Showing inspector workload for the selected week only
                    </div>
                  </div>

                  {/* Route Map */}
                  {selectedRouteData && (
                    <Card>
                      <CardHeader>
                        <CardTitle>🗺️ Dubai Route Map - {selectedRouteData.date}</CardTitle>
                        <CardDescription>
                          Real Dubai street map with road-following paths, pin points, distances, and ETA for {selectedRouteData.inspector_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>


                        {/* Visual Map */}
                        <div className="mb-6">
                          <RealDubaiMap 
                            routeData={selectedRouteData}
                            height={500}
                            onStopClick={(stop) => {
                              setSelectedStop(stop);
                              setShowETADialog(true);
                            }}
                          />
                        </div>

                        {/* Route Details */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Route Details with Pin Points & ETA</h3>
                          
                          {/* Depot */}
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold">
                              🏢
                            </div>
                            <div>
                              <h4 className="font-medium">Inspector Depot - Dubai Mall (Start Point)</h4>
                              <p className="text-sm text-muted-foreground">
                                📍 Location: {selectedRouteData.depot_location.lat.toFixed(4)}, {selectedRouteData.depot_location.lon.toFixed(4)}
                              </p>
                              <p className="text-xs text-blue-600">All inspectors start from Dubai Mall</p>
                            </div>
                          </div>
                          
                          {/* Route Stops */}
                          {selectedRouteData.stops
                            .sort((a, b) => a.order - b.order)
                            .map((stop, index) => {
                              const getPriorityColor = (priority: string) => {
                                switch (priority) {
                                  case 'High': return 'bg-red-500 border-red-300 text-red-700';
                                  case 'Med': return 'bg-yellow-500 border-yellow-300 text-yellow-700';
                                  case 'Low': return 'bg-green-500 border-green-300 text-green-700';
                                  default: return 'bg-gray-500 border-gray-300 text-gray-700';
                                }
                              };
                              
                              const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                                const R = 6371;
                                const dLat = (lat2 - lat1) * Math.PI / 180;
                                const dLon = (lon2 - lon1) * Math.PI / 180;
                                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                                          Math.sin(dLon/2) * Math.sin(dLon/2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                return R * c;
                              };
                              
                              const prevLocation = index === 0 
                                ? selectedRouteData.depot_location 
                                : selectedRouteData.stops.find(s => s.order === stop.order - 1);
                              
                              const distanceFromPrev = prevLocation 
                                ? calculateDistance(prevLocation.lat, prevLocation.lon, stop.lat, stop.lon)
                                : 0;
                                
                              return (
                                <div 
                                  key={stop.outlet_id} 
                                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border-l-4 border-blue-400"
                                  onClick={() => {
                                    setSelectedStop(stop);
                                    setShowETADialog(true);
                                  }}
                                >
                                  <div 
                                    className={`flex items-center justify-center w-10 h-10 text-white rounded-full font-semibold ${
                                      stop.priority === 'High' ? 'bg-red-500' :
                                      stop.priority === 'Med' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  >
                                    {stop.order}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-lg">{stop.outlet_name}</h4>
                                      <Badge 
                                        variant="outline"
                                        className={`${
                                          stop.priority === 'High' ? 'border-red-300 text-red-700 bg-red-50' :
                                          stop.priority === 'Med' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                          'border-green-300 text-green-700 bg-green-50'
                                        }`}
                                      >
                                        {stop.priority} Risk
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">📍 Coordinates:</span>
                                        <p className="font-medium">{stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">📍 Area:</span>
                                        <p className="font-medium">{stop.area}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">🕒 Time Window:</span>
                                        <p className="font-medium">{stop.scheduled_window[0]} - {stop.scheduled_window[1]}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">⚠️ Risk Score:</span>
                                        <p className="font-medium text-red-600">{(stop.p_miss_cleaning * 100).toFixed(1)}%</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">🛢️ Volume:</span>
                                        <p className="font-medium">{stop.forecast_volume_liters.toLocaleString()}L</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">📏 Distance from prev:</span>
                                        <p className="font-medium text-blue-600">{distanceFromPrev.toFixed(1)} km</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">🚗 Travel time:</span>
                                        <p className="font-medium">{Math.round((distanceFromPrev / 30) * 60)} min</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">🕐 ETA:</span>
                                        <p className="font-medium text-green-600">{stop.eta || `${8 + index}:${(index * 15).toString().padStart(2, '0')}`}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Button variant="outline" size="sm">
                                      <Clock className="h-4 w-4 mr-1" />
                                      View ETA
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Default Route Placeholder */}
                  {!selectedRouteData && (
                    <div className="h-96 flex items-center justify-center bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Interactive route map with pin points and road visualization</p>
                        <p className="text-sm text-muted-foreground">Select an inspector, area, or risk level to view optimized routes</p>
                        <div className="mt-4">
                          <p className="text-xs text-gray-500">
                            Debug: Schedule data loaded: {scheduleData ? 'Yes' : 'No'} | 
                            Calendar entries: {scheduleData?.calendar.length || 0} | 
                            Areas: {scheduleData?.areas.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Report Builder - Q2 2023</CardTitle>
                <CardDescription>
                  Generate PDF/Excel reports for April-June 2023 from precomputed caches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Report Types</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownloadReport('monthly-performance')}
                        disabled={downloadStatus === 'downloading'}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Monthly Performance Report
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownloadReport('route-optimization')}
                        disabled={downloadStatus === 'downloading'}
                      >
                        <Route className="h-4 w-4 mr-2" />
                        Route Optimization Report
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownloadReport('geographic-analysis')}
                        disabled={downloadStatus === 'downloading'}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Geographic Analysis Report
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownloadReport('scheduling-efficiency')}
                        disabled={downloadStatus === 'downloading'}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Scheduling Efficiency Report
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Export Options</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        PDF Export
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Excel Export
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports - Q2 2023</CardTitle>
                <CardDescription>
                  Previously generated reports and exports for April-June 2023
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">April 2023 Restaurant Schedule</h4>
                      <p className="text-sm text-muted-foreground">Generated 2 hours ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">May 2023 Restaurant Schedule</h4>
                      <p className="text-sm text-muted-foreground">Generated 1 day ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">June 2023 Restaurant Schedule</h4>
                      <p className="text-sm text-muted-foreground">Generated 2 days ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Q2 2023 Route Optimization</h4>
                      <p className="text-sm text-muted-foreground">Generated 3 days ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Route Visualization Dialog */}
        <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Route Visualization</DialogTitle>
              <DialogDescription>
                Interactive route map with road-following paths and ETA information
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              {selectedRouteData && (
                <RealDubaiMap 
                  routeData={selectedRouteData}
                  height={400}
                  onStopClick={(stop) => {
                    setSelectedStop(stop);
                    setShowETADialog(true);
                  }}
                />
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* ETA Details Dialog */}
        <Dialog open={showETADialog} onOpenChange={setShowETADialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Stop Details & ETA</DialogTitle>
              <DialogDescription>
                Detailed timing and logistics information
              </DialogDescription>
            </DialogHeader>
            {selectedStop && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{selectedStop.outlet_name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stop Order:</span>
                      <p className="font-medium">#{selectedStop.order}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Area:</span>
                      <p className="font-medium">{selectedStop.area}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Level:</span>
                      <p className={`font-medium ${getRiskColor(selectedStop.p_miss_cleaning)}`}>
                        {(selectedStop.p_miss_cleaning * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge className={getPriorityColor(selectedStop.priority)}>
                        {selectedStop.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Timing Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Scheduled Window:</span>
                      <span className="font-medium">
                        {selectedStop.scheduled_window[0]} - {selectedStop.scheduled_window[1]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estimated Arrival:</span>
                      <span className="font-medium text-blue-600">{selectedStop.eta}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Travel Time:</span>
                      <span className="font-medium">{selectedStop.travel_time} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Service Time:</span>
                      <span className="font-medium">{selectedStop.service_time} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Restaurant Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forecast Volume:</span>
                      <span className="font-medium">{selectedStop.forecast_volume_liters.toLocaleString()}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordinates:</span>
                      <span className="font-medium">{selectedStop.lat.toFixed(4)}, {selectedStop.lon.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`https://maps.google.com/?q=${selectedStop.lat},${selectedStop.lon}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowETADialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
