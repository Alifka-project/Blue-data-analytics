import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2025-08';
    
    // Try to read from snapshots first
    const snapshotPath = join(process.cwd(), '..', 'snapshots', period, 'eda_cache.json');
    
    try {
      const edaData = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
      return NextResponse.json({ 
        data: edaData, 
        success: true, 
        period,
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      // Fallback to mock data if snapshot not found
      const mockEDAData = {
        period: period,
        total_records: 29945,
        total_outlets: 1250,
        areas: {
          "Dubai Marina": 4500,
          "Downtown": 3800,
          "JBR": 3200,
          "Business Bay": 2800,
          "Al Quoz": 2500,
          "Jumeirah": 2200,
          "Deira": 2000,
          "Bur Dubai": 1800,
          "Other": 4145
        },
        categories: {
          "Restaurant": 12000,
          "Hotel": 8500,
          "Cafe": 4500,
          "Shopping Mall": 3000,
          "Office Building": 2000,
          "Other": 945
        },
        grades: {
          "A": 4500,
          "B": 7500,
          "C": 12000,
          "D": 5945
        },
        coordinate_coverage: {
          has_coordinates: true,
          lat_range: [25.0920, 25.2667],
          lon_range: [55.1381, 55.3000]
        },
        distributions: {
          volume_distribution: {
            bins: ["0-500", "500-1000", "1000-2000", "2000-5000", "5000+"],
            counts: [5000, 8000, 12000, 4000, 945]
          },
          interval_distribution: {
            bins: ["0-7", "7-14", "14-30", "30-60", "60+"],
            counts: [3000, 8000, 15000, 3500, 445]
          }
        }
      };
      
      return NextResponse.json({ 
        data: mockEDAData, 
        success: true, 
        period,
        timestamp: new Date().toISOString(),
        note: "Using mock data - snapshot not found"
      });
    }
  } catch (error) {
    console.error('Error in EDA distributions API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


