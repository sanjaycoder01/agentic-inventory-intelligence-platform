'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.listPending
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Notifications</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor pending workflow activity and alerts</p>
      </div>
      {isLoading ? (
        <div>Loading alerts...</div>
      ) : (
        <div className="space-y-4">
          {data?.map((n: any, idx: number) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 text-sm">Event: {n.eventType}</span>
                <span className="text-xs text-zinc-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-600 mt-2">Entity: {n.entityType} ({n.entityId})</p>
            </div>
          )) || <p>No alerts logged.</p>}
        </div>
      )}
    </div>
  );
}
