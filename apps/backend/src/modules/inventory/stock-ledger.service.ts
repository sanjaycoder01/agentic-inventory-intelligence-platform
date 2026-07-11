import { randomUUID } from "node:crypto";
import {
  StockLedgerModel,
  type StockLedgerReason,
  type StockLedgerSource,
} from "./stock-ledger.model.js";

export interface AppendStockLedgerInput {
  productId: string;
  darkStoreId: string;
  change: number;
  balanceAfter: number;
  reason: StockLedgerReason;
  source?: StockLedgerSource;
  referenceId?: string;
  note?: string;
}

export class StockLedgerService {
  async append(input: AppendStockLedgerInput) {
    return StockLedgerModel.create({
      entryId: randomUUID(),
      productId: input.productId,
      darkStoreId: input.darkStoreId,
      change: input.change,
      balanceAfter: input.balanceAfter,
      reason: input.reason,
      source: input.source ?? "SYSTEM",
      referenceId: input.referenceId,
      note: input.note,
    });
  }

  async listByProduct(
    productId: string,
    darkStoreId?: string,
    limit = 100,
  ) {
    const filter: Record<string, unknown> = { productId };
    if (darkStoreId) filter.darkStoreId = darkStoreId;

    return StockLedgerModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

export const stockLedgerService = new StockLedgerService();
