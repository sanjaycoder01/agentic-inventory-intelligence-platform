import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { OrderModel } from "../orders/order.model.js";
import { ProductModel } from "../products/product.model.js";
import { RATING_ERRORS, RATING_LOG } from "./rating.constants.js";
import { RatingModel } from "./rating.model.js";
import {
  calculateRatingScore,
  toRatingResponseDTO,
  toRatingResponseList,
  type ProductRatingsDTO,
  type RatingResponseDTO,
  type RatingScoreDTO,
  type TopRatedProductDTO,
} from "./rating.types.js";
import type { SubmitRatingDTO } from "./rating.validation.js";

function assertValidObjectId(id: string, label: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${label}`);
  }
}

export class RatingService {
  private async assertProductExists(productId: string) {
    assertValidObjectId(productId, "product ID");

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new NotFoundError(RATING_ERRORS.PRODUCT_NOT_FOUND(productId));
    }

    return product;
  }

  private async assertDarkStoreExists(darkStoreId: string) {
    assertValidObjectId(darkStoreId, "dark store ID");

    const darkStore = await DarkStoreModel.findById(darkStoreId);
    if (!darkStore) {
      throw new NotFoundError(RATING_ERRORS.DARK_STORE_NOT_FOUND(darkStoreId));
    }

    return darkStore;
  }

  private async assertOrderMatches(data: SubmitRatingDTO) {
    assertValidObjectId(data.orderId, "order ID");

    const order = await OrderModel.findById(data.orderId);
    if (!order) {
      throw new NotFoundError(RATING_ERRORS.ORDER_NOT_FOUND(data.orderId));
    }

    if (order.productId.toString() !== data.productId) {
      throw new ValidationError(RATING_ERRORS.ORDER_PRODUCT_MISMATCH);
    }

    if (order.darkStoreId.toString() !== data.darkStoreId) {
      throw new ValidationError(RATING_ERRORS.ORDER_DARK_STORE_MISMATCH);
    }

    return order;
  }

  private async updateProductRatingAggregate(productId: string) {
    const [aggregate] = await RatingModel.aggregate<{
      _id: Types.ObjectId;
      averageRating: number;
      totalRatings: number;
    }>([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating = aggregate?.averageRating ?? 0;
    const totalRatings = aggregate?.totalRatings ?? 0;

    await DarkStoreProductModel.updateMany(
      { productId },
      { $set: { averageRating, totalRatings } },
    );

    logger.info(RATING_LOG.AGGREGATE_UPDATED, {
      productId,
      averageRating,
      totalRatings,
    });

    return { averageRating, totalRatings };
  }

  async submitRating(data: SubmitRatingDTO): Promise<RatingResponseDTO> {
    await this.assertProductExists(data.productId);
    await this.assertDarkStoreExists(data.darkStoreId);
    await this.assertOrderMatches(data);

    const existingRating = await RatingModel.findOne({ orderId: data.orderId });
    if (existingRating) {
      throw new ConflictError(RATING_ERRORS.ORDER_ALREADY_RATED(data.orderId));
    }

    logger.info(RATING_LOG.SUBMITTING, {
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      orderId: data.orderId,
    });

    const rating = await RatingModel.create({
      ratingId: randomUUID(),
      productId: data.productId,
      darkStoreId: data.darkStoreId,
      orderId: data.orderId,
      rating: data.rating,
      review: data.review,
      ratedAt: new Date(),
    });

    await this.updateProductRatingAggregate(data.productId);

    logger.info(RATING_LOG.SUBMITTED, {
      ratingId: rating.ratingId,
      productId: data.productId,
    });

    return toRatingResponseDTO(rating);
  }

  async getProductRatings(productId: string): Promise<ProductRatingsDTO> {
    await this.assertProductExists(productId);

    const [ratings, averageRating] = await Promise.all([
      RatingModel.find({ productId }).sort({ ratedAt: -1 }),
      this.getAverageRating(productId),
    ]);

    return {
      productId,
      averageRating,
      totalRatings: ratings.length,
      ratings: toRatingResponseList(ratings),
    };
  }

  async getAverageRating(productId: string): Promise<number> {
    await this.assertProductExists(productId);

    const productRating = await DarkStoreProductModel.findOne({ productId })
      .select("averageRating")
      .lean();

    return productRating?.averageRating ?? 0;
  }

  async getRatingScore(productId: string): Promise<RatingScoreDTO> {
    await this.assertProductExists(productId);

    const productRating = await DarkStoreProductModel.findOne({ productId })
      .select("averageRating totalRatings")
      .lean();

    const averageRating = productRating?.averageRating ?? 0;
    const totalRatings = productRating?.totalRatings ?? 0;

    return {
      productId,
      averageRating,
      totalRatings,
      ratingScore: calculateRatingScore(averageRating),
    };
  }

  async getTopRatedProducts(limit = 10): Promise<TopRatedProductDTO[]> {
    const results = await DarkStoreProductModel.aggregate<{
      _id: Types.ObjectId;
      averageRating: number;
      totalRatings: number;
    }>([
      { $match: { totalRatings: { $gt: 0 } } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $first: "$averageRating" },
          totalRatings: { $first: "$totalRatings" },
        },
      },
      { $sort: { averageRating: -1, totalRatings: -1 } },
      { $limit: limit },
    ]);

    return results.map((item) => ({
      productId: item._id.toString(),
      averageRating: item.averageRating,
      totalRatings: item.totalRatings,
      ratingScore: calculateRatingScore(item.averageRating),
    }));
  }
}

export const ratingService = new RatingService();
