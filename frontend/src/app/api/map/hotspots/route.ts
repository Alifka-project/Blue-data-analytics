import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2025-08';
    const area = searchParams.get('area') || '';
    const minRisk = parseFloat(searchParams.get('minRisk') || '0.5');
    
    // Try to read from snapshots first
    const snapshotPath = join(process.cwd(), '..', 'snapshots', period, 'predictions.json');
    
    try {
      const predictionsData = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
      let hotspots = predictionsData.items || [];
      
      // Filter by area if specified
      if (area) {
        hotspots = hotspots.filter((item: any) => item.area === area);
      }
      
      // Filter by minimum risk
      hotspots = hotspots.filter((item: any) => item.p_miss_cleaning >= minRisk);
      
      // Sort by risk (highest first)
      hotspots.sort((a: any, b: any) => b.p_miss_cleaning - a.p_miss_cleaning);
      
      // Return ALL hotspots (no artificial limit)
      
      return NextResponse.json({ 
        data: {
          hotspots,
          total: hotspots.length,
          area: area || 'all',
          minRisk,
          period
        }, 
        success: true, 
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      // Load from portfolio API if snapshot not found
      try {
        const portfolioResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/predictions/portfolio`);
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.success && portfolioData.data.items) {
          let hotspots = portfolioData.data.items.filter((item: any) => item.p_miss_cleaning >= minRisk);
          
          if (area && area !== 'all') {
            hotspots = hotspots.filter((item: any) => item.area === area);
          }
          
          hotspots.sort((a: any, b: any) => b.p_miss_cleaning - a.p_miss_cleaning);
          
          return NextResponse.json({ 
            data: {
              hotspots,
              total: hotspots.length,
              area: area || 'all',
              minRisk,
              period
            }, 
            success: true, 
            message: 'Hotspots from portfolio predictions',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      }
      
      // Return empty data if all fails
      return NextResponse.json({ 
        data: {
          hotspots: [],
          total: 0,
          area: area || 'all',
          minRisk,
          period
        }, 
        success: true, 
        message: 'No hotspot data available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in map hotspots API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}