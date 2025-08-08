import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TestChart = () => {
  const data = [
    { name: 'Al Quoz', gallons: 451, customers: 150 },
    { name: 'Al Barsha', gallons: 300, customers: 120 },
    { name: 'Al Karama', gallons: 225, customers: 90 },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Test Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="gallons" fill="#3B82F6" />
          <Bar dataKey="customers" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TestChart;
