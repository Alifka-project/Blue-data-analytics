"use client";

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Route, Navigation } from "lucide-react";

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
  route_geometry?: string; // GeoJSON LineString
}

interface AdvancedRouteMapProps {
  routeData: RouteData;
  onStopClick?: (stop: RouteStop) => void;
  height?: number;
}

export function AdvancedRouteMap({ 
  routeData, 
  onStopClick,
  height = 600 
}: AdvancedRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showETAPopup, setShowETAPopup] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [routeData.depot_location.lon, routeData.depot_location.lat],
      zoom: 11,
      maxZoom: 18,
      minZoom: 8
    });

    map.current.on('load', () => {
      console.log('AdvancedRouteMap: Map loaded successfully');
      setMapLoaded(true);
    });

    map.current.on('error', (e) => {
      console.error('AdvancedRouteMap: Map error:', e);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [routeData.depot_location]);

  // Add route data to map
  useEffect(() => {
    console.log('AdvancedRouteMap: Route data effect triggered', {
      mapExists: !!map.current,
      mapLoaded,
      stopsLength: routeData.stops.length,
      routeData
    });
    
    if (!map.current || !mapLoaded || !routeData.stops.length) {
      console.log('AdvancedRouteMap: Skipping route data - missing requirements');
      return;
    }

    // Clear existing layers and sources
    if (map.current.getLayer('route-line')) map.current.removeLayer('route-line');
    if (map.current.getLayer('stops')) map.current.removeLayer('stops');
    if (map.current.getLayer('stop-labels')) map.current.removeLayer('stop-labels');
    if (map.current.getLayer('depot')) map.current.removeLayer('depot');
    if (map.current.getSource('route')) map.current.removeSource('route');
    if (map.current.getSource('stops')) map.current.removeSource('stops');
    if (map.current.getSource('depot')) map.current.removeSource('depot');

    // Add depot marker
    map.current.addSource('depot', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [routeData.depot_location.lon, routeData.depot_location.lat]
        },
        properties: {
          type: 'depot',
          name: 'Inspector Depot'
        }
      }
    });

    map.current.addLayer({
      id: 'depot',
      type: 'circle',
      source: 'depot',
      paint: {
        'circle-radius': 12,
        'circle-color': '#1e40af',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3
      }
    });

    // Create route line with road-following simulation
    const routeCoordinates = [
      [routeData.depot_location.lon, routeData.depot_location.lat],
      ...routeData.stops
        .sort((a, b) => a.order - b.order)
        .map(stop => [stop.lon, stop.lat])
    ];

    // Simulate road-following by adding intermediate points
    const smoothedRoute = createRoadFollowingRoute(routeCoordinates);

    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: smoothedRoute
        },
        properties: {}
      }
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2563eb', // Blue route line
        'line-width': 6,
        'line-opacity': 0.9
      }
    });

    // Add stops with priority-based colors
    map.current.addSource('stops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: routeData.stops.map(stop => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [stop.lon, stop.lat]
          },
          properties: {
            ...stop,
            color: getPriorityColor(stop.priority)
          }
        }))
      }
    });

    map.current.addLayer({
      id: 'stops',
      type: 'circle',
      source: 'stops',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'priority'], 'High'], 12,
          ['==', ['get', 'priority'], 'Med'], 10,
          8
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'priority'], 'High'], '#ef4444',
          ['==', ['get', 'priority'], 'Med'], '#f59e0b',
          '#10b981'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3
      }
    });

    // Add numbered labels for each stop
    map.current.addLayer({
      id: 'stop-labels',
      type: 'symbol',
      source: 'stops',
      layout: {
        'text-field': ['get', 'order'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add click handlers for stops
    map.current.on('click', 'stops', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const stop = feature.properties as RouteStop;
        setSelectedStop(stop);
        setShowETAPopup(true);
        
        if (onStopClick) {
          onStopClick(stop);
        }

        // Create popup
        const popup = new maplibregl.Popup()
          .setLngLat([stop.lon, stop.lat])
          .setHTML(`
            <div class="p-3 min-w-[250px]">
              <h3 class="font-semibold text-lg mb-2">${stop.outlet_name}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Order:</span>
                  <span class="font-medium">#${stop.order}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Area:</span>
                  <span class="font-medium">${stop.area}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Window:</span>
                  <span class="font-medium">${stop.scheduled_window[0]} - ${stop.scheduled_window[1]}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Risk:</span>
                  <span class="font-medium text-${getRiskTextColor(stop.p_miss_cleaning)}">${(stop.p_miss_cleaning * 100).toFixed(0)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ETA:</span>
                  <span class="font-medium">${stop.eta || calculateETA(stop.order)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Service Time:</span>
                  <span class="font-medium">${stop.service_time || 30} min</span>
                </div>
              </div>
            </div>
          `)
          .addTo(map.current!);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'stops', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'stops', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    // Fit map to route bounds
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([routeData.depot_location.lon, routeData.depot_location.lat]);
    routeData.stops.forEach(stop => {
      bounds.extend([stop.lon, stop.lat]);
    });
    map.current.fitBounds(bounds, { padding: 50 });

  }, [mapLoaded, routeData, onStopClick]);

  // Helper function to create road-following route (deterministic, no random)
  const createRoadFollowingRoute = (coordinates: number[][]): number[][] => {
    if (coordinates.length < 2) return coordinates;
    
    const smoothedRoute: number[][] = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      smoothedRoute.push(start);
      
      // Add intermediate points to simulate road following
      const numIntermediatePoints = 5; // More points for smoother curves
      for (let j = 1; j <= numIntermediatePoints; j++) {
        const ratio = j / (numIntermediatePoints + 1);
        
        // Create curved path that simulates road following
        const midLon = start[0] + (end[0] - start[0]) * ratio;
        const midLat = start[1] + (end[1] - start[1]) * ratio;
        
        // Add deterministic curvature based on coordinate differences
        const distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        const curveFactor = Math.sin(ratio * Math.PI) * distance * 0.1; // Deterministic curve
        
        // Perpendicular offset for road-like curves
        const perpLon = -(end[1] - start[1]) / distance * curveFactor * 0.002;
        const perpLat = (end[0] - start[0]) / distance * curveFactor * 0.001;
        
        smoothedRoute.push([
          midLon + perpLon,
          midLat + perpLat
        ]);
      }
    }
    
    smoothedRoute.push(coordinates[coordinates.length - 1]);
    return smoothedRoute;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Med': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskTextColor = (risk: number): string => {
    if (risk >= 0.8) return 'red-600';
    if (risk >= 0.6) return 'orange-600';
    if (risk >= 0.4) return 'yellow-600';
    return 'green-600';
  };

  const calculateETA = (order: number): string => {
    // Simple ETA calculation based on order
    const startTime = new Date();
    startTime.setHours(8, 0, 0); // Start at 8 AM
    startTime.setMinutes(startTime.getMinutes() + (order - 1) * 45); // 45 min per stop
    return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTotalDistance = (): string => {
    // Calculate approximate total distance
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

  const getEstimatedTime = (): string => {
    const totalStops = routeData.stops.length;
    const totalMinutes = totalStops * 45; // 45 min per stop (30 service + 15 travel)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
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

      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle>Route Visualization - {routeData.date}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapContainer} 
              style={{ height }} 
              className="w-full rounded-lg overflow-hidden border"
            />
            
            {/* Loading Overlay */}
            {!mapLoaded && (
              <div 
                className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg"
                style={{ height }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading route map...</p>
                  <p className="text-sm text-gray-500">
                    {routeData.stops.length} stops • {routeData.inspector_name}
                  </p>
                </div>
              </div>
            )}
            
            {/* No Data Overlay */}
            {mapLoaded && routeData.stops.length === 0 && (
              <div 
                className="absolute inset-0 bg-gray-50 flex items-center justify-center rounded-lg"
                style={{ height }}
              >
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No route data available</p>
                  <p className="text-sm text-gray-500">Select an inspector, area, or risk level to view routes</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span>Depot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-600"></div>
              <span>Route Path</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
