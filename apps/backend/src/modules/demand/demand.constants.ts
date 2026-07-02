export const DEMAND_WINDOW_HOURS = 24;

export const DEMAND_MESSAGES = {
  CART_EVENT_RECORDED: "Cart event recorded successfully",
  DEMAND_RETRIEVED: "Product demand retrieved successfully",
  TRENDING_RETRIEVED: "Trending products retrieved successfully",
} as const;

export const DEMAND_ERRORS = {
  PRODUCT_NOT_FOUND: (productId: string) => `Product ${productId} not found`,
  DARK_STORE_NOT_FOUND: (darkStoreId: string) =>
    `Dark store ${darkStoreId} not found`,
} as const;

export const DEMAND_LOG = {
  RECORDING_CART_EVENT: "Recording cart event",
  CART_EVENT_RECORDED: "Cart event recorded",
} as const;
