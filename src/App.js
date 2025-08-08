import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Simple test component
const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blue Data Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900">Services Completed</h3>
            <p className="text-3xl font-bold text-blue-600">29,945</p>
            <p className="text-sm text-gray-500">Total services across all operations</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900">Retention Rate</h3>
            <p className="text-3xl font-bold text-green-600">97.0%</p>
            <p className="text-sm text-gray-500">Customer retention rate</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900">Average Turnaround</h3>
            <p className="text-3xl font-bold text-purple-600">0.4 days</p>
            <p className="text-sm text-gray-500">Average service completion time</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
            <p className="text-3xl font-bold text-orange-600">90.3%</p>
            <p className="text-sm text-gray-500">ML model performance</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">Al Quoz</h4>
              <p className="text-2xl font-bold text-blue-600">451K gallons</p>
              <p className="text-sm text-gray-500">150 customers</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">Al Barsha</h4>
              <p className="text-2xl font-bold text-blue-600">300K gallons</p>
              <p className="text-sm text-gray-500">120 customers</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">Al Karama</h4>
              <p className="text-2xl font-bold text-blue-600">225K gallons</p>
              <p className="text-sm text-gray-500">90 customers</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">✅ Dashboard is working on Vercel!</p>
          <p className="text-sm text-gray-500 mt-2">All data is hardcoded to ensure reliability</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TestDashboard />} />
          <Route path="*" element={<TestDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
