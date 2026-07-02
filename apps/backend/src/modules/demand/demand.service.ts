import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { ProductModel } from "../products/product.model.js";
import { OrderModel } from "./order.model.js";
import { DEMAND_ERRORS, DEMAND_LOG, DEMAND_WINDOW_HOURS } from "./demand.constants.js";
import { CartEventModel } from "./demand.model.js";
import {
  toCartEventResponseDTO,
  type CartEventResponseDTO,
  type ProductDemandDTO,
  type TrendingProductDTO,
} from "./demand.types.js";
import type { RecordCartEventDTO } from "./demand.validation.js";

function assertValidObjectId(id: string, label: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${label}`);
  }
}

function getDemandWindowStart(hours = DEMAND_WINDOW_HOURS) {
  const since = new Date();
  since.setHours(since.getHours() - hours);
  return since;
}

function calculateDemandScore(cartCount: number, maxCartCount: number) {
  if (maxCartCount <= 0) {
    return 0;
  }

  return Math.min(cartCount / maxCartCount, 1);
}

export class DemandService {
  private async assertProductExists(productId: string) {
    assertValidObjectId(productId, "product ID");

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new NotFoundError(DEMAND_ERRORS.PRODUCT_NOT_FOUND(productId));
    }

    return product;
  }

  private async assertDarkStoreExists(darkStoreId: string) {
    assertValidObjectId(darkStoreId, "dark store ID");

    const darkStore = await DarkStoreModel.findById(darkStoreId);
    if (!darkStore) {
      throw new NotFoundError(DEMAND_ERRORS.DARK_STORE_NOT_FOUND(darkStoreId));
    }

    return darkStore;
  }

  private async aggregateCartCounts(since: Date) {
    const results = await CartEventModel.aggregate<{
      _id: Types.ObjectId;
      cartCount: number;
    }>([
      {
        $match: {
          eventTimestamp: { $gte: since },
          eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] },
        },
      },
      {
        $group: {
          _id: {
            productId: "$productId",
            eventType: "$eventType",
          },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.productId",
          cartCount: {
            $sum: {
              $cond: [
                { $eq: ["$_id.eventType", "ADD_TO_CART"] },
                "$totalQuantity",
                { $multiply: ["$totalQuantity", -1] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          cartCount: { $max: [0, "$cartCount"] },
        },
      },
    ]);

    return results;
  }

  async recordCartEvent(data: RecordCartEventDTO): Promise<CartEventResponseDTO> {
    await this.assertProductExists(data.productId);
    await this.assertDarkStoreExists(data.darkStoreId);

    logger.info(DEMAND_LOG.RECORDING_CART_EVENT, {
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      eventType: data.eventType,
    });

    const event = await CartEventModel.create({
      eventId: randomUUID(),
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      quantity: data.quantity,
      eventType: data.eventType,
      eventTimestamp: new Date(),
      sessionId: data.sessionId,
    });

    logger.info(DEMAND_LOG.CART_EVENT_RECORDED, {
      eventId: event.eventId,
      productId: data.productId,
    });

    return toCartEventResponseDTO(event);
  }

  async getCartCount(productId: string, since: Date): Promise<number> {
    assertValidObjectId(productId, "product ID");

    const [adds, removes] = await Promise.all([
      CartEventModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: new Types.ObjectId(productId),
            eventType: "ADD_TO_CART",
            eventTimestamp: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      CartEventModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: new Types.ObjectId(productId),
            eventType: "REMOVE_FROM_CART",
            eventTimestamp: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
    ]);

    const added = adds[0]?.total ?? 0;
    const removed = removes[0]?.total ?? 0;

    return Math.max(0, added - removed);
  }

  async getDemandScore(productId: string): Promise<number> {
    const since = getDemandWindowStart();
    const [cartCount24h, aggregates] = await Promise.all([
      this.getCartCount(productId, since),
      this.aggregateCartCounts(since),
    ]);

    const maxCartCount = aggregates.reduce(
      (max, item) => Math.max(max, item.cartCount),
      0,
    );

    return calculateDemandScore(cartCount24h, maxCartCount);
  }

  async getProductDemand(productId: string): Promise<ProductDemandDTO> {
    await this.assertProductExists(productId);

    const since = getDemandWindowStart();
    const cartCount24h = await this.getCartCount(productId, since);
    const demandScore = await this.getDemandScore(productId);

    return {
      productId,
      cartCount24h,
      demandScore,
      windowHours: DEMAND_WINDOW_HOURS,
    };
  }

  async getTrendingProducts(limit = 10): Promise<TrendingProductDTO[]> {
    const since = getDemandWindowStart();
    const aggregates = await this.aggregateCartCounts(since);

    if (aggregates.length === 0) {
      return [];
    }

    const maxCartCount = aggregates.reduce(
      (max, item) => Math.max(max, item.cartCount),
      0,
    );

    return aggregates
      .map((item) => ({
        productId: item._id.toString(),
        cartCount24h: item.cartCount,
        demandScore: calculateDemandScore(item.cartCount, maxCartCount),
      }))
      .sort((a, b) => b.demandScore - a.demandScore || b.cartCount24h - a.cartCount24h)
      .slice(0, limit);
  }

  /** Temporary read helper until the Orders module owns conversion metrics. */
  async getConversionRate(productId: string, since: Date): Promise<number> {
    assertValidObjectId(productId, "product ID");

    const [cartCount, orderCount] = await Promise.all([
      this.getCartCount(productId, since),
      OrderModel.countDocuments({
        productId,
        orderedAt: { $gte: since },
      }),
    ]);

    return cartCount === 0 ? 0 : orderCount / cartCount;
  }
}

export const demandService = new DemandService();
