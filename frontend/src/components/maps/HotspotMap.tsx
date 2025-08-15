"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Route, AlertTriangle } from "lucide-react";

interface HotspotPoint {
  id: number;
  name: string;
  lat: number;
  lon: number;
  risk_score: number;
  grade: string;
  area: string;
  category: string;
  p_miss_cleaning: number;
  next_due_date: string;
}

interface HotspotMapProps {
  data?: HotspotPoint[];
  title?: string;
  description?: string;
  height?: number;
  showRoutes?: boolean;
}

export function HotspotMap({ 
  data, 
  title = "Spatial Hotspot Map", 
  description = "Missed cleaning density visualization",
  height = 400,
  showRoutes = false
}: HotspotMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hotspotData, setHotspotData] = useState<HotspotPoint[]>([]);

  // Fetch real data if none provided
  useEffect(() => {
    if (!data || data.length === 0) {
      fetchHotspotData();
    } else {
      setHotspotData(data);
    }
  }, [data]);

  const fetchHotspotData = async () => {
    try {
      const response = await fetch('/api/predictions/portfolio'); // Get ALL data
      const result = await response.json();
      
      if (result.success && result.data.items) {
        const transformedData = result.data.items.map((item: any) => ({
          id: item.outlet_id,
          name: item.name,
          lat: item.lat,
          lon: item.lon,
          risk_score: item.risk_illegal_dump,
          grade: item.grade,
          area: item.area,
          category: item.category,
          p_miss_cleaning: item.p_miss_cleaning,
          next_due_date: item.next_due_date
        }));
        setHotspotData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching hotspot data:', error);
      // No fallback - use empty data
      setHotspotData([]);
    }
  };

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (mapContainer.current) {
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
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [55.2708, 25.2048], // Dubai coordinates
        zoom: 10
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        if (hotspotData.length > 0) {
          addHotspotLayer();
        }
        if (showRoutes) {
          addRouteLayer();
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when data changes
  useEffect(() => {
    if (mapLoaded && hotspotData.length > 0) {
      addHotspotLayer();
    }
  }, [hotspotData, mapLoaded]);

  const addHotspotLayer = () => {
    if (!map.current || !mapLoaded || hotspotData.length === 0) return;

    // Remove existing layers if they exist
    if (map.current.getLayer('hotspots-circles')) {
      map.current.removeLayer('hotspots-circles');
    }
    if (map.current.getLayer('hotspots-labels')) {
      map.current.removeLayer('hotspots-labels');
    }
    if (map.current.getSource('hotspots')) {
      map.current.removeSource('hotspots');
    }

    // Add hotspot data source
    map.current.addSource('hotspots', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: hotspotData.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          },
          properties: {
            id: point.id,
            name: point.name,
            risk_score: point.risk_score,
            grade: point.grade,
            area: point.area,
            category: point.category,
            p_miss: point.p_miss_cleaning,
            next_due: point.next_due_date
          }
        }))
      }
    });

    // Add hotspot circles layer
    map.current.addLayer({
      id: 'hotspots-circles',
      type: 'circle',
      source: 'hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'risk_score'],
          0, 8,
          1, 20
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'risk_score'],
          0, '#10b981', // Green for low risk
          0.5, '#f59e0b', // Yellow for medium risk
          1, '#ef4444' // Red for high risk
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Note: Text labels removed to avoid MapLibre glyphs requirement
    // Labels will be shown in popups instead

    // Add click interaction
    map.current.on('click', 'hotspots-circles', (e) => {
      if (e.features && e.features[0]) {
        const properties = e.features[0].properties;
        const geometry = e.features[0].geometry;
        
        if (geometry.type === 'Point' && 'coordinates' in geometry) {
          const coordinates = geometry.coordinates.slice();
          
          // Create popup
          const popup = new maplibregl.Popup()
            .setLngLat([coordinates[0], coordinates[1]] as [number, number])
            .setHTML(`
              <div class="p-3 min-w-[200px]">
                <h3 class="font-semibold text-sm">${properties?.name || 'Unknown'}</h3>
                <div class="text-xs text-gray-600 mt-2 space-y-1">
                  <div><strong>Area:</strong> ${properties?.area || 'Unknown'}</div>
                  <div><strong>Category:</strong> ${properties?.category || 'Unknown'}</div>
                  <div><strong>Grade:</strong> ${properties?.grade || 'Unknown'}</div>
                  <div><strong>Risk:</strong> <span class="${(properties?.risk_score || 0) > 0.7 ? 'text-red-600' : (properties?.risk_score || 0) > 0.4 ? 'text-yellow-600' : 'text-green-600'}">${((properties?.risk_score || 0) * 100).toFixed(0)}%</span></div>
                  <div><strong>Miss Prob:</strong> ${((properties?.p_miss || 0) * 100).toFixed(0)}%</div>
                  <div><strong>Next Due:</strong> ${properties?.next_due || 'Unknown'}</div>
                </div>
              </div>
            `)
            .addTo(map.current!);
        }
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'hotspots-circles', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'hotspots-circles', () => {
      map.current!.getCanvas().style.cursor = '';
    });
  };

  const addRouteLayer = () => {
    if (!map.current || !mapLoaded) return;

    // Generate sample routes based on areas
    const areas = [...new Set(hotspotData.map(item => item.area))];
    const routes = areas.map((area, index) => {
      const areaOutlets = hotspotData.filter(item => item.area === area);
      if (areaOutlets.length === 0) return null;

      // Create a simple route connecting outlets in the same area
      const coordinates = areaOutlets.map(outlet => [outlet.lon, outlet.lat]);
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: coordinates
        },
        properties: {
          route_id: `route-${index + 1}`,
          area: area,
          stops: areaOutlets.length,
          total_distance: `${(areaOutlets.length * 2).toFixed(1)} km`
        }
      };
    }).filter((route): route is NonNullable<typeof route> => route !== null);

    const routeData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: routes
    };

    map.current.addSource('routes', {
      type: 'geojson',
      data: routeData
    });

    map.current.addLayer({
      id: 'routes-lines',
      type: 'line',
      source: 'routes',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.6
      }
    });

    // Add route labels
    map.current.addLayer({
      id: 'routes-labels',
      type: 'symbol',
      source: 'routes',
      layout: {
        'symbol-placement': 'line-center',
        'text-field': ['get', 'area'],
        'text-size': 11,
        'text-rotate': 0
      },
      paint: {
        'text-color': '#1e40af',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {hotspotData.length} hotspots
          </Badge>
          <Badge variant="outline" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {hotspotData.filter(p => p.risk_score > 0.7).length} high risk
          </Badge>
          {showRoutes && (
            <Badge variant="outline" className="text-xs">
              <Route className="h-3 w-3 mr-1" />
              Routes shown
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapContainer} 
          className="w-full rounded-lg border"
          style={{ height: `${height}px` }}
        />
        
        {/* Map Controls */}
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Risk</span>
            </div>
          </div>
          <div className="text-xs">
            Click on hotspots for details
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


