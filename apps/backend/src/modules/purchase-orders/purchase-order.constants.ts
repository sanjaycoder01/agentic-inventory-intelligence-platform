export const PURCHASE_ORDER_DEFAULTS = {
  CREATED_BY: "SYSTEM",
  ORDER_TYPE: "REPLENISHMENT",
  /** Fallback only when demand-rate inputs are unavailable */
  TARGET_STOCK: 100,
} as const;
