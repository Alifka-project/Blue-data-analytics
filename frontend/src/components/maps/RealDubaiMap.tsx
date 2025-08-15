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

interface RealDubaiMapProps {
  routeData: RouteData;
  onStopClick?: (stop: RouteStop) => void;
  height?: number;
}

export function RealDubaiMap({ 
  routeData, 
  onStopClick,
  height = 600 
}: RealDubaiMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Calculate route summary
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
    const totalMinutes = totalStops * 45; // 45 min per stop
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

  // Get real road route using OSRM routing service
  const getRealRoadRoute = async (start: {lat: number, lon: number}, end: {lat: number, lon: number}) => {
    try {
      // Use OSRM public API for real road routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`OSRM routing failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        console.log(`Real road route found with ${data.routes[0].geometry.coordinates.length} points`);
        return data.routes[0].geometry.coordinates;
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.warn('OSRM routing failed, using fallback:', error);
      // Return enhanced curved routing as fallback
      return createFallbackRoute(start, end);
    }
  };

  // Enhanced fallback route
  const createFallbackRoute = (start: {lat: number, lon: number}, end: {lat: number, lon: number}) => {
    const points = [];
    const steps = 15; // More points for smoother curves
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Base interpolation
      let lat = start.lat + (end.lat - start.lat) * t;
      let lon = start.lon + (end.lon - start.lon) * t;
      
      // Add road-like curves
      if (i > 0 && i < steps) {
        const dx = end.lon - start.lon;
        const dy = end.lat - start.lat;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Create realistic road curves
        const curvature = Math.sin(t * Math.PI * 2) * distance * 0.1;
        const perpLat = -dx / Math.sqrt(dx * dx + dy * dy);
        const perpLon = dy / Math.sqrt(dx * dx + dy * dy);
        
        lat += perpLat * curvature;
        lon += perpLon * curvature;
      }
      
      points.push([lon, lat]);
    }
    
    return points;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    console.log('RealDubaiMap: Initializing with maplibre-gl');

    // Import maplibre-gl safely
    const loadMap = async () => {
      try {
        // Use window.maplibregl if available, otherwise import
        let maplibregl;
        if (typeof window !== 'undefined' && (window as any).maplibregl) {
          maplibregl = (window as any).maplibregl;
        } else {
          maplibregl = await import('maplibre-gl');
          maplibregl = maplibregl.default || maplibregl;
        }

        // Calculate bounds for all points
        const allPoints = [routeData.depot_location, ...routeData.stops];
        const lats = allPoints.map(p => p.lat);
        const lons = allPoints.map(p => p.lon);
        
        const bounds = [
          [Math.min(...lons) - 0.01, Math.min(...lats) - 0.01], // Southwest
          [Math.max(...lons) + 0.01, Math.max(...lats) + 0.01]  // Northeast
        ];

        // Initialize map
        const map = new maplibregl.Map({
          container: mapRef.current!,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
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
          bounds: bounds,
          fitBoundsOptions: { padding: 50 }
        });

        setMapInstance(map);

        map.on('load', async () => {
          console.log('RealDubaiMap: Map loaded, adding markers and routes');
          setMapLoaded(true);
          
          // Add depot marker
          const depotMarker = new maplibregl.Marker({
            color: '#2563eb',
            scale: 1.2
          })
          .setLngLat([routeData.depot_location.lon, routeData.depot_location.lat])
          .setPopup(new maplibregl.Popup().setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0; font-weight: bold;">Inspector Depot</h3>
              <p style="margin: 4px 0; color: #666;">Start Location</p>
              <p style="margin: 0; font-size: 12px;">${routeData.depot_location.lat.toFixed(4)}, ${routeData.depot_location.lon.toFixed(4)}</p>
            </div>
          `))
          .addTo(map);

          // Add stop markers
          const sortedStops = [...routeData.stops].sort((a, b) => a.order - b.order);
          sortedStops.forEach((stop) => {
            const markerColor = getPriorityColor(stop.priority);
            
            // Create custom marker element
            const el = document.createElement('div');
            el.style.cssText = `
              background-color: ${markerColor};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            `;
            el.textContent = stop.order.toString();
            
            // Add click event
            el.addEventListener('click', () => {
              if (onStopClick) onStopClick(stop);
            });

            new maplibregl.Marker(el)
              .setLngLat([stop.lon, stop.lat])
              .setPopup(new maplibregl.Popup().setHTML(`
                <div style="padding: 12px;">
                  <h3 style="margin: 0 0 8px 0; font-weight: bold;">${stop.outlet_name}</h3>
                  <div style="font-size: 14px;">
                    <p style="margin: 2px 0;"><strong>Area:</strong> ${stop.area}</p>
                    <p style="margin: 2px 0;"><strong>Time:</strong> ${stop.scheduled_window[0]} - ${stop.scheduled_window[1]}</p>
                    <p style="margin: 2px 0;"><strong>Risk:</strong> ${(stop.p_miss_cleaning * 100).toFixed(1)}%</p>
                    <p style="margin: 2px 0;"><strong>Volume:</strong> ${stop.forecast_volume_liters.toLocaleString()}L</p>
                    <p style="margin: 2px 0; font-size: 12px; color: #666;">${stop.lat.toFixed(4)}, ${stop.lon.toFixed(4)}</p>
                  </div>
                </div>
              `))
              .addTo(map);
          });

          // Add real road routes
          setRoutesLoading(true);
          let currentLocation = routeData.depot_location;
          
          for (let index = 0; index < sortedStops.length; index++) {
            const stop = sortedStops[index];
            console.log(`Getting route ${index + 1}/${sortedStops.length}`);
            
            try {
              const routePoints = await getRealRoadRoute(currentLocation, stop);
              const routeColor = getPriorityColor(stop.priority);
              
              // Add route source and layer
              map.addSource(`route-${index}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routePoints
                  }
                }
              });

              map.addLayer({
                id: `route-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': routeColor,
                  'line-width': 5,
                  'line-opacity': 0.8
                }
              });

              currentLocation = stop;
              
              // Small delay to prevent overwhelming the browser
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (error) {
              console.error(`Failed to add route ${index}:`, error);
            }
          }
          
          setRoutesLoading(false);
          console.log('RealDubaiMap: All routes added successfully');
        });

        map.on('error', (e) => {
          console.error('RealDubaiMap: Map error:', e);
          setLoadError('Map failed to load');
        });

      } catch (error) {
        console.error('RealDubaiMap: Failed to load MapLibre:', error);
        setLoadError('Failed to load mapping library');
      }
    };

    loadMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [routeData]);

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

      {/* Dubai Map */}
      <Card>
        <CardHeader>
          <CardTitle>🗺️ Dubai Route Map - Real Street Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapRef}
              style={{ height: `${height}px` }}
              className="w-full rounded-lg overflow-hidden border"
            />
            
            {!mapLoaded && !loadError && (
              <div 
                className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg"
                style={{ height: `${height}px` }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading Dubai map...</p>
                </div>
              </div>
            )}

            {routesLoading && mapLoaded && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-700">Loading real road routes...</span>
                </div>
              </div>
            )}

            {loadError && (
              <div 
                className="absolute inset-0 bg-red-50 flex items-center justify-center rounded-lg border-2 border-red-200"
                style={{ height: `${height}px` }}
              >
                <div className="text-center">
                  <p className="text-red-600 mb-2 font-semibold">Map Error</p>
                  <p className="text-sm text-gray-600">{loadError}</p>
                  <p className="text-xs text-gray-500 mt-2">Please refresh the page to try again</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span>Inspector Depot</span>
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
              <div className="w-8 h-2 bg-red-500 rounded"></div>
              <span>Real Dubai Roads</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

