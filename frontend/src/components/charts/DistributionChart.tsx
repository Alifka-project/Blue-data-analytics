"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface DistributionData {
  name: string;
  value: number;
  percentage?: number;
}

interface DistributionChartProps {
  data: DistributionData[];
  title?: string;
  description?: string;
  height?: number;
  type?: 'bar' | 'pie';
  colorScheme?: string[];
}

export function DistributionChart({ 
  data, 
  title = "Distribution Analysis", 
  description = "Data distribution visualization", 
  height = 400,
  type = 'bar',
  colorScheme = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
}: DistributionChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>(type);
  
  // Use only real data provided (no mock fallback)
  const chartData = data || [];

  // Calculate percentages if not provided
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = chartData.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100)
  }));

  const COLORS = colorScheme;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs rounded ${
              chartType === 'bar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-xs rounded ${
              chartType === 'pie' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'bar' ? (
            <BarChart data={dataWithPercentages} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'value' ? `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)` : value,
                  name === 'value' ? 'Count' : name
                ]}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                  name === 'value' ? 'Count' : name
                ]}
              />
            </PieChart>
          )}
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-lg">{total.toLocaleString()}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-lg">{dataWithPercentages.length}</div>
            <div className="text-muted-foreground">Categories</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-lg">
              {Math.round(total / dataWithPercentages.length).toLocaleString()}
            </div>
            <div className="text-muted-foreground">Average</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-lg">
              {Math.max(...dataWithPercentages.map(d => d.value)).toLocaleString()}
            </div>
            <div className="text-muted-foreground">Max</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Count</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Percentage</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Bar</th>
              </tr>
            </thead>
            <tbody>
              {dataWithPercentages.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {item.value.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {item.percentage?.toFixed(1)}%
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 rounded"
                        style={{ 
                          width: `${(item.percentage || 0) * 2}px`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {item.percentage?.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


