export const INVENTORY_LOG = {
  ADDING_STOCK: "Adding stock to dark store inventory",
  STOCK_ADDED: "Stock added to dark store inventory",
  RESERVING_STOCK: "Reserving dark store stock",
  STOCK_RESERVED: "Dark store stock reserved",
  RELEASING_STOCK: "Releasing reserved dark store stock",
  STOCK_RELEASED: "Reserved dark store stock released",
  DEDUCTING_STOCK: "Deducting reserved dark store stock",
  STOCK_DEDUCTED: "Reserved dark store stock deducted",
  MARKING_DAMAGED: "Marking dark store stock as damaged",
  STOCK_MARKED_DAMAGED: "Dark store stock marked as damaged",
} as const;

export const INVENTORY_ERRORS = {
  INVALID_QUANTITY: "Quantity must be a positive integer",
  DARK_STORE_NOT_FOUND: (darkStoreId: string) =>
    `Dark store ${darkStoreId} not found`,
  PRODUCT_NOT_FOUND: (productId: string) => `Product ${productId} not found`,
  INVENTORY_NOT_FOUND: (darkStoreId: string, productId: string) =>
    `Inventory not found for product ${productId} in dark store ${darkStoreId}`,
  INSUFFICIENT_AVAILABLE: (darkStoreId: string, productId: string, quantity: number) =>
    `Insufficient available stock for product ${productId} in dark store ${darkStoreId}. Requested ${quantity}`,
  INSUFFICIENT_RESERVED: (darkStoreId: string, productId: string, quantity: number) =>
    `Insufficient reserved stock for product ${productId} in dark store ${darkStoreId}. Requested ${quantity}`,
} as const;
