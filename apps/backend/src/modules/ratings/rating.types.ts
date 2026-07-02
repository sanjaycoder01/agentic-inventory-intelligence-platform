import { MAX_RATING } from "./rating.constants.js";
import type { RatingDocument } from "./rating.model.js";

export interface RatingResponseDTO {
  id: string;
  ratingId: string;
  productId: string;
  darkStoreId: string;
  orderId: string;
  rating: number;
  review?: string;
  ratedAt: Date;
  createdAt: Date;
}

export interface ProductRatingsDTO {
  productId: string;
  averageRating: number;
  totalRatings: number;
  ratings: RatingResponseDTO[];
}

export interface RatingScoreDTO {
  productId: string;
  averageRating: number;
  totalRatings: number;
  ratingScore: number;
}

export interface TopRatedProductDTO {
  productId: string;
  averageRating: number;
  totalRatings: number;
  ratingScore: number;
}

type RatingLike = RatingDocument & {
  _id: { toString(): string };
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  orderId: { toString(): string };
  createdAt: Date;
};

export function calculateRatingScore(averageRating: number) {
  return Math.min(Math.max(averageRating / MAX_RATING, 0), 1);
}

export function toRatingResponseDTO(rating: RatingLike): RatingResponseDTO {
  return {
    id: rating._id.toString(),
    ratingId: rating.ratingId,
    productId: rating.productId.toString(),
    darkStoreId: rating.darkStoreId.toString(),
    orderId: rating.orderId.toString(),
    rating: rating.rating,
    review: rating.review ?? undefined,
    ratedAt: rating.ratedAt,
    createdAt: rating.createdAt,
  };
}

export function toRatingResponseList(
  ratings: RatingLike[],
): RatingResponseDTO[] {
  return ratings.map(toRatingResponseDTO);
}
