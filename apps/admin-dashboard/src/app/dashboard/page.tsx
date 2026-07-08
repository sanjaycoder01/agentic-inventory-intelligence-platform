'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function ExecutiveDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: analyticsService.getExecutiveDashboard
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  const mockChartData = [
    { name: 'Mon', sales: 4000, demand: 2400 },
    { name: 'Tue', sales: 3000, demand: 1398 },
    { name: 'Wed', sales: 2000, demand: 9800 },
    { name: 'Thu', sales: 2780, demand: 3908 },
    { name: 'Fri', sales: 1890, demand: 4800 },
    { name: 'Sat', sales: 2390, demand: 3800 },
    { name: 'Sun', sales: 3490, demand: 4300 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Executive Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of performance, inventory, and AI operations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Orders" value={data?.totalOrders || 128} description="Active placed orders today" />
        <MetricCard title="Revenue" value={`$${data?.revenue || 4280}`} description="Net revenue generated" />
        <MetricCard title="Conversion Rate" value={`${data?.conversionRate || 3.8}%`} description="Checkout percentage" />
        <MetricCard title="Average Rating" value={data?.averageRating || 4.7} description="Customer feedback score" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartCard title="Sales & Demand Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={2} />
              <Line type="monotone" dataKey="demand" stroke="#a1a1aa" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Weekly Operations Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#18181b" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
