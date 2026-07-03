export interface DarkStoreProfile {
  id: string;
  code?: string;
  name: string;
  area?: string;
  city?: string;
}

export interface DarkStoreCatalogProduct {
  darkStoreId: string;
  productId: string;
  productName: string;
  category: string;
  averageRating?: number;
  totalRatings?: number;
}

export interface InventoryState {
  darkStoreId: string;
  productId: string;
  productName: string;
  category: string;
  availableQuantity: number;
  reservedQuantity?: number;
  damagedQuantity?: number;
}

export interface DarkStoreContext {
  darkStore: DarkStoreProfile;
  catalogProducts: DarkStoreCatalogProduct[];
  inventory: InventoryState[];
}

export interface SelectedProduct {
  darkStoreId: string;
  productId: string;
  productName: string;
  category: string;
  availableToSell: number;
  inCatalog: boolean;
  inStock: boolean;
}
