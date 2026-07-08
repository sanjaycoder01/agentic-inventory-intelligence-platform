'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import ChartCard from '@/components/ChartCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'demand' | 'orders' | 'ratings'>('demand');

  const { data: demandData } = useQuery({
    queryKey: ['analytics-demand'],
    queryFn: analyticsService.getDemandAnalytics,
    enabled: tab === 'demand'
  });

  const { data: orderData } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: analyticsService.getOrderAnalytics,
    enabled: tab === 'orders'
  });

  const { data: ratingData } = useQuery({
    queryKey: ['analytics-ratings'],
    queryFn: analyticsService.getRatingAnalytics,
    enabled: tab === 'ratings'
  });

  const renderChart = () => {
    let chartData = [];
    if (tab === 'demand') {
      chartData = demandData?.map((item: any) => ({ name: item.productId || 'SKU', count: item.netDemand || item.quantity || 0 })) || [];
    } else if (tab === 'orders') {
      chartData = orderData?.map((item: any) => ({ name: item.productId || 'SKU', count: item.completedOrders || 0 })) || [];
    } else {
      chartData = ratingData?.map((item: any) => ({ name: item.productId || 'SKU', count: item.averageRating || item.rating || 0 })) || [];
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#18181b" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Operations Analytics</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Granular visualization of backend collection stats</p>
      </div>
      <div className="flex gap-4 border-b border-zinc-200 pb-2">
        {(['demand', 'orders', 'ratings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-semibold capitalize pb-2 px-1 border-b-2 transition-colors ${
              tab === t ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t} Analytics
          </button>
        ))}
      </div>
      <ChartCard title={`${tab.toUpperCase()} Analytics Metrics`}>
        {renderChart()}
      </ChartCard>
    </div>
  );
}
