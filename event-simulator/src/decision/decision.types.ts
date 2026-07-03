import type { CustomerDecision } from "../behavior/behavior.types.js";
import type { SelectedProduct } from "../context/context.types.js";

export type DecisionBlockReason =
  | "NO_DARK_STORE_CONTEXT"
  | "NO_CATALOG_PRODUCT"
  | "OUT_OF_STOCK";

export interface ProductAwareCustomerDecision extends CustomerDecision {
  customerId: string;
  darkStoreId?: string;
  product?: SelectedProduct;
  quantity: number;
  canPurchase: boolean;
  blockReason?: DecisionBlockReason;
}
