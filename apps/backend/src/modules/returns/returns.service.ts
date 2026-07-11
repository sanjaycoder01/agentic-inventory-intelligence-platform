import { randomUUID } from "node:crypto";
import {
  NotFoundError,
  ValidationError,
} from "../../middleware/app-errors.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { stockLedgerService } from "../inventory/stock-ledger.service.js";
import { WarehouseProductModel } from "../warehouse/warehouse-product.model.js";
import {
  ReturnOrderModel,
  type ReturnReason,
  type ReturnStatus,
} from "./return-order.model.js";

export interface CreateReturnInput {
  productId: string;
  darkStoreId: string;
  quantity: number;
  reason: ReturnReason;
  note?: string;
}

export class ReturnsService {
  async createReturn(input: CreateReturnInput) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError("Return quantity must be a positive integer");
    }

    const darkStore = await DarkStoreModel.findById(input.darkStoreId);
    if (!darkStore) {
      throw new NotFoundError(`Dark store ${input.darkStoreId} not found`);
    }

    const inventory = await DarkStoreProductModel.findOne({
      darkStoreId: input.darkStoreId,
      productId: input.productId,
      availableQuantity: { $gte: input.quantity },
    });

    if (!inventory) {
      throw new ValidationError(
        `Insufficient stock to return for product ${input.productId}`,
      );
    }

    return ReturnOrderModel.create({
      returnOrderId: randomUUID(),
      productId: input.productId,
      darkStoreId: input.darkStoreId,
      warehouseId: darkStore.warehouseId,
      quantity: input.quantity,
      reason: input.reason,
      status: "REQUESTED",
      note: input.note,
    });
  }

  async inspectReturn(
    returnOrderId: string,
    decision: "ACCEPTED" | "REJECTED",
    inspectedBy = "admin",
  ) {
    const existing = await ReturnOrderModel.findOne({ returnOrderId });
    if (!existing) {
      throw new NotFoundError(`Return order ${returnOrderId} not found`);
    }
    if (existing.status !== "REQUESTED") {
      throw new ValidationError(
        `Return order ${returnOrderId} is already ${existing.status}`,
      );
    }

    return ReturnOrderModel.findOneAndUpdate(
      { returnOrderId },
      {
        status: decision,
        inspectedBy,
        inspectedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Complete an accepted return: deduct dark-store stock, credit warehouse,
   * append stock ledger entries.
   */
  async completeReturnToWarehouse(returnOrderId: string) {
    const returnOrder = await ReturnOrderModel.findOne({ returnOrderId });
    if (!returnOrder) {
      throw new NotFoundError(`Return order ${returnOrderId} not found`);
    }
    if (returnOrder.status !== "ACCEPTED") {
      throw new ValidationError(
        `Return order ${returnOrderId} must be ACCEPTED before warehouse transfer`,
      );
    }

    const darkStoreId = returnOrder.darkStoreId.toString();
    const productId = returnOrder.productId.toString();
    const quantity = returnOrder.quantity;

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      {
        darkStoreId,
        productId,
        availableQuantity: { $gte: quantity },
      },
      { $inc: { availableQuantity: -quantity } },
      { new: true, runValidators: true },
    );

    if (!inventory) {
      throw new ValidationError(
        `Insufficient dark-store stock to complete return ${returnOrderId}`,
      );
    }

    await stockLedgerService.append({
      productId,
      darkStoreId,
      change: -quantity,
      balanceAfter: inventory.availableQuantity,
      reason: "RETURN_TO_WAREHOUSE",
      source: "SYSTEM",
      referenceId: returnOrderId,
    });

    if (returnOrder.warehouseId) {
      await WarehouseProductModel.findOneAndUpdate(
        {
          warehouseId: returnOrder.warehouseId,
          productId,
        },
        {
          $inc: { availableQuantity: quantity },
          $set: { lastRestockedAt: new Date() },
          $setOnInsert: {
            warehouseId: returnOrder.warehouseId,
            productId,
            reservedQuantity: 0,
            damagedQuantity: 0,
            reorderLevel: 0,
          },
        },
        { upsert: true, new: true },
      );
    }

    return ReturnOrderModel.findOneAndUpdate(
      { returnOrderId },
      {
        status: "RETURNED_TO_WAREHOUSE",
        completedAt: new Date(),
      },
      { new: true },
    );
  }

  async list(status?: ReturnStatus) {
    const filter = status ? { status } : {};
    return ReturnOrderModel.find(filter).sort({ createdAt: -1 });
  }

  async getById(returnOrderId: string) {
    const returnOrder = await ReturnOrderModel.findOne({ returnOrderId });
    if (!returnOrder) {
      throw new NotFoundError(`Return order ${returnOrderId} not found`);
    }
    return returnOrder;
  }
}

export const returnsService = new ReturnsService();
