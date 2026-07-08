'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '@/services/recommendation.service';

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: recommendationService.listPending
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => recommendationService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => recommendationService.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">AI Recommendations</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and approve purchase order replenishment suggestions</p>
      </div>
      {isLoading ? (
        <div>Loading recommendations...</div>
      ) : (
        <div className="space-y-4">
          {data?.map((rec: any) => (
            <div key={rec.recommendationId} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{rec.recommendationType}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">Confidence: {rec.overallScore}%</span>
                </div>
                <p className="text-sm text-zinc-600">{rec.summary}</p>
                <p className="text-xs text-zinc-400">Product ID: {rec.productId} | Dark Store: {rec.darkStoreId}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => approveMutation.mutate(rec.recommendationId)}
                  className="bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
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
          )) || <p>No pending recommendations found.</p>}
        </div>
      )}
    </div>
  );
}
