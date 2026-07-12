'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOptimizationService } from '@/services/sales-optimization.service';

export default function SalesOptimizationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['sales-optimization'],
    queryFn: salesOptimizationService.listPending,
  });

  const generateMutation = useMutation({
    mutationFn: () => salesOptimizationService.generate(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-optimization'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => salesOptimizationService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-optimization'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => salesOptimizationService.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-optimization'] }),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sales Optimization
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Slow movers, dead stock, and strategy recommendations
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Strategies'}
        </button>
      </div>

      {isLoading ? (
        <div>Loading sales optimization recommendations...</div>
      ) : (
        <div className="space-y-4">
          {data?.map((rec: any) => {
            const metrics = rec.metrics ?? {};
            return (
              <div
                key={rec.recommendationId}
                className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900">
                      {rec.strategy ?? rec.recommendationType}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      {rec.status}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      Velocity: {metrics.velocityClass ?? '—'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      Sell-through: {metrics.sellThroughPercent != null ? `${metrics.sellThroughPercent}%` : '—'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      Age: {metrics.inventoryAgeDays != null ? `${metrics.inventoryAgeDays}d` : '—'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                      Confidence: {Math.round((rec.overallScore ?? 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">{rec.summary}</p>
                  <p className="text-xs text-zinc-400">
                    Product: {rec.productId} | Inventory: {rec.availableQuantity}
                    {rec.discountPercent != null ? ` | Discount: ${rec.discountPercent}%` : ''}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(rec.recommendationId)}
                    disabled={!rec.eligible || rec.status === 'BLOCKED'}
                    className="bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(rec.recommendationId)}
                    className="border border-zinc-200 text-zinc-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          }) || <p>No sales optimization recommendations found.</p>}
        </div>
      )}
    </div>
  );
}
