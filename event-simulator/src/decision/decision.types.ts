import type { CustomerDecision } from "../behavior/behavior.types.js";
import type { SelectedProduct } from "../context/context.types.js";
import type { PersonaId } from "../scenarios/scenario.types.js";

export type DecisionBlockReason =
  | "NO_DARK_STORE_CONTEXT"
  | "NO_CATALOG_PRODUCT"
  | "OUT_OF_STOCK";

export interface ProductAwareCustomerDecision extends CustomerDecision {
  customerId: string;
  personaId: PersonaId;
  darkStoreId?: string;
  product?: SelectedProduct;
  quantity: number;
  canPurchase: boolean;
  blockReason?: DecisionBlockReason;
}
