'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderService } from '@/services/purchase-order.service';

export default function PurchaseOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrderService.list()
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Purchase Orders</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track current fulfillment replenishment flows</p>
      </div>
      {isLoading ? (
        <div>Loading orders...</div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="p-4 text-sm font-semibold text-zinc-600">PO ID</th>
                <th className="p-4 text-sm font-semibold text-zinc-600">Quantity</th>
                <th className="p-4 text-sm font-semibold text-zinc-600">Status</th>
                <th className="p-4 text-sm font-semibold text-zinc-600">Created At</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((po: any) => (
                <tr key={po.purchaseOrderId} className="border-b border-zinc-100">
                  <td className="p-4 text-sm font-mono">{po.purchaseOrderId}</td>
                  <td className="p-4 text-sm">{po.quantity}</td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                      {po.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{new Date(po.createdAt || po.updatedAt).toLocaleDateString()}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="p-4 text-sm text-center text-zinc-500">No purchase orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
