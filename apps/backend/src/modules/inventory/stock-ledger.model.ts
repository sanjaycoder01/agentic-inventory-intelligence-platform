import { Schema, model, type InferSchemaType } from "mongoose";

export const STOCK_LEDGER_REASONS = [
  "SALE",
  "RESTOCK",
  "WASTAGE",
  "DAMAGE",
  "RETURN",
  "RETURN_TO_WAREHOUSE",
  "RESERVE",
  "RELEASE",
  "ADJUSTMENT",
] as const;

export type StockLedgerReason = (typeof STOCK_LEDGER_REASONS)[number];

export const STOCK_LEDGER_SOURCES = ["HUMAN", "SYSTEM"] as const;
export type StockLedgerSource = (typeof STOCK_LEDGER_SOURCES)[number];

const stockLedgerSchema = new Schema(
  {
    entryId: { type: String, required: true, unique: true, index: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    darkStoreId: {
      type: Schema.Types.ObjectId,
      ref: "DarkStore",
      required: true,
      index: true,
    },
    change: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: STOCK_LEDGER_REASONS,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: STOCK_LEDGER_SOURCES,
      required: true,
      default: "SYSTEM",
    },
    referenceId: { type: String, index: true },
    note: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "stockLedger",
  },
);

stockLedgerSchema.index({ productId: 1, darkStoreId: 1, createdAt: -1 });

export type StockLedgerDocument = InferSchemaType<typeof stockLedgerSchema>;
export const StockLedgerModel = model("StockLedger", stockLedgerSchema);
