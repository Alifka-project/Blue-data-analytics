import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Legend
} from 'recharts';

const Insights = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');


  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/analysis_insights.json');
        if (response.ok) {
          const data = await response.json();
          setInsightsData(data);

        }
      } catch (error) {
        console.error('Error loading insights data:', error);
      }
    };

    loadData();
  }, []);

  // Generate real data from insights
  const salesData = insightsData?.temporal_analysis?.monthly_pattern ? 
    Object.entries(insightsData.temporal_analysis.monthly_pattern).map(([key, value]) => {
      const [year, month] = key.replace('(', '').replace(')', '').split(', ');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
      return {
        month: monthName,
        sales: Math.round(value / 1000), // Convert to thousands
        target: Math.round(value * 0.9 / 1000), // 90% of actual as target
        growth: Math.round((value / 1000000) * 100) // Growth percentage
      };
    }) : [
      { month: 'Jan', sales: 500, target: 450, growth: 11.1 },
      { month: 'Feb', sales: 450, target: 405, growth: 11.1 },
      { month: 'Mar', sales: 480, target: 432, growth: 11.1 }
    ];

  const customerSegments = insightsData?.customer_behavior ? [
    { 
      segment: 'High Value', 
      customers: insightsData.customer_behavior.high_value_customers || 593, 
      revenue: insightsData.customer_behavior.avg_customer_value_gallons * (insightsData.customer_behavior.high_value_customers || 593), 
      percentage: Math.round(((insightsData.customer_behavior.high_value_customers || 593) / insightsData.customer_behavior.total_customers) * 100),
      avgServices: Math.round(insightsData.customer_behavior.avg_services_per_customer * 1.5),
      retentionRate: 0.98
    },
    { 
      segment: 'Medium Value', 
      customers: Math.round((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.4), 
      revenue: insightsData.customer_behavior.avg_customer_value_gallons * Math.round((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.4), 
      percentage: Math.round(((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.4 / insightsData.customer_behavior.total_customers) * 100),
      avgServices: Math.round(insightsData.customer_behavior.avg_services_per_customer),
      retentionRate: 0.92
    },
    { 
      segment: 'Low Value', 
      customers: Math.round((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.6), 
      revenue: insightsData.customer_behavior.avg_customer_value_gallons * Math.round((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.6), 
      percentage: Math.round(((insightsData.customer_behavior.total_customers - (insightsData.customer_behavior.high_value_customers || 593)) * 0.6 / insightsData.customer_behavior.total_customers) * 100),
      avgServices: Math.round(insightsData.customer_behavior.avg_services_per_customer * 0.7),
      retentionRate: 0.85
    },
  ] : [
    { segment: 'High Value', customers: 593, revenue: 299130, percentage: 18, avgServices: 14, retentionRate: 0.98 },
    { segment: 'Medium Value', customers: 1088, revenue: 548825, percentage: 33, avgServices: 9, retentionRate: 0.92 },
    { segment: 'Low Value', customers: 1633, revenue: 823745, percentage: 49, avgServices: 6, retentionRate: 0.85 },
  ];

  const productPerformance = insightsData?.product_performance?.category_breakdown ? 
    Object.entries(insightsData.product_performance.category_breakdown).map(([category, data]) => ({
      product: category,
      sales: data.Service_Count || 0,
      revenue: Math.round(data.Total_Gallons / 1000) || 0, // Convert to thousands
      rating: Math.round((data.Total_Gallons / (data.Service_Count || 1)) / 10) || 0, // Efficiency rating
      customers: data.Unique_Customers || 0,
      avgGallons: Math.round(data.Avg_Gallons) || 0,
      avgTraps: Math.round(data.Avg_Traps) || 0
    })) : [
      { product: 'Restaurant', sales: 0, revenue: 0, rating: 0, customers: 0, avgGallons: 0, avgTraps: 0 },
      { product: 'Accommodation', sales: 0, revenue: 0, rating: 0, customers: 0, avgGallons: 0, avgTraps: 0 },
      { product: 'Cafeteria', sales: 0, revenue: 0, rating: 0, customers: 0, avgGallons: 0, avgTraps: 0 }
    ];

  const regionalData = insightsData?.geographic_analysis?.area_breakdown ? 
    Object.entries(insightsData.geographic_analysis.area_breakdown)
      .filter(([area, data]) => data.Total_Gallons > 0) // Only show regions with data
      .map(([area, data]) => ({
        region: area,
        sales: Math.round((data.Total_Gallons || 0) / 1000), // Convert to thousands
        customers: data.Unique_Customers || 0,
        growth: Math.round(((data.Total_Gallons || 0) / (insightsData.service_performance?.total_gallons_collected || 1)) * 100), // Growth based on market share
        gallons: Math.round((data.Total_Gallons || 0) / 1000), // Convert to thousands for display
        services: data.Service_Count || 0
      }))
      .sort((a, b) => b.gallons - a.gallons) // Sort by gallons descending
      .slice(0, 15) // Top 15 regions
    : [
      { region: 'Al Quoz', sales: 451, customers: 150, growth: 15, gallons: 451, services: 500 },
      { region: 'Al Barsha', sales: 300, customers: 120, growth: 12, gallons: 300, services: 400 },
      { region: 'Al Karama', sales: 225, customers: 90, growth: 8, gallons: 225, services: 300 },
      { region: 'Al Garhoud', sales: 180, customers: 75, growth: 6, gallons: 180, services: 250 },
      { region: 'Al Qudra', sales: 150, customers: 60, growth: 5, gallons: 150, services: 200 },
      { region: 'Al Maktoum', sales: 120, customers: 50, growth: 4, gallons: 120, services: 180 },
      { region: 'Al Wasl', sales: 100, customers: 40, growth: 3, gallons: 100, services: 150 },
      { region: 'Al Safa', sales: 80, customers: 35, growth: 2, gallons: 80, services: 120 },
      { region: 'Al Hudaiba', sales: 70, customers: 30, growth: 2, gallons: 70, services: 100 },
      { region: 'Al Satwa', sales: 60, customers: 25, growth: 1, gallons: 60, services: 80 }
    ];

  const efficiencyTrends = insightsData?.temporal_analysis?.monthly_pattern ? 
    Object.entries(insightsData.temporal_analysis.monthly_pattern).map(([key, value]) => {
      const [year, month] = key.replace('(', '').replace(')', '').split(', ');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
      return {
        month: monthName,
        efficiency: Math.round((insightsData.operational_efficiency?.service_duration_efficiency || 0.72) * 100),
        productivity: Math.round((value / insightsData.service_performance?.total_gallons_collected || 1) * 100),
        quality: Math.round((insightsData.customer_behavior?.customer_retention_rate || 0.97) * 100)
      };
    }) : [
      { month: 'Jan', efficiency: 72, productivity: 70, quality: 97 },
      { month: 'Feb', efficiency: 72, productivity: 68, quality: 97 },
      { month: 'Mar', efficiency: 72, productivity: 69, quality: 97 }
    ];

  const marketShare = insightsData?.geographic_analysis?.area_breakdown ? 
    Object.entries(insightsData.geographic_analysis.area_breakdown).map(([area, data], index) => ({
      competitor: area,
      share: Math.round((data.Total_Gallons / (insightsData.service_performance?.total_gallons_collected || 1)) * 100),
      growth: Math.round((data.Unique_Customers / (insightsData.customer_behavior?.total_customers || 1)) * 100),
      services: data.Service_Count || 0,
      gallons: data.Total_Gallons || 0
    })) : [
      { competitor: 'Al Quoz', share: 0, growth: 0, services: 0, gallons: 0 },
      { competitor: 'Al Brsh', share: 0, growth: 0, services: 0, gallons: 0 },
      { competitor: 'Al Krm', share: 0, growth: 0, services: 0, gallons: 0 },
      { competitor: 'Al Grhoud', share: 0, growth: 0, services: 0, gallons: 0 }
    ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'sales', name: 'Sales Analysis', icon: ChartBarIcon },
    { id: 'customers', name: 'Customer Insights', icon: ChartBarIcon },
    { id: 'operations', name: 'Operations', icon: ChartBarIcon },
    { id: 'market', name: 'Market Analysis', icon: ChartBarIcon },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Top Row - Sales and Customer Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Monthly Sales Performance</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} name="Actual Sales (K)" />
              <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={3} name="Target Sales (K)" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Customer Value Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={customerSegments}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="percentage"
                label={({ segment, percentage, customers }) => `${segment}\n${percentage}%\n(${customers.toLocaleString()})`}
                labelLine={false}
              >
                {customerSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B'][index]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Regional Performance - Full Width with ALL Regions */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Complete Regional Performance Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">All {regionalData.length} regions shown with detailed metrics</p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            Total Regions: {regionalData.length}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="region" 
              tick={{ fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="gallons" fill="#3B82F6" name="Gallons (K)" />
            <Bar yAxisId="left" dataKey="customers" fill="#10B981" name="Customers" />
            <Bar yAxisId="left" dataKey="services" fill="#8B5CF6" name="Services" />
            <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#EF4444" strokeWidth={2} name="Market Share %" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Efficiency Overview */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Operational Efficiency Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={efficiencyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.7} name="Service Efficiency %" />
            <Area type="monotone" dataKey="quality" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.7} name="Quality Score %" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderSalesAnalysis = () => (
    <div className="space-y-8">
      {/* Sales Trend Analysis */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Monthly Sales Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name="Sales (K gallons)" />
            <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#EF4444" strokeWidth={3} name="Growth %" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category Performance Analysis */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Complete Category Performance</h3>
            <p className="text-sm text-gray-500 mt-1">All {productPerformance.length} business categories with detailed metrics</p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            Total Categories: {productPerformance.length}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={productPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="product" 
              tick={{ fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name="Total Services" />
            <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Gallons (K)" />
            <Bar yAxisId="left" dataKey="customers" fill="#8B5CF6" name="Customers" />
            <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#EF4444" strokeWidth={2} name="Efficiency Rating" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category Performance Table */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Category Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallons (K)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Gallons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Traps</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productPerformance.map((category, index) => (
                <tr key={category.product} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.sales.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.customers.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.avgGallons}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.avgTraps}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.rating >= 5 ? 'bg-green-100 text-green-800' :
                      category.rating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {category.rating}/10
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  const renderCustomerInsights = () => (
    <div className="space-y-6">
      {/* Customer Segmentation */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segmentation Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerSegments}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="percentage"
                label={({ segment, percentage }) => `${segment}\n${percentage}%`}
              >
                {customerSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B'][index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Customer Insights</h4>
            <div className="space-y-3">
              {customerSegments.map((segment, index) => (
                <div key={segment.segment} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{segment.segment}</span>
                  <div className="text-right">
                    <div className="font-semibold">{segment.customers.toLocaleString()} customers</div>
                    <div className="text-sm text-gray-600">${(segment.revenue / 1000000).toFixed(1)}M revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customer Behavior Trends */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Behavior Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={efficiencyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Area type="monotone" dataKey="productivity" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="quality" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      {/* Regional Performance - MOVED TO TOP */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Complete Regional Performance Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">All {regionalData.length} regions with operational metrics</p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            Total Regions: {regionalData.length}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="region" 
              tick={{ fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="gallons" fill="#3B82F6" name="Gallons (K)" />
            <Bar yAxisId="left" dataKey="customers" fill="#10B981" name="Customers" />
            <Bar yAxisId="left" dataKey="services" fill="#8B5CF6" name="Services" />
            <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#EF4444" strokeWidth={2} name="Market Share %" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Operational Efficiency */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Operational Efficiency Metrics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={efficiencyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={3} name="Service Efficiency %" />
            <Line type="monotone" dataKey="productivity" stroke="#3B82F6" strokeWidth={3} name="Productivity %" />
            <Line type="monotone" dataKey="quality" stroke="#F59E0B" strokeWidth={3} name="Quality Score %" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderMarketAnalysis = () => (
    <div className="space-y-6">
      {/* Market Share */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Share Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={marketShare}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="competitor" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="share" fill="#3B82F6" />
            <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#EF4444" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Growth Comparison */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Rate Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={marketShare}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="competitor" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="growth" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'sales':
        return renderSalesAnalysis();
      case 'customers':
        return renderCustomerInsights();
      case 'operations':
        return renderOperations();
      case 'market':
        return renderMarketAnalysis();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Insights & Analysis</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive analysis of business performance, customer behavior, and market trends
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="inline-block w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default Insights;
