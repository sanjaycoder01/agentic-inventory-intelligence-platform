import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">{title}</h3>
      <div className="w-full h-80">
        {children}
      </div>
    </div>
  );
}
