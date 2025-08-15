# Blue Data Analytics Dashboard - Refactor Plan

## 📋 Executive Summary

**Client**: Cleanon (UAE) - Grease Trap Recycling Facility  
**Project Value**: $100,000 USD  
**Goal**: Transform existing repo into enterprise-grade analytics product  
**Timeline**: Immediate refactor and localhost deployment  

## 🎯 Scope Requirements (Client Mandates)

### Core Business Functions
- ✅ **Predict missed cleanings** (current & next month)
- ✅ **Dynamic grading** of establishments  
- ✅ **Forecast grease waste volumes**
- ✅ **Smart scheduling** with routing optimization
- ✅ **Illegal dumping risk** identification
- ✅ **Revenue fluctuation** tracking & explanation
- ✅ **Environmental impact** reporting (CO₂ saved)
- ✅ **Process adoption** & traceability

### New Requirements
- 🆕 **Geospatial routing** with ETA visualization
- 🆕 **3-month scheduling forecast** with calendar view
- 🆕 **Inspection area points** from lat/lon coordinates
- 🆕 **Route polylines** with real travel times/distances

## 🏗️ Current Structure Analysis

### What We Keep
```
✅ data/raw/Blue-data2.xlsx          # Core dataset
✅ backend/utils/                     # Data processing utilities  
✅ backend/config/                    # Configuration management
✅ frontend/src/components/           # Reusable UI components
✅ frontend/src/pages/                # Page structure (adapt existing)
✅ Makefile                          # Development automation
✅ pyproject.toml                    # Python project config
```

### What We Replace
```
❌ backend/app/main.py               # Replace with Next.js API routes
❌ backend/requirements.txt           # Update for new ML stack
❌ frontend/package.json             # Migrate to Next.js
❌ frontend/src/App.js               # Convert to Next.js App Router
❌ frontend/tailwind.config.js       # Update for shadcn/ui
```

### What We Add
```
🆕 frontend/                         # Next.js application
🆕 frontend/app/                     # App Router pages
🆕 frontend/lib/                     # TypeScript types & utilities
🆕 frontend/components/ui/           # shadcn/ui components
🆕 scripts/etl.py                    # Data processing pipeline
🆕 scripts/train.py                  # ML model training
🆕 scripts/score.py                  # Prediction scoring
🆕 scripts/plan_3month.py            # 3-month scheduling
🆕 snapshots/                        # Precomputed JSON artifacts
🆕 docs/api/                         # API documentation
🆕 docs/user/                        # User guides
```

## 📱 Page Mapping (Current → Final)

### 1. Dashboard (Executive)
**Current**: `frontend/src/pages/ProfessionalSummary.js`  
**Final**: `frontend/app/dashboard/page.tsx`  
**Upgrades**:
- KPI cards with actual vs forecast metrics
- 15-year trend with confidence intervals
- Risk leaderboard with SHAP explanations
- Grade heatmap (Area × Category)
- Hotspot mini-map for missed cleaning density

### 2. EDA (Exploration)  
**Current**: `frontend/src/pages/DataExploration.js`  
**Final**: `frontend/app/eda/page.tsx`  
**Upgrades**:
- Histograms and box plots by category/area
- Correlation heatmap with bivariate analysis
- Spatial heatmap with choropleth visualization
- Revenue waterfall with anomaly detection

### 3. Prediction (Portfolio + Route Viewer)
**Current**: `frontend/src/pages/PredictiveModel.js`  
**Final**: `frontend/app/prediction/page.tsx`  
**Upgrades**:
- Portfolio table with risk metrics
- Outlet detail drawer with forecasts
- Route viewer for selected dates
- Precomputed route JSON integration

### 4. Chat (AI Assistant)
**Current**: `frontend/src/pages/EnhancedChatbot.js`  
**Final**: `frontend/app/chat/page.tsx`  
**Upgrades**:
- OpenAI tools-only implementation
- Natural language query processing
- Auto-render charts/tables/maps
- Meta-driven visualization

### 5. Reporting (NEW - 3-Month Scheduling)
**Current**: `frontend/src/pages/InspectionScheduling.js`  
**Final**: `frontend/app/reporting/page.tsx`  
**Upgrades**:
- 3-month scheduling calendar
- MapLibre integration with routing
- Inspection area points visualization
- ETA & timeline panel
- ICS export functionality

## 🔌 API Architecture (Next.js)

### API Routes Structure
```
frontend/app/api/
├── kpi/
│   └── overview/route.ts           # GET /api/kpi/overview
├── predictions/
│   ├── portfolio/route.ts          # GET /api/predictions/portfolio  
│   └── outlet/[id]/route.ts       # GET /api/predictions/outlet/[id]
├── schedule/
│   ├── routes/today/route.ts       # GET /api/schedule/routes/today
│   └── forecast/route.ts           # GET /api/schedule/forecast
├── map/
│   └── hotspots/route.ts           # GET /api/map/hotspots
├── eda/
│   ├── distributions/route.ts      # GET /api/eda/distributions
│   └── correlations/route.ts       # GET /api/eda/correlations
├── reports/
│   └── monthly/route.ts            # POST /api/reports/monthly
└── chat/
    └── tools/route.ts              # POST /api/chat/tools
```

### Data Flow
1. **Local Training**: Python scripts generate JSON snapshots
2. **Storage**: Snapshots stored in `/public/snapshots/` or Vercel Blob
3. **API Routes**: Next.js reads precomputed data (no heavy compute)
4. **Frontend**: React components consume API data
5. **Caching**: ETag/Cache-Control + React Query for performance

## 📊 Data Contracts & Types

### TypeScript Definitions
```typescript
// frontend/lib/types.ts
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

export interface ScheduleForecast {
  period_start: string;
  period_end: string;
  run_id: string;
  calendar: Array<{
    date: string;
    inspector_id: number;
    inspector_name: string;
    items: Array<{
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
    }>;
  }>;
  areas: Array<{
    area: string;
    centroid: {lat: number; lon: number};
    polygon_geojson: GeoJSON.Feature;
  }>;
  ics_file_url: string;
}
```

## 🗺️ Geospatial Strategy

### Coordinate Integration
1. **Dataset Enhancement**: Extract lat/lon from Blue-data2.xlsx
2. **Area Mapping**: Create convex hulls/alpha-shapes from outlet points
3. **Routing**: Use OSRM/Valhalla for real road network calculations
4. **Visualization**: MapLibre for interactive maps with polylines

### Flow Architecture
```
Blue-data2.xlsx (lat/lon) 
    ↓
ETL Pipeline (scripts/etl.py)
    ↓
Feature Engineering (spatial densities)
    ↓
ML Training (scripts/train.py)
    ↓
Prediction Scoring (scripts/score.py)
    ↓
Route Optimization (OR-Tools + OSRM)
    ↓
JSON Snapshots (/snapshots/{period}/)
    ↓
Next.js API Routes (read-only)
    ↓
Frontend Components (MapLibre + Recharts)
```

## 🤖 ML Pipeline (Local Training)

### Model Stack
1. **Missed Cleaning Prediction**: LightGBM with SHAP explanations
2. **Volume Forecasting**: Prophet/SARIMA for time series
3. **Illegal Dump Risk**: Isolation Forest + geospatial features
4. **Revenue Drivers**: Gradient Boosting with SHAP analysis

### Training Scripts
```python
# scripts/train.py
- Temporal cross-validation
- Leakage prevention
- Model calibration
- SHAP computation
- Metrics reporting

# scripts/score.py --period YYYY-MM
- Generate predictions.json
- Create kpi_overview.json
- Produce eda_cache.json
- Solve VRP with OR-Tools
- Compute routes with OSRM

# scripts/plan_3month.py --from YYYY-MM --months 3
- Build rolling 3-month plan
- Route optimization per day
- Generate ICS calendar file
- Create routes_3month.json
```

## 🎨 UI/UX & Branding

### Design System
- **Theme**: Navy (#1e3a8a) + White + Green (#10b981)
- **Typography**: Montserrat (headings) + Open Sans (body)
- **Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React (consistent iconography)

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Accessibility compliance (ARIA, keyboard nav)
- SEO optimization (meta tags, structured data)

## 🚀 Deployment Strategy

### Localhost Development
1. **Frontend**: Next.js dev server (port 3000)
2. **Backend**: Next.js API routes (same port)
3. **Data**: Local JSON snapshots
4. **ML**: Local Python environment

### Production Readiness
1. **Vercel Deployment**: Next.js app with serverless functions
2. **Storage**: Vercel Blob for snapshots
3. **Caching**: Edge caching + React Query
4. **Monitoring**: Vercel Analytics + error tracking

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup Next.js project structure
- [ ] Migrate existing components
- [ ] Create TypeScript types
- [ ] Setup development environment

### Phase 2: Data Pipeline (Week 2)
- [ ] Implement ETL pipeline
- [ ] Train ML models
- [ ] Generate JSON snapshots
- [ ] Create API routes

### Phase 3: Frontend Development (Week 3)
- [ ] Build dashboard page
- [ ] Implement EDA page
- [ ] Create prediction page
- [ ] Build chat interface

### Phase 4: Advanced Features (Week 4)
- [ ] Implement reporting page
- [ ] Add MapLibre integration
- [ ] Create 3-month scheduling
- [ ] Add ICS export functionality

### Phase 5: Polish & Testing (Week 5)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Documentation completion

## 🔍 Quality Gates

### Technical Requirements
- [ ] JSON schema validation passes
- [ ] TTFB < 300ms (cached responses)
- [ ] Page render < 2s on Vercel
- [ ] All API routes return valid data
- [ ] Geospatial coordinates properly integrated

### Business Requirements
- [ ] All 5 pages functional
- [ ] ML predictions working
- [ ] Routing with ETA visualization
- [ ] 3-month scheduling calendar
- [ ] Chatbot with tools integration

### Scope Traceability
- [ ] Missed cleaning predictions ✅
- [ ] Dynamic grading system ✅
- [ ] Volume forecasting ✅
- [ ] Smart scheduling ✅
- [ ] Illegal dumping risk ✅
- [ ] Revenue analysis ✅
- [ ] Environmental reporting ✅
- [ ] Process adoption ✅

## 📚 Documentation

### Technical Docs
- API reference with examples
- Data schema documentation
- ML model specifications
- Deployment guide

### User Guides
- Dashboard usage instructions
- EDA exploration guide
- Prediction interpretation
- Scheduling workflow
- Report generation

## 🎯 Success Metrics

### Technical Metrics
- **Performance**: < 2s page load, < 300ms API response
- **Reliability**: 99.9% uptime, error rate < 0.1%
- **Scalability**: Handle 1000+ concurrent users

### Business Metrics
- **User Adoption**: 80% of inspectors use dashboard
- **Process Efficiency**: 25% reduction in missed cleanings
- **Route Optimization**: 15% reduction in travel time
- **Revenue Impact**: 10% increase in service efficiency

---

**Next Steps**: Begin Phase 1 implementation with Next.js setup and component migration.

