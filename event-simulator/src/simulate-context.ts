import type { DarkStoreContext } from './context/context.types.js';

function toIdString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    return value.toString();
  }

  return String(value);
}

export async function createDefaultSimulationContexts(): Promise<DarkStoreContext[]> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const prodRes = await fetch(`${backendUrl}/api/v1/products`);
    if (!prodRes.ok) throw new Error(`Product status: ${prodRes.status}`);
    const prodData = await prodRes.json() as { data?: unknown[] };
    const activeProducts = Array.isArray(prodData?.data) ? prodData.data : [];

    const dsRes = await fetch(`${backendUrl}/api/v1/dark-stores`);
    if (!dsRes.ok) throw new Error(`Dark store status: ${dsRes.status}`);
    const dsData = await dsRes.json() as { data?: unknown[] };
    const activeDarkStores = Array.isArray(dsData?.data) ? dsData.data : [];

    if (activeProducts.length === 0 || activeDarkStores.length === 0) {
      console.warn(JSON.stringify({
        action: 'ContextFallback',
        reason: 'No active products or dark stores returned from backend',
        products: activeProducts.length,
        darkStores: activeDarkStores.length,
      }));
      return getFallbackContexts();
    }

    const contexts = activeDarkStores.map((ds: any) => {
      const darkStoreId = toIdString(ds._id ?? ds.id);
      const darkStore = {
        id: darkStoreId,
        code: ds.darkStoreCode || ds.code,
        name: ds.name,
        city: ds.address?.city || 'Seattle',
      };

      const catalogProducts = activeProducts.map((p: any) => ({
        darkStoreId,
        productId: toIdString(p._id ?? p.id),
        productName: p.name,
        category: p.category,
        averageRating: 4.5,
        totalRatings: 10,
      }));

      const inventory = activeProducts.map((p: any) => ({
        darkStoreId,
        productId: toIdString(p._id ?? p.id),
        productName: p.name,
        category: p.category,
        availableQuantity: 1000,
      }));

      return {
        darkStore,
        catalogProducts,
        inventory,
      };
    });

    console.log(JSON.stringify({
      action: 'ContextLoaded',
      source: 'backend',
      darkStores: contexts.length,
      products: contexts[0]?.catalogProducts.length ?? 0,
      inventory: contexts[0]?.inventory.length ?? 0,
      darkStoreIds: contexts.map((context) => context.darkStore.id),
      productNames: contexts[0]?.catalogProducts.slice(0, 5).map((product) => product.productName) ?? [],
    }));

    return contexts;
  } catch (err: unknown) {
    console.warn(JSON.stringify({
      action: 'ContextFallback',
      reason: err instanceof Error ? err.message : String(err),
    }));
    return getFallbackContexts();
  }
}

function getFallbackContexts(): DarkStoreContext[] {
  return [
    {
      darkStore: {
        id: 'darkstore-1',
        code: 'DS1',
        name: 'Downtown Dark Store',
        city: 'Seattle',
      },
      catalogProducts: [
        {
          darkStoreId: 'darkstore-1',
          productId: 'milk-001',
          productName: 'Milk',
          category: 'Dairy',
          averageRating: 4.7,
          totalRatings: 120,
        },
      ],
      inventory: [
        {
          darkStoreId: 'darkstore-1',
          productId: 'milk-001',
          productName: 'Milk',
          category: 'Dairy',
          availableQuantity: 100,
        },
      ],
    },
  ];
}
