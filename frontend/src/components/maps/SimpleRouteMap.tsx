"use client";

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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

interface SimpleRouteMapProps {
  routeData: RouteData;
  onStopClick?: (stop: RouteStop) => void;
  height?: number;
}

export function SimpleRouteMap({ 
  routeData, 
  onStopClick,
  height = 600 
}: SimpleRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('SimpleRouteMap: Initializing map with data:', routeData);

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
              tileSize: 256,
              attribution: '© CARTO'
            }
          },
          layers: [
            {
              id: 'carto-light',
              type: 'raster',
              source: 'carto-light'
            }
          ]
        },
        center: [routeData.depot_location.lon, routeData.depot_location.lat],
        zoom: 11,
        maxZoom: 18,
        minZoom: 8
      });

      map.current.on('load', () => {
        console.log('SimpleRouteMap: Map loaded successfully');
        setMapLoaded(true);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('SimpleRouteMap: Map error:', e);
        setError('Failed to load map');
      });

    } catch (err) {
      console.error('SimpleRouteMap: Failed to initialize map:', err);
      setError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [routeData.depot_location]);

  // Add route data to map
  useEffect(() => {
    if (!map.current || !mapLoaded || !routeData.stops.length) {
      console.log('SimpleRouteMap: Skipping route data - requirements not met', {
        mapExists: !!map.current,
        mapLoaded,
        stopsLength: routeData.stops.length
      });
      return;
    }

    console.log('SimpleRouteMap: Adding route data to map');

    try {
      // Clear existing sources and layers
      const existingSources = ['route', 'stops', 'depot'];
      const existingLayers = ['route-line', 'stops', 'stop-labels', 'depot'];

      existingLayers.forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
      });

      existingSources.forEach(sourceId => {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      });

      // Add depot
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

      // Create route line
      const routeCoordinates = [
        [routeData.depot_location.lon, routeData.depot_location.lat],
        ...routeData.stops
          .sort((a, b) => a.order - b.order)
          .map(stop => [stop.lon, stop.lat])
      ];

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
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
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add stops
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
              color: stop.priority === 'High' ? '#ef4444' : stop.priority === 'Med' ? '#f59e0b' : '#10b981'
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
            ['==', ['get', 'priority'], 'High'], 10,
            ['==', ['get', 'priority'], 'Med'], 8,
            6
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'priority'], 'High'], '#ef4444',
            ['==', ['get', 'priority'], 'Med'], '#f59e0b',
            '#10b981'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Add numbered labels
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

      // Add click handlers
      map.current.on('click', 'stops', (e) => {
        if (e.features && e.features[0]) {
          const stop = e.features[0].properties as RouteStop;
          console.log('Stop clicked:', stop);
          
          if (onStopClick) {
            onStopClick(stop);
          }

          // Create popup
          new maplibregl.Popup()
            .setLngLat([stop.lon, stop.lat])
            .setHTML(`
              <div class="p-3">
                <h3 class="font-semibold">${stop.outlet_name}</h3>
                <p><strong>Order:</strong> #${stop.order}</p>
                <p><strong>Area:</strong> ${stop.area}</p>
                <p><strong>Risk:</strong> ${(stop.p_miss_cleaning * 100).toFixed(1)}%</p>
                <p><strong>Priority:</strong> ${stop.priority}</p>
                <p><strong>Window:</strong> ${stop.scheduled_window[0]} - ${stop.scheduled_window[1]}</p>
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

      console.log('SimpleRouteMap: Route data added successfully');

    } catch (err) {
      console.error('SimpleRouteMap: Failed to add route data:', err);
      setError('Failed to add route data to map');
    }

  }, [mapLoaded, routeData, onStopClick]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Map Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Route: {routeData.inspector_name} • {routeData.stops.length} stops
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <CardTitle>Route Map - {routeData.date}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapContainer} 
              style={{ height }} 
              className="w-full rounded-lg overflow-hidden border bg-gray-100"
            />
            
            {/* Loading Overlay */}
            {!mapLoaded && !error && (
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

