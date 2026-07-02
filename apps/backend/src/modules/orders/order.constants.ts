export const ORDER_WINDOW_HOURS = 24;

export const ORDER_MESSAGES = {
  CREATED: "Order created successfully",
  ANALYTICS_RETRIEVED: "Product order analytics retrieved successfully",
  CONVERSION_RETRIEVED: "Conversion score retrieved successfully",
} as const;

export const ORDER_ERRORS = {
  PRODUCT_NOT_FOUND: (productId: string) => `Product ${productId} not found`,
  DARK_STORE_NOT_FOUND: (darkStoreId: string) =>
    `Dark store ${darkStoreId} not found`,
  INSUFFICIENT_INVENTORY: (
    productId: string,
    darkStoreId: string,
    requested: number,
    available: number,
  ) =>
    `Insufficient inventory for product ${productId} in dark store ${darkStoreId}. Requested ${requested}, available ${available}`,
} as const;

export const ORDER_LOG = {
  CREATING: "Creating order",
  CREATED: "Order created",
} as const;
