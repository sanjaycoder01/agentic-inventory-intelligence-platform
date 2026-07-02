export const PRODUCT_MESSAGES = {
  CREATED: "Product created successfully",
  RETRIEVED: "Product retrieved successfully",
  RETRIEVED_ALL: "Products retrieved successfully",
  UPDATED: "Product updated successfully",
  DEACTIVATED: "Product deactivated successfully",
} as const;

export const PRODUCT_ERRORS = {
  NOT_FOUND: (id: string) => `Product ${id} not found`,
  ALREADY_EXISTS: (sku: string) => `Product with SKU ${sku} already exists`,
} as const;

export const PRODUCT_LOG = {
  CREATING: "Creating product",
  CREATED: "Product created",
  UPDATING: "Updating product",
  UPDATED: "Product updated",
  DEACTIVATING: "Deactivating product",
  DEACTIVATED: "Product deactivated",
} as const;
