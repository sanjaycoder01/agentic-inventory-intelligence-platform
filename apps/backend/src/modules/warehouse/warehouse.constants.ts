export const WAREHOUSE_MESSAGES = {
  CREATED: "Warehouse created successfully",
  RETRIEVED: "Warehouse retrieved successfully",
  RETRIEVED_ALL: "Warehouses retrieved successfully",
  UPDATED: "Warehouse updated successfully",
  DEACTIVATED: "Warehouse deactivated successfully",
} as const;

export const WAREHOUSE_ERRORS = {
  NOT_FOUND: (id: string) => `Warehouse ${id} not found`,
  ALREADY_EXISTS: (warehouseCode: string) =>
    `Warehouse with code ${warehouseCode} already exists`,
} as const;

export const WAREHOUSE_LOG = {
  CREATING: "Creating warehouse",
  CREATED: "Warehouse created",
  UPDATING: "Updating warehouse",
  UPDATED: "Warehouse updated",
  DEACTIVATING: "Deactivating warehouse",
  DEACTIVATED: "Warehouse deactivated",
} as const;
