"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Route, Clock, Navigation } from "lucide-react";

export interface RouteStop {
  outlet_id: number;
  outlet_name: string;
  area: string;
  lat: number;
  lon: number;
  scheduled_window: [string, string];
  p_miss_cleaning: number;
  forecast_volume_liters: number;
  priority: "High" | "Med" | "Low";
  order: number;
  eta?: string;
  travel_time?: number;
  service_time?: number;
}

export interface RouteData {
  date: string;
  inspector_id: number;
  inspector_name: string;
  depot_location: { lat: number; lon: number };
  stops: RouteStop[];
}

interface BasicRouteMapProps {
  routeData: RouteData;
  onStopClick?: (stop: RouteStop) => void;
  height?: number;
}

export function BasicRouteMap({ 
  routeData, 
  onStopClick,
  height = 600 
}: BasicRouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Calculate total distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getTotalDistance = (): string => {
    let distance = 0;
    const coords = [routeData.depot_location, ...routeData.stops];
    
    for (let i = 0; i < coords.length - 1; i++) {
      const d = calculateDistance(
        coords[i].lat, coords[i].lon,
        coords[i + 1].lat, coords[i + 1].lon
      );
      distance += d;
    }
    
    return `${distance.toFixed(1)} km`;
  };

  const getEstimatedTime = (): string => {
    const totalStops = routeData.stops.length;
    const totalMinutes = totalStops * 45; // 45 min per stop (30 service + 15 travel)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Med': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Draw route on canvas
  useEffect(() => {
    if (!canvasRef.current || !routeData.stops.length) return;

    console.log('BasicRouteMap: Drawing route with', routeData.stops.length, 'stops');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // High DPI
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Clear canvas with map-like background
    const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.offsetWidth, height);

    // Calculate bounds
    const allLocations = [routeData.depot_location, ...routeData.stops];
    const lats = allLocations.map(p => p.lat);
    const lons = allLocations.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lonPadding = (maxLon - minLon) * 0.1;

    const boundsMinLat = minLat - latPadding;
    const boundsMaxLat = maxLat + latPadding;
    const boundsMinLon = minLon - lonPadding;
    const boundsMaxLon = maxLon + lonPadding;

    // Convert lat/lon to canvas coordinates
    const toCanvas = (lat: number, lon: number) => {
      const x = ((lon - boundsMinLon) / (boundsMaxLon - boundsMinLon)) * (canvas.offsetWidth - 40) + 20;
      const y = ((boundsMaxLat - lat) / (boundsMaxLat - boundsMinLat)) * (height - 40) + 20;
      return { x, y };
    };

    // Draw map-like grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i <= 10; i++) {
      const x = (canvas.offsetWidth / 10) * i;
      const y = (height / 10) * i;
      // Vertical grid lines
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      // Horizontal grid lines
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.offsetWidth, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // Draw route lines with road-like curves
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const depotPos = toCanvas(routeData.depot_location.lat, routeData.depot_location.lon);
    const sortedStops = [...routeData.stops].sort((a, b) => a.order - b.order);
    
    // Create road-following path with curves
    const allPoints = [
      { x: depotPos.x, y: depotPos.y, name: 'Depot' },
      ...sortedStops.map(stop => {
        const pos = toCanvas(stop.lat, stop.lon);
        return { x: pos.x, y: pos.y, name: stop.outlet_name, priority: stop.priority };
      })
    ];

    // Draw curved road segments between points
    for (let i = 0; i < allPoints.length - 1; i++) {
      const current = allPoints[i];
      const next = allPoints[i + 1];
      
      // Calculate intermediate points for road-like curves
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create curve control points to simulate road paths
      const curveFactor = 0.3; // How much the road curves
      const perpX = -dy / distance; // Perpendicular direction
      const perpY = dx / distance;
      
      // Add some randomness but keep it deterministic based on coordinates
      const seed = (current.x + current.y + next.x + next.y) % 1000;
      const curveDirection = (seed % 2 === 0) ? 1 : -1;
      const curveAmount = (Math.sin(seed * 0.01) * 0.5 + 0.5) * curveFactor * distance;
      
      const midX = (current.x + next.x) / 2 + perpX * curveAmount * curveDirection;
      const midY = (current.y + next.y) / 2 + perpY * curveAmount * curveDirection;
      
      // Additional intermediate points for smoother curves
      const quarter1X = (current.x + midX) / 2;
      const quarter1Y = (current.y + midY) / 2;
      const quarter3X = (midX + next.x) / 2;
      const quarter3Y = (midY + next.y) / 2;
      
      // Draw the curved road segment
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      
      // Create a smooth curve through intermediate points
      ctx.bezierCurveTo(
        quarter1X, quarter1Y,  // First control point
        quarter3X, quarter3Y,  // Second control point
        next.x, next.y         // End point
      );
      
      // Color code based on destination priority
      if (next.priority === 'High') {
        ctx.strokeStyle = '#dc2626'; // Red for high priority
      } else if (next.priority === 'Med') {
        ctx.strokeStyle = '#ea580c'; // Orange for medium priority
      } else if (next.priority === 'Low') {
        ctx.strokeStyle = '#16a34a'; // Green for low priority
      } else {
        ctx.strokeStyle = '#2563eb'; // Blue for depot
      }
      
      ctx.stroke();
      
      // Add direction arrows along the path
      const arrowSize = 8;
      const arrowX = (current.x + next.x) / 2;
      const arrowY = (current.y + next.y) / 2;
      const angle = Math.atan2(dy, dx);
      
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Reset shadow for other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw depot
    ctx.fillStyle = '#1e40af';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(depotPos.x, depotPos.y, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw depot label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('D', depotPos.x, depotPos.y + 4);

    // Draw stops
    sortedStops.forEach((stop, index) => {
      const pos = toCanvas(stop.lat, stop.lon);
      
      // Draw circle
      ctx.fillStyle = getPriorityColor(stop.priority);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const radius = stop.priority === 'High' ? 10 : stop.priority === 'Med' ? 8 : 6;
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw order number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stop.order.toString(), pos.x, pos.y + 3);

      // Draw label
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      const label = `${stop.outlet_name} (${(stop.p_miss_cleaning * 100).toFixed(0)}%)`;
      ctx.fillText(label, pos.x + 15, pos.y - 5);
      ctx.fillText(`${stop.area} • ${stop.scheduled_window[0]}`, pos.x + 15, pos.y + 8);
    });

    setMapLoaded(true);
    console.log('BasicRouteMap: Route drawn successfully');

  }, [routeData, height]);

  // Handle clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onStopClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is near any stop
    const allClickLocations = [routeData.depot_location, ...routeData.stops];
    const lats = allClickLocations.map(p => p.lat);
    const lons = allClickLocations.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latPadding = (maxLat - minLat) * 0.1;
    const lonPadding = (maxLon - minLon) * 0.1;

    const boundsMinLat = minLat - latPadding;
    const boundsMaxLat = maxLat + latPadding;
    const boundsMinLon = minLon - lonPadding;
    const boundsMaxLon = maxLon + lonPadding;

    const toCanvas = (lat: number, lon: number) => {
      const canvasX = ((lon - boundsMinLon) / (boundsMaxLon - boundsMinLon)) * (canvas.offsetWidth - 40) + 20;
      const canvasY = ((boundsMaxLat - lat) / (boundsMaxLat - boundsMinLat)) * (height - 40) + 20;
      return { x: canvasX, y: canvasY };
    };

    // Check each stop
    for (const stop of routeData.stops) {
      const pos = toCanvas(stop.lat, stop.lon);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance <= 15) { // Click tolerance
        onStopClick(stop);
        break;
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="font-semibold">{getTotalDistance()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Est. Time</p>
                <p className="font-semibold">{getEstimatedTime()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Stops</p>
                <p className="font-semibold">{routeData.stops.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inspector</p>
                <p className="font-semibold">{routeData.inspector_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route List */}
      <Card>
        <CardHeader>
          <CardTitle>Route Details - {routeData.date}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold">
                D
              </div>
              <div>
                <h4 className="font-medium">Inspector Depot</h4>
                <p className="text-sm text-muted-foreground">
                  Start Location: {routeData.depot_location.lat.toFixed(4)}, {routeData.depot_location.lon.toFixed(4)}
                </p>
              </div>
            </div>
            
            {routeData.stops
              .sort((a, b) => a.order - b.order)
              .map((stop, index) => (
                <div 
                  key={stop.outlet_id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => onStopClick && onStopClick(stop)}
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 text-white rounded-full font-semibold"
                    style={{ backgroundColor: getPriorityColor(stop.priority) }}
                  >
                    {stop.order}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{stop.outlet_name}</h4>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          stop.priority === 'High' ? 'border-red-300 text-red-700 bg-red-50' :
                          stop.priority === 'Med' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          'border-green-300 text-green-700 bg-green-50'
                        }`}
                      >
                        {stop.priority} Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <span>📍 {stop.area}</span>
                      <span>🕒 {stop.scheduled_window[0]} - {stop.scheduled_window[1]}</span>
                      <span>⚠️ {(stop.p_miss_cleaning * 100).toFixed(1)}%</span>
                      <span>🛢️ {stop.forecast_volume_liters.toLocaleString()}L</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{stop.eta || `${8 + index}:00`}</div>
                    <div className="text-muted-foreground">ETA</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Canvas Map */}
      <Card>
        <CardHeader>
          <CardTitle>Route Map - Visual Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas 
              ref={canvasRef}
              style={{ height: `${height}px` }}
              className="w-full border rounded-lg cursor-pointer"
              onClick={handleCanvasClick}
            />
            
            {!mapLoaded && (
              <div 
                className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg"
                style={{ height: `${height}px` }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Drawing route map...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span>Depot (D)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>High Priority Stop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Medium Priority Stop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Low Priority Stop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-red-600 rounded"></div>
              <span>High Priority Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-orange-600 rounded"></div>
              <span>Medium Priority Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-green-600 rounded"></div>
              <span>Low Priority Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-blue-600 rounded"></div>
              <span>From Depot</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
