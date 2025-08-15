"use client";

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CorrelationData {
  x: string;
  y: string;
  correlation: number;
}

interface CorrelationHeatmapProps {
  data?: CorrelationData[];
  title?: string;
  description?: string;
  height?: number;
}

export function CorrelationHeatmap({ data, title = "Correlation Analysis", description = "Relationships between key variables", height = 400 }: CorrelationHeatmapProps) {
  // Use only real data provided (no mock fallback)
  const chartData = data || [];

  // Get unique variables for axes
  const xVariables = Array.from(new Set(chartData.map(d => d.x)));
  const yVariables = Array.from(new Set(chartData.map(d => d.y)));

  // Create a matrix for the heatmap
  const matrixData = xVariables.map(xVar => {
    const row: any = { x: xVar };
    yVariables.forEach(yVar => {
      const point = chartData.find(d => d.x === xVar && d.y === yVar);
      row[yVar] = point ? point.correlation : 0;
    });
    return row;
  });

  // Function to get color based on correlation value
  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return '#dc2626'; // Strong positive - red
    if (value >= 0.3) return '#ea580c'; // Moderate positive - orange
    if (value >= -0.3) return '#fbbf24'; // Weak correlation - yellow
    if (value >= -0.7) return '#10b981'; // Moderate negative - green
    return '#3b82f6'; // Strong negative - blue
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="category" 
              dataKey="x" 
              name="Variable X"
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              type="category" 
              dataKey="y" 
              name="Variable Y"
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(3)}`, 
                name === 'correlation' ? 'Correlation' : name
              ]}
              labelFormatter={(label) => `Correlation: ${label}`}
            />
            
            {/* Create scatter points for each correlation */}
            {chartData.map((point, index) => (
              <Scatter
                key={index}
                data={[point]}
                fill={getCorrelationColor(point.correlation)}
                shape="square"
                dataKey="correlation"
              >
                <Cell 
                  key={`cell-${index}`}
                  fill={getCorrelationColor(point.correlation)}
                  opacity={0.8}
                />
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>

        {/* Correlation Legend */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Correlation Strength</h4>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Strong +</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Moderate +</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>Weak</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Moderate -</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Strong -</span>
            </div>
          </div>
        </div>

        {/* Correlation Matrix Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1 bg-gray-50"></th>
                {xVariables.map(xVar => (
                  <th key={xVar} className="border border-gray-300 px-2 py-1 bg-gray-50 text-center">
                    {xVar}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yVariables.map(yVar => (
                <tr key={yVar}>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50 font-medium">
                    {yVar}
                  </td>
                  {xVariables.map(xVar => {
                    const point = chartData.find(d => d.x === xVar && d.y === yVar);
                    const correlation = point ? point.correlation : 0;
                    return (
                      <td 
                        key={`${xVar}-${yVar}`} 
                        className="border border-gray-300 px-2 py-1 text-center"
                        style={{ 
                          backgroundColor: getCorrelationColor(correlation),
                          color: Math.abs(correlation) > 0.5 ? 'white' : 'black',
                          fontWeight: Math.abs(correlation) > 0.7 ? 'bold' : 'normal'
                        }}
                      >
                        {correlation.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


