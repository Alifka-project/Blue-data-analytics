"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendDataPoint {
  year: number;
  grease_collected: number;
  forecast: number;
  upper_bound: number;
  lower_bound: number;
  anomaly: boolean;
}

interface TrendChartProps {
  data?: TrendDataPoint[];
  title?: string;
  description?: string;
  height?: number;
}

export function TrendChart({ data, title = "15-Year Trend Analysis", description = "Historical performance with forecast confidence intervals", height = 400 }: TrendChartProps) {
  // Use only real data provided (no mock fallback)
  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
        <div>
          <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 10 }}
              interval={2}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: 'Weekly Period (2023)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Grease Collected (tons)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} tons`, 
                name === 'grease_collected' ? 'Actual' : 
                name === 'forecast' ? 'Forecast' : 
                name === 'upper_bound' ? 'Upper Bound' : 'Lower Bound'
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            
            {/* Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="upper_bound"
              stackId="1"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="lower_bound"
              stackId="1"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
              fillOpacity={0.3}
            />
            
            {/* Actual Data Line */}
            <Line
              type="monotone"
              dataKey="grease_collected"
              stroke="#1e40af"
              strokeWidth={3}
              dot={{ fill: '#1e40af', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#1e40af', strokeWidth: 2 }}
              name="Actual"
            />
            
            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2 }}
              name="Forecast"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Anomaly Indicators */}
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Actual Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-dashed"></div>
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span>Confidence Interval</span>
            </div>
          </div>
        </div>
        </div>
        ) : (
          <div style={{ height }} className="flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No trend data available</p>
              <p className="text-sm">Data will be displayed when historical trends are available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


