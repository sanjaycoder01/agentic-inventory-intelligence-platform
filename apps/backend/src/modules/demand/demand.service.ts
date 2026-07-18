import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { ProductModel } from "../products/product.model.js";
import { calculateDemandIntelligence } from "./demand-intelligence.calculations.js";
import { DEMAND_WINDOWS } from "./demand-intelligence.constants.js";
import type { DemandIntelligenceMetrics } from "./demand-intelligence.types.js";
import {
  DEMAND_ERRORS,
  DEMAND_LOG,
  DEMAND_WINDOW_HOURS,
} from "./demand.constants.js";
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

function minutesAgo(minutes: number): Date {
  const since = new Date();
  since.setMinutes(since.getMinutes() - minutes);
  return since;
}

function getDemandWindowStart(hours = DEMAND_WINDOW_HOURS) {
  return minutesAgo(hours * 60);
}

/** Legacy relative score — kept for trending comparison across catalog */
function calculateRelativeDemandScore(cartCount: number, maxCartCount: number) {
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

  async recordCartEvent(
    data: RecordCartEventDTO,
  ): Promise<{ event: CartEventResponseDTO; created: boolean }> {
    await this.assertProductExists(data.productId);
    await this.assertDarkStoreExists(data.darkStoreId);

    const eventId = data.eventId ?? randomUUID();
    const existing = await CartEventModel.findOne({ eventId });
    if (existing) {
      return { event: toCartEventResponseDTO(existing), created: false };
    }

    logger.info(DEMAND_LOG.RECORDING_CART_EVENT, {
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      eventType: data.eventType,
      eventId,
    });

    const event = await CartEventModel.create({
      eventId,
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

    return { event: toCartEventResponseDTO(event), created: true };
  }

  async getCartCount(
    productId: string,
    since: Date,
    darkStoreId?: string,
  ): Promise<number> {
    assertValidObjectId(productId, "product ID");
    if (darkStoreId) {
      assertValidObjectId(darkStoreId, "dark store ID");
    }

    const matchBase: Record<string, unknown> = {
      productId: new Types.ObjectId(productId),
      eventTimestamp: { $gte: since },
    };
    if (darkStoreId) {
      matchBase.darkStoreId = new Types.ObjectId(darkStoreId);
    }

    const [adds, removes] = await Promise.all([
      CartEventModel.aggregate<{ total: number }>([
        {
          $match: {
            ...matchBase,
            eventType: "ADD_TO_CART",
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      CartEventModel.aggregate<{ total: number }>([
        {
          $match: {
            ...matchBase,
            eventType: "REMOVE_FROM_CART",
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
    ]);

    const added = adds[0]?.total ?? 0;
    const removed = removes[0]?.total ?? 0;

    return Math.max(0, added - removed);
  }

  /**
   * Multi-window demand intelligence for a product (optionally scoped to a dark store).
   */
  async getDemandIntelligence(
    productId: string,
    darkStoreId?: string,
  ): Promise<DemandIntelligenceMetrics> {
    const [last5Min, last30Min, last2Hours, last24Hours] = await Promise.all([
      this.getCartCount(productId, minutesAgo(DEMAND_WINDOWS.FIVE_MIN), darkStoreId),
      this.getCartCount(
        productId,
        minutesAgo(DEMAND_WINDOWS.THIRTY_MIN),
        darkStoreId,
      ),
      this.getCartCount(
        productId,
        minutesAgo(DEMAND_WINDOWS.TWO_HOURS),
        darkStoreId,
      ),
      this.getCartCount(
        productId,
        minutesAgo(DEMAND_WINDOWS.TWENTY_FOUR_HOURS),
        darkStoreId,
      ),
    ]);

    return calculateDemandIntelligence({
      last5Min,
      last30Min,
      last2Hours,
      last24Hours,
    });
  }

  async getDemandScore(productId: string, darkStoreId?: string): Promise<number> {
    const intelligence = await this.getDemandIntelligence(productId, darkStoreId);
    return intelligence.demandScore;
  }

  async getProductDemand(
    productId: string,
    darkStoreId?: string,
  ): Promise<ProductDemandDTO> {
    await this.assertProductExists(productId);
    if (darkStoreId) {
      await this.assertDarkStoreExists(darkStoreId);
    }

    const demandIntelligence = await this.getDemandIntelligence(
      productId,
      darkStoreId,
    );

    return {
      productId,
      cartCount24h: demandIntelligence.last24Hours,
      demandScore: demandIntelligence.demandScore,
      windowHours: DEMAND_WINDOW_HOURS,
      demandIntelligence,
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
        demandScore: calculateRelativeDemandScore(item.cartCount, maxCartCount),
      }))
      .sort((a, b) => b.demandScore - a.demandScore || b.cartCount24h - a.cartCount24h)
      .slice(0, limit);
  }
}

export const demandService = new DemandService();
