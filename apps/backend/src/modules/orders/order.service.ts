import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { demandService } from "../demand/demand.service.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { ProductModel } from "../products/product.model.js";
import { ORDER_ERRORS, ORDER_LOG, ORDER_WINDOW_HOURS } from "./order.constants.js";
import { COMPLETED_ORDER_STATUSES, OrderModel } from "./order.model.js";
import {
  calculateConversionScore,
  toOrderResponseDTO,
  toOrderResponseList,
  type ConversionScoreDTO,
  type OrderResponseDTO,
  type ProductOrderAnalyticsDTO,
  type TopSellingProductDTO,
} from "./order.types.js";
import type { CreateOrderDTO } from "./order.validation.js";

function assertValidObjectId(id: string, label: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${label}`);
  }
}

function getOrderWindowStart(hours = ORDER_WINDOW_HOURS) {
  const since = new Date();
  since.setHours(since.getHours() - hours);
  return since;
}

export class OrderService {
  private async assertProductExists(productId: string) {
    assertValidObjectId(productId, "product ID");

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new NotFoundError(ORDER_ERRORS.PRODUCT_NOT_FOUND(productId));
    }

    return product;
  }

  private async assertDarkStoreExists(darkStoreId: string) {
    assertValidObjectId(darkStoreId, "dark store ID");

    const darkStore = await DarkStoreModel.findById(darkStoreId);
    if (!darkStore) {
      throw new NotFoundError(ORDER_ERRORS.DARK_STORE_NOT_FOUND(darkStoreId));
    }

    return darkStore;
  }

  private async getCompletedOrderCount(
    productId: string,
    since: Date,
  ): Promise<number> {
    return OrderModel.countDocuments({
      productId,
      orderStatus: { $in: COMPLETED_ORDER_STATUSES },
      orderedAt: { $gte: since },
    });
  }

  async createOrder(data: CreateOrderDTO): Promise<OrderResponseDTO> {
    const product = await this.assertProductExists(data.productId);
    await this.assertDarkStoreExists(data.darkStoreId);

    if (data.orderStatus !== "CANCELLED") {
      let inventory;
      try {
        inventory = await inventoryService.getInventoryByProduct(
          data.darkStoreId,
          data.productId,
        );
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new InsufficientStockError(
            ORDER_ERRORS.INSUFFICIENT_INVENTORY(
              data.productId,
              data.darkStoreId,
              data.quantity,
              0,
            ),
          );
        }
        throw error;
      }

      if (inventory.availableQuantity < data.quantity) {
        throw new InsufficientStockError(
          ORDER_ERRORS.INSUFFICIENT_INVENTORY(
            data.productId,
            data.darkStoreId,
            data.quantity,
            inventory.availableQuantity,
          ),
        );
      }
    }

    logger.info(ORDER_LOG.CREATING, {
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      quantity: data.quantity,
    });

    if (data.orderStatus === "DELIVERED") {
      await inventoryService.reserveStock(
        data.darkStoreId,
        data.productId,
        data.quantity,
      );
      await inventoryService.deductStock(
        data.darkStoreId,
        data.productId,
        data.quantity,
      );
    } else if (data.orderStatus === "PLACED") {
      await inventoryService.reserveStock(
        data.darkStoreId,
        data.productId,
        data.quantity,
      );
    }

    const now = new Date();
    const order = await OrderModel.create({
      orderId: randomUUID(),
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      quantity: data.quantity,
      sellingPrice: data.sellingPrice ?? product.sellingPrice,
      orderStatus: data.orderStatus,
      orderedAt: now,
      deliveredAt: data.orderStatus === "DELIVERED" ? now : undefined,
      sessionId: data.sessionId,
    });

    logger.info(ORDER_LOG.CREATED, {
      orderId: order.orderId,
      productId: data.productId,
    });

    return toOrderResponseDTO(order);
  }

  async getOrdersByProduct(productId: string): Promise<ProductOrderAnalyticsDTO> {
    await this.assertProductExists(productId);

    const since = getOrderWindowStart();
    const orders = await OrderModel.find({
      productId,
      orderStatus: { $in: COMPLETED_ORDER_STATUSES },
      orderedAt: { $gte: since },
    }).sort({ orderedAt: -1 });

    const orderCount = orders.length;
    const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.quantity * order.sellingPrice,
      0,
    );
    const conversionRate = await this.getConversionRate(productId, since);

    return {
      productId,
      orderCount,
      totalQuantity,
      totalRevenue,
      conversionRate,
      conversionScore: calculateConversionScore(conversionRate),
      windowHours: ORDER_WINDOW_HOURS,
      orders: toOrderResponseList(orders),
    };
  }

  async getConversionRate(
    productId: string,
    since: Date = getOrderWindowStart(),
  ): Promise<number> {
    assertValidObjectId(productId, "product ID");

    const [orderCount, cartCount] = await Promise.all([
      this.getCompletedOrderCount(productId, since),
      demandService.getCartCount(productId, since),
    ]);

    return cartCount === 0 ? 0 : orderCount / cartCount;
  }

  async getConversionScore(productId: string): Promise<ConversionScoreDTO> {
    await this.assertProductExists(productId);

    const since = getOrderWindowStart();
    const [orderCount, cartCount24h, conversionRate] = await Promise.all([
      this.getCompletedOrderCount(productId, since),
      demandService.getCartCount(productId, since),
      this.getConversionRate(productId, since),
    ]);

    return {
      productId,
      orderCount,
      cartCount24h,
      conversionRate,
      conversionScore: calculateConversionScore(conversionRate),
      windowHours: ORDER_WINDOW_HOURS,
    };
  }

  async getTopSellingProducts(limit = 10): Promise<TopSellingProductDTO[]> {
    const since = getOrderWindowStart();

    const results = await OrderModel.aggregate<{
      _id: Types.ObjectId;
      orderCount: number;
      totalQuantity: number;
      totalRevenue: number;
    }>([
      {
        $match: {
          orderStatus: { $in: COMPLETED_ORDER_STATUSES },
          orderedAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: "$productId",
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
        },
      },
      { $sort: { totalQuantity: -1, orderCount: -1 } },
      { $limit: limit },
    ]);

    return results.map((item) => ({
      productId: item._id.toString(),
      orderCount: item.orderCount,
      totalQuantity: item.totalQuantity,
      totalRevenue: item.totalRevenue,
    }));
  }
}

export const orderService = new OrderService();
