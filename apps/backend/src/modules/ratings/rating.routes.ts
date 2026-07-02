import { Router } from "express";
import { ratingController } from "./rating.controller.js";
import {
  validateProductIdParam,
  validateSubmitRating,
} from "./rating.validation.js";

export const ratingRouter = Router();

ratingRouter.post("/", validateSubmitRating, ratingController.submitRating);
ratingRouter.get("/top", ratingController.getTopRatedProducts);
ratingRouter.get(
  "/score/:productId",
  validateProductIdParam,
  ratingController.getRatingScore,
);
ratingRouter.get(
  "/:productId",
  validateProductIdParam,
  ratingController.getProductRatings,
);
