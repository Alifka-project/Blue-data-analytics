import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2025-08';
    const months = parseInt(searchParams.get('months') || '3');
    
    // Try to read from snapshots first
    const snapshotPath = join(process.cwd(), '..', 'snapshots', period, 'routes_3month.json');
    
    try {
      const scheduleData = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
      return NextResponse.json({ 
        data: scheduleData, 
        success: true, 
        period,
        months,
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      // Fallback to mock data if snapshot not found
      const mockScheduleData = {
        period_start: "2025-08-01",
        period_end: "2025-10-31",
        run_id: `schedule-${period}-${new Date().toISOString().split('T')[0]}`,
        calendar: [
          {
            date: "2025-08-15",
            inspector_id: 1,
            inspector_name: "Ahmed Al Mansouri",
            items: [
              {
                outlet_id: 1001,
                outlet_name: "Marina Restaurant",
                area: "Dubai Marina",
                lat: 25.0920,
                lon: 55.1381,
                scheduled_window: ["09:00", "10:00"],
                p_miss_cleaning: 0.85,
                forecast_volume_liters: 2500,
                priority: "High",
                ics_uid: "outlet-1001-2025-08-15"
              },
              {
                outlet_id: 1002,
                outlet_name: "Downtown Cafe",
                area: "Downtown",
                lat: 25.1972,
                lon: 55.2744,
                scheduled_window: ["10:30", "11:30"],
                p_miss_cleaning: 0.72,
                forecast_volume_liters: 1800,
                priority: "Med",
                ics_uid: "outlet-1002-2025-08-15"
              }
            ]
          },
          {
            date: "2025-08-16",
            inspector_id: 2,
            inspector_name: "Fatima Al Zahra",
            items: [
              {
                outlet_id: 1003,
                outlet_name: "JBR Hotel",
                area: "JBR",
                lat: 25.0920,
                lon: 55.1381,
                scheduled_window: ["08:00", "09:00"],
                p_miss_cleaning: 0.95,
                forecast_volume_liters: 3200,
                priority: "High",
                ics_uid: "outlet-1003-2025-08-16"
              }
            ]
          },
          {
            date: "2025-08-17",
            inspector_id: 1,
            inspector_name: "Ahmed Al Mansouri",
            items: [
              {
                outlet_id: 1004,
                outlet_name: "Business Bay Office",
                area: "Business Bay",
                lat: 25.1867,
                lon: 55.2667,
                scheduled_window: ["14:00", "15:00"],
                p_miss_cleaning: 0.65,
                forecast_volume_liters: 1200,
                priority: "Med",
                ics_uid: "outlet-1004-2025-08-17"
              }
            ]
          }
        ],
        areas: [
          {
            area: "Dubai Marina",
            centroid: { lat: 25.0920, lon: 55.1381 },
            polygon_geojson: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [55.1381, 25.0920],
                  [55.1381, 25.1020],
                  [55.1481, 25.1020],
                  [55.1481, 25.0920],
                  [55.1381, 25.0920]
                ]]
              }
            }
          },
          {
            area: "Downtown",
            centroid: { lat: 25.1972, lon: 55.2744 },
            polygon_geojson: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [55.2744, 25.1972],
                  [55.2744, 25.2072],
                  [55.2844, 25.2072],
                  [55.2844, 25.1972],
                  [55.2744, 25.1972]
                ]]
              }
            }
          }
        ],
        ics_file_url: `/api/schedule/forecast/download/${period}`
      };
      
      return NextResponse.json({ 
        data: mockScheduleData, 
        success: true, 
        period,
        months,
        timestamp: new Date().toISOString(),
        note: "Using mock data - snapshot not found"
      });
    }
  } catch (error) {
    console.error('Error in schedule forecast API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


