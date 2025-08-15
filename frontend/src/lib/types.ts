// Core data types for Blue Data Analytics Dashboard

export interface KPIOverview {
  period: string;
  run_id: string;
  model_version: string;
  grease_collected_tons: number;
  forecast_tons: number;
  missed_cleanings: number;
  revenue_change_pct: number;
  illegal_dump_alerts: number;
  co2_saved_kg: number;
}

export interface PortfolioItem {
  outlet_id: number;
  name: string;
  area: string;
  category: string;
  grade: "A" | "B" | "C" | "D";
  p_miss_cleaning: number;
  forecast_volume_liters: number;
  risk_illegal_dump: number;
  next_due_date: string;
  lat: number;
  lon: number;
  shap_top3: Array<{feature: string; impact: number}>;
}

export interface RouteStop {
  seq: number;
  outlet_id: number;
  outlet_name: string;
  lat: number;
  lon: number;
  eta: string;
  service_minutes: number;
  travel_minutes_from_prev: number;
  distance_km_from_prev: number;
}

export interface Route {
  inspector_id: number;
  name: string;
  stops: RouteStop[];
  path_geojson: GeoJSON.FeatureCollection;
}

export interface RouteSummary {
  inspectors: number;
  total_km: number;
  total_duration_min: number;
  km_saved_vs_baseline: number;
  co2_saved_kg: number;
}

export interface RoutesToday {
  run_id: string;
  date: string;
  summary: RouteSummary;
  routes: Route[];
}

export interface ScheduleItem {
  outlet_id: number;
  outlet_name: string;
  area: string;
  lat: number;
  lon: number;
  scheduled_window: [string, string];
  p_miss_cleaning: number;
  forecast_volume_liters: number;
  priority: "High" | "Med" | "Low";
  ics_uid: string;
}

export interface CalendarDay {
  date: string;
  inspector_id: number;
  inspector_name: string;
  items: ScheduleItem[];
}

export interface AreaPolygon {
  area: string;
  centroid: {lat: number; lon: number};
  polygon_geojson: GeoJSON.Feature;
}

export interface ScheduleForecast {
  period_start: string;
  period_end: string;
  run_id: string;
  calendar: CalendarDay[];
  areas: AreaPolygon[];
  ics_file_url: string;
}

export interface HotspotData {
  period: string;
  hotspots: Array<{
    lat: number;
    lon: number;
    density: number;
    area: string;
    risk_score: number;
  }>;
}

export interface EDADistributions {
  period: string;
  histograms: {
    volume: Array<{bin: string; count: number}>;
    outlet_count: Array<{bin: string; count: number}>;
    inter_cleaning_interval: Array<{bin: string; count: number}>;
  };
  boxplots: {
    by_category: Record<string, Array<{min: number; q1: number; median: number; q3: number; max: number}>>;
    by_area: Record<string, Array<{min: number; q1: number; median: number; q3: number; max: number}>>;
  };
}

export interface EDACorrelations {
  period: string;
  correlation_matrix: Record<string, Record<string, number>>;
  bivariate_analysis: Array<{
    x_var: string;
    y_var: string;
    correlation: number;
    scatter_data: Array<{x: number; y: number}>;
  }>;
}

export interface RevenueWaterfall {
  period: string;
  components: Array<{
    category: string;
    amount: number;
    type: "base" | "increase" | "decrease";
    description: string;
  }>;
  total: number;
  anomalies: Array<{
    category: string;
    amount: number;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  meta?: {
    type: "table" | "line" | "bar" | "heatmap" | "map" | "calendar" | "waterfall";
    title: string;
    columns?: string[];
    data?: any;
    map?: {
      geojson: any;
      focus: {lat: number; lon: number; zoom: number};
    };
  };
}

export interface ChatTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatResponse {
  answer: string;
  tools_used: ChatTool[];
  meta?: ChatMessage["meta"];
}

// Utility types
export type Period = string; // Format: "YYYY-MM"
export type DateString = string; // Format: "YYYY-MM-DD"
export type InspectorId = number;
export type OutletId = number;

// API Response types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface APIError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

// Filter and query types
export interface PortfolioFilters {
  period?: Period;
  area?: string;
  category?: string;
  topN?: number;
  min_risk?: number;
  grade?: string;
}

export interface ScheduleFilters {
  from: Period;
  months: number;
  inspector_id?: InspectorId;
  area?: string;
  priority?: string;
}

export interface MapFilters {
  period: Period;
  area?: string;
  risk_threshold?: number;
  show_routes?: boolean;
  show_hotspots?: boolean;
}

// Chart and visualization types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLayer {
  id: string;
  type: "route" | "hotspot" | "outlet" | "area";
  visible: boolean;
  data: any;
  style: any;
}

// Export types
export interface ExportOptions {
  format: "pdf" | "excel" | "csv";
  period: Period;
  include_charts: boolean;
  include_maps: boolean;
  include_metadata: boolean;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  expires_at: string;
}
