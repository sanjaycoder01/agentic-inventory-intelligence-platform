'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

export default function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.list
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Product Catalog</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of tracked inventory SKU products</p>
      </div>
      {isLoading ? (
        <div>Loading product catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.map((p: any) => (
            <div key={p.id || p._id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900">{p.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">Category: {p.category}</p>
              <p className="text-sm text-zinc-500">Brand: {p.brand}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-zinc-900">${p.sellingPrice}</span>
                <span className="text-xs bg-zinc-100 px-2.5 py-1 rounded-full text-zinc-600">SKU: {p.sku}</span>
              </div>
            </div>
          )) || <p>No products found.</p>}
        </div>
      )}
    </div>
  );
}
