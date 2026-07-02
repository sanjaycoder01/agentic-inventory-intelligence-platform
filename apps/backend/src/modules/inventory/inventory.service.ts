import { Types } from "mongoose";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { ProductModel } from "../products/product.model.js";
import { InventoryPolicyModel } from "./inventory-policy.model.js";
import { INVENTORY_ERRORS, INVENTORY_LOG } from "./inventory.constants.js";
import {
  toInventoryResponseDTO,
  toInventoryResponseList,
  toLowStockProductDTO,
  type InventoryResponseDTO,
  type LowStockProductDTO,
} from "./inventory.types.js";

function assertPositiveIntegerQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError(INVENTORY_ERRORS.INVALID_QUANTITY);
  }
}

function assertValidObjectId(id: string, label: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${label}`);
  }
}

async function assertDarkStoreExists(darkStoreId: string) {
  assertValidObjectId(darkStoreId, "dark store ID");

  const darkStore = await DarkStoreModel.findById(darkStoreId);
  if (!darkStore) {
    throw new NotFoundError(INVENTORY_ERRORS.DARK_STORE_NOT_FOUND(darkStoreId));
  }

  return darkStore;
}

async function assertProductExists(productId: string) {
  assertValidObjectId(productId, "product ID");

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new NotFoundError(INVENTORY_ERRORS.PRODUCT_NOT_FOUND(productId));
  }

  return product;
}

export class InventoryService {
  async addStock(
    darkStoreId: string,
    productId: string,
    quantity: number,
    transferredAt: Date = new Date(),
  ): Promise<InventoryResponseDTO> {
    assertPositiveIntegerQuantity(quantity);
    await assertDarkStoreExists(darkStoreId);
    await assertProductExists(productId);

    logger.info(INVENTORY_LOG.ADDING_STOCK, { darkStoreId, productId, quantity });

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      { darkStoreId, productId },
      {
        $inc: { availableQuantity: quantity },
        $set: { lastTransferredAt: transferredAt },
        $setOnInsert: {
          darkStoreId,
          productId,
          reservedQuantity: 0,
          damagedQuantity: 0,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    logger.info(INVENTORY_LOG.STOCK_ADDED, {
      darkStoreId,
      productId,
      quantity,
      inventoryId: inventory._id.toString(),
    });

    return toInventoryResponseDTO(inventory);
  }

  async reserveStock(
    darkStoreId: string,
    productId: string,
    quantity: number,
  ): Promise<InventoryResponseDTO> {
    assertPositiveIntegerQuantity(quantity);
    assertValidObjectId(darkStoreId, "dark store ID");
    assertValidObjectId(productId, "product ID");

    logger.info(INVENTORY_LOG.RESERVING_STOCK, { darkStoreId, productId, quantity });

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      {
        darkStoreId,
        productId,
        availableQuantity: { $gte: quantity },
      },
      {
        $inc: {
          availableQuantity: -quantity,
          reservedQuantity: quantity,
        },
      },
      { new: true, runValidators: true },
    );

    if (!inventory) {
      const existing = await DarkStoreProductModel.findOne({ darkStoreId, productId });
      if (!existing) {
        throw new NotFoundError(
          INVENTORY_ERRORS.INVENTORY_NOT_FOUND(darkStoreId, productId),
        );
      }

      throw new InsufficientStockError(
        INVENTORY_ERRORS.INSUFFICIENT_AVAILABLE(darkStoreId, productId, quantity),
      );
    }

    logger.info(INVENTORY_LOG.STOCK_RESERVED, { darkStoreId, productId, quantity });

    return toInventoryResponseDTO(inventory);
  }

  async releaseReservedStock(
    darkStoreId: string,
    productId: string,
    quantity: number,
  ): Promise<InventoryResponseDTO> {
    assertPositiveIntegerQuantity(quantity);
    assertValidObjectId(darkStoreId, "dark store ID");
    assertValidObjectId(productId, "product ID");

    logger.info(INVENTORY_LOG.RELEASING_STOCK, { darkStoreId, productId, quantity });

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      {
        darkStoreId,
        productId,
        reservedQuantity: { $gte: quantity },
      },
      {
        $inc: {
          availableQuantity: quantity,
          reservedQuantity: -quantity,
        },
      },
      { new: true, runValidators: true },
    );

    if (!inventory) {
      const existing = await DarkStoreProductModel.findOne({ darkStoreId, productId });
      if (!existing) {
        throw new NotFoundError(
          INVENTORY_ERRORS.INVENTORY_NOT_FOUND(darkStoreId, productId),
        );
      }

      throw new InsufficientStockError(
        INVENTORY_ERRORS.INSUFFICIENT_RESERVED(darkStoreId, productId, quantity),
      );
    }

    logger.info(INVENTORY_LOG.STOCK_RELEASED, { darkStoreId, productId, quantity });

    return toInventoryResponseDTO(inventory);
  }

  async deductStock(
    darkStoreId: string,
    productId: string,
    quantity: number,
  ): Promise<InventoryResponseDTO> {
    assertPositiveIntegerQuantity(quantity);
    assertValidObjectId(darkStoreId, "dark store ID");
    assertValidObjectId(productId, "product ID");

    logger.info(INVENTORY_LOG.DEDUCTING_STOCK, { darkStoreId, productId, quantity });

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      {
        darkStoreId,
        productId,
        reservedQuantity: { $gte: quantity },
      },
      {
        $inc: { reservedQuantity: -quantity },
      },
      { new: true, runValidators: true },
    );

    if (!inventory) {
      const existing = await DarkStoreProductModel.findOne({ darkStoreId, productId });
      if (!existing) {
        throw new NotFoundError(
          INVENTORY_ERRORS.INVENTORY_NOT_FOUND(darkStoreId, productId),
        );
      }

      throw new InsufficientStockError(
        INVENTORY_ERRORS.INSUFFICIENT_RESERVED(darkStoreId, productId, quantity),
      );
    }

    logger.info(INVENTORY_LOG.STOCK_DEDUCTED, { darkStoreId, productId, quantity });

    return toInventoryResponseDTO(inventory);
  }

  async markDamaged(
    darkStoreId: string,
    productId: string,
    quantity: number,
  ): Promise<InventoryResponseDTO> {
    assertPositiveIntegerQuantity(quantity);
    assertValidObjectId(darkStoreId, "dark store ID");
    assertValidObjectId(productId, "product ID");

    logger.info(INVENTORY_LOG.MARKING_DAMAGED, { darkStoreId, productId, quantity });

    const inventory = await DarkStoreProductModel.findOneAndUpdate(
      {
        darkStoreId,
        productId,
        availableQuantity: { $gte: quantity },
      },
      {
        $inc: {
          availableQuantity: -quantity,
          damagedQuantity: quantity,
        },
      },
      { new: true, runValidators: true },
    );

    if (!inventory) {
      const existing = await DarkStoreProductModel.findOne({ darkStoreId, productId });
      if (!existing) {
        throw new NotFoundError(
          INVENTORY_ERRORS.INVENTORY_NOT_FOUND(darkStoreId, productId),
        );
      }

      throw new InsufficientStockError(
        INVENTORY_ERRORS.INSUFFICIENT_AVAILABLE(darkStoreId, productId, quantity),
      );
    }

    logger.info(INVENTORY_LOG.STOCK_MARKED_DAMAGED, { darkStoreId, productId, quantity });

    return toInventoryResponseDTO(inventory);
  }

  async getInventory(darkStoreId: string): Promise<InventoryResponseDTO[]> {
    assertValidObjectId(darkStoreId, "dark store ID");
    await assertDarkStoreExists(darkStoreId);

    const inventory = await DarkStoreProductModel.find({ darkStoreId }).sort({
      productId: 1,
    });

    return toInventoryResponseList(inventory);
  }

  async getInventoryByProduct(
    darkStoreId: string,
    productId: string,
  ): Promise<InventoryResponseDTO> {
    assertValidObjectId(darkStoreId, "dark store ID");
    assertValidObjectId(productId, "product ID");

    const inventory = await DarkStoreProductModel.findOne({ darkStoreId, productId });
    if (!inventory) {
      throw new NotFoundError(
        INVENTORY_ERRORS.INVENTORY_NOT_FOUND(darkStoreId, productId),
      );
    }

    return toInventoryResponseDTO(inventory);
  }

  async getLowStockProducts(darkStoreId: string): Promise<LowStockProductDTO[]> {
    assertValidObjectId(darkStoreId, "dark store ID");
    await assertDarkStoreExists(darkStoreId);

    const inventory = await DarkStoreProductModel.find({ darkStoreId });
    if (inventory.length === 0) {
      return [];
    }

    const productIds = inventory.map((item) => item.productId);

    const [policies, products] = await Promise.all([
      InventoryPolicyModel.find({
        locationType: "DARK_STORE",
        locationId: darkStoreId,
        productId: { $in: productIds },
      }),
      ProductModel.find({ _id: { $in: productIds } }),
    ]);

    const policyByProductId = new Map(
      policies.map((policy) => [policy.productId.toString(), policy]),
    );
    const productById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    return inventory
      .map((item) => {
        const productId = item.productId.toString();
        const policy = policyByProductId.get(productId);
        const product = productById.get(productId);
        const minimumStockLevel =
          policy?.minimumStockLevel ?? product?.safetyStock ?? 0;

        return {
          item,
          minimumStockLevel,
        };
      })
      .filter(({ item, minimumStockLevel }) => item.availableQuantity <= minimumStockLevel)
      .map(({ item, minimumStockLevel }) =>
        toLowStockProductDTO(item, minimumStockLevel),
      )
      .sort((a, b) => b.shortage - a.shortage);
  }
}

export const inventoryService = new InventoryService();
