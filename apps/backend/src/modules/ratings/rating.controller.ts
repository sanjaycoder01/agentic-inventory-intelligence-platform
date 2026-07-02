import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { RATING_MESSAGES } from "./rating.constants.js";
import { ratingService } from "./rating.service.js";
import type { SubmitRatingDTO } from "./rating.validation.js";

export class RatingController {
  submitRating = asyncHandler(async (req: Request, res: Response) => {
    const rating = await ratingService.submitRating(req.body as SubmitRatingDTO);

    sendSuccess(res, 201, RATING_MESSAGES.SUBMITTED, rating);
  });

  getProductRatings = asyncHandler(async (req: Request, res: Response) => {
    const ratings = await ratingService.getProductRatings(
      req.params.productId as string,
    );

    sendSuccess(res, 200, RATING_MESSAGES.RATINGS_RETRIEVED, ratings);
  });

  getRatingScore = asyncHandler(async (req: Request, res: Response) => {
    const score = await ratingService.getRatingScore(
      req.params.productId as string,
    );

    sendSuccess(res, 200, RATING_MESSAGES.SCORE_RETRIEVED, score);
  });

  getTopRatedProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const products = await ratingService.getTopRatedProducts(limit);

    sendSuccess(res, 200, RATING_MESSAGES.TOP_RATED_RETRIEVED, products);
  });
}

export const ratingController = new RatingController();
