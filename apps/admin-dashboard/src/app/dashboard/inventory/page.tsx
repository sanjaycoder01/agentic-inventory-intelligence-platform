'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: analyticsService.getInventorySummary
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Inventory Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor dark store stock levels and thresholds</p>
      </div>
      {isLoading ? (
        <div>Loading inventory...</div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="p-4 text-sm font-semibold text-zinc-600">Metric</th>
                <th className="p-4 text-sm font-semibold text-zinc-600">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="p-4 text-sm">Total Products</td>
                <td className="p-4 text-sm">{data?.totalProducts || 0}</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="p-4 text-sm">Total Available Stock</td>
                <td className="p-4 text-sm">{data?.totalAvailable || 0}</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="p-4 text-sm">Total Reserved Stock</td>
                <td className="p-4 text-sm">{data?.totalReserved || 0}</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="p-4 text-sm">Low Stock Alert Count</td>
                <td className="p-4 text-sm text-amber-600 font-bold">{data?.lowStockCount || 0}</td>
              </tr>
              <tr>
                <td className="p-4 text-sm">Out Of Stock Count</td>
                <td className="p-4 text-sm text-red-600 font-bold">{data?.outOfStockCount || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
