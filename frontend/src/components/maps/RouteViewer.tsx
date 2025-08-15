"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Route, Clock, Navigation, AlertTriangle, Timer, Ruler } from "lucide-react";

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

interface RoutePoint {
  id: number;
  name: string;
  lat: number;
  lon: number;
  risk_score: number;
  category: string;
  area: string;
  grade: string;
  order: number;
  distance_km?: number;
  eta_minutes?: number;
  cumulative_time?: number;
}

interface RouteViewerProps {
  portfolioData: PortfolioItem[];
  selectedDate?: string;
  title?: string;
  description?: string;
  height?: number;
}

export function RouteViewer({ 
  portfolioData = [], 
  selectedDate = new Date().toISOString().split('T')[0],
  title = "Route Optimizer", 
  description = "Optimized inspection routes with distance and time estimates",
  height = 600
}: RouteViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);

  // Get risk color based on score
  const getRiskColor = (riskScore: number): string => {
    if (riskScore > 0.7) return '#ef4444'; // Red - High risk
    if (riskScore > 0.4) return '#f59e0b'; // Orange - Medium risk
    return '#10b981'; // Green - Low risk
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Handle invalid coordinates
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      console.warn('Invalid coordinates provided for distance calculation');
      return 5; // Default 5km if coordinates are invalid
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    // Ensure minimum distance (same location should still show small distance)
    return Math.max(distance, 0.1);
  };

  // Estimate travel time (average 30 km/h in city + 15 min inspection time)
  const estimateTime = (distanceKm: number, isFirstPoint: boolean = false): number => {
    const travelTime = (distanceKm / 30) * 60; // 30 km/h converted to minutes
    const inspectionTime = isFirstPoint ? 0 : 15; // 15 minutes per inspection
    return Math.round(travelTime + inspectionTime);
  };

  // Generate optimized route points
  const generateRoutePoints = () => {
    if (!portfolioData || portfolioData.length === 0) return [];

    // Filter data based on selected filters
    let filteredData = portfolioData.filter(item => {
      if (selectedArea !== 'all' && item.area !== selectedArea) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      return true;
    });

    // Sort by risk score (highest first) for priority-based routing
    filteredData.sort((a, b) => b.p_miss_cleaning - a.p_miss_cleaning);

    // Take top 20 for better coverage (was limiting to 10)
    filteredData = filteredData.slice(0, 20);

    // Starting point (Dubai center for inspector depot)
    const startLat = 25.2048;
    const startLon = 55.2708;

    let currentLat = startLat;
    let currentLon = startLon;
    let cumulativeTime = 0;
    let totalDist = 0;

    const points: RoutePoint[] = filteredData.map((item, index) => {
      const distance = calculateDistance(currentLat, currentLon, item.lat, item.lon);
      const timeToPoint = estimateTime(distance, index === 0);
      cumulativeTime += timeToPoint;
      totalDist += distance;

      // Update current position for next calculation
      currentLat = item.lat;
      currentLon = item.lon;

      return {
        id: item.outlet_id,
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        risk_score: item.p_miss_cleaning,
        category: item.category,
        area: item.area,
        grade: item.grade,
        order: index + 1,
        distance_km: distance,
        eta_minutes: timeToPoint,
        cumulative_time: cumulativeTime
      };
    });

    setTotalDistance(totalDist);
    setTotalTime(cumulativeTime);
    setRoutePoints(points);
    return points;
  };

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-light': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'carto-light-layer',
              type: 'raster',
              source: 'carto-light'
            }
          ]
        },
        center: [55.2708, 25.2048], // Dubai coordinates
        zoom: 11
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.warn('Map warning (non-critical):', e.error?.message || 'Unknown map issue');
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update route visualization when data changes
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const points = generateRoutePoints();
    if (points.length === 0) return;

    // Clear existing layers and sources
    try {
      if (map.current.getLayer('route-line')) map.current.removeLayer('route-line');
      if (map.current.getLayer('route-points')) map.current.removeLayer('route-points');
      if (map.current.getLayer('route-numbers')) map.current.removeLayer('route-numbers');
      if (map.current.getSource('route')) map.current.removeSource('route');
      if (map.current.getSource('points')) map.current.removeSource('points');
    } catch (error) {
      console.log('No existing layers to remove');
    }

    // Create route line coordinates
    const routeCoordinates = points.map(point => [point.lon, point.lat]);
    
    // Add starting point (depot)
    routeCoordinates.unshift([55.2708, 25.2048]);

    // Add route line source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    });

    // Add points source
    map.current.addSource('points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          // Starting point (depot)
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [55.2708, 25.2048]
            },
            properties: {
              id: 0,
              name: 'Inspector Depot',
              risk_score: 0,
              order: 0,
              type: 'depot'
            }
          },
          // Route points
          ...points.map(point => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [point.lon, point.lat]
            },
            properties: {
              id: point.id,
              name: point.name,
              risk_score: point.risk_score,
              order: point.order,
              category: point.category,
              area: point.area,
              distance_km: point.distance_km,
              eta_minutes: point.eta_minutes,
              type: 'outlet'
            }
          }))
        ]
      }
    });

    // Add route line layer with risk-based coloring
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'risk_score'],
          0, '#10b981',  // Green for low risk
          0.4, '#f59e0b', // Orange for medium risk
          0.7, '#ef4444'  // Red for high risk
        ],
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add points layer
    map.current.addLayer({
      id: 'route-points',
      type: 'circle',
      source: 'points',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'type'], 'depot'], 12,
          10
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'depot'], '#1e40af',
          [
            'interpolate',
            ['linear'],
            ['get', 'risk_score'],
            0, '#10b981',
            0.4, '#f59e0b',
            0.7, '#ef4444'
          ]
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Add number labels
    map.current.addLayer({
      id: 'route-numbers',
      type: 'symbol',
      source: 'points',
      layout: {
        'text-field': [
          'case',
          ['==', ['get', 'type'], 'depot'], 'S',
          ['to-string', ['get', 'order']]
        ],
        'text-size': 14,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });

    // Add click handlers for points
    map.current.on('click', 'route-points', (e) => {
      if (e.features && e.features[0]) {
        const properties = e.features[0].properties;
        const popup = new maplibregl.Popup()
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .setHTML(`
            <div class="p-3">
              <h4 class="font-bold">${properties?.name || 'Unknown'}</h4>
              <div class="text-sm space-y-1 mt-2">
                ${properties?.type === 'depot' ? 
                  '<div><strong>Starting Point</strong></div>' :
                  `<div><strong>Stop #:</strong> ${properties?.order}</div>
                   <div><strong>Risk:</strong> ${((properties?.risk_score || 0) * 100).toFixed(0)}%</div>
                   <div><strong>Distance:</strong> ${(properties?.distance_km || 0).toFixed(1)} km</div>
                   <div><strong>ETA:</strong> ${properties?.eta_minutes} min</div>
                   <div><strong>Category:</strong> ${properties?.category}</div>`
                }
              </div>
            </div>
          `)
          .addTo(map.current!);
      }
    });

    // Fit map to show all points
    if (points.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([55.2708, 25.2048]); // Include depot
      points.forEach(point => {
        bounds.extend([point.lon, point.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [mapLoaded, portfolioData, selectedArea, selectedCategory]);

  // Get unique areas and categories for filters
  const uniqueAreas = Array.from(new Set(portfolioData.map(item => item.area)));
  const uniqueCategories = Array.from(new Set(portfolioData.map(item => item.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        
        {/* Filters and Stats */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {uniqueAreas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {totalDistance.toFixed(1)} km
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {Math.floor(totalTime / 60)}h {totalTime % 60}m
            </Badge>
            <Badge variant="secondary">
              {routePoints.length} stops
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div 
              ref={mapContainer} 
              style={{ height: `${height}px` }}
              className="w-full rounded-lg border relative"
            >
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route List */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Inspection Route
            </h4>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {/* Starting point */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  S
                </div>
                <div>
                  <p className="font-medium text-sm">Inspector Depot</p>
                  <p className="text-xs text-muted-foreground">Starting Point</p>
                </div>
              </div>

              {/* Route points */}
              {routePoints.map((point, index) => (
                <div key={point.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                  <div 
                    className="w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: getRiskColor(point.risk_score) }}
                  >
                    {point.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{point.name}</p>
                    <p className="text-xs text-muted-foreground">{point.area} • {point.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        🛣️ {point.distance_km?.toFixed(1)} km
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ⏱️ {point.eta_minutes} min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        🎯 {(point.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <h5 className="font-medium text-sm mb-2">Risk Levels</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>High Risk (&gt;70%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Medium Risk (40-70%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Low Risk (&lt;40%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}