import { Router } from "express";
import { recommendationService } from "./recommendation.service.js";

export const intelligenceRouter = Router();

intelligenceRouter.get("/recommendations", async (_req, res, next) => {
  try {
    const recommendations = await recommendationService.listRecommendations();
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/recommendations/:productId", async (req, res, next) => {
  try {
    const recommendation = await recommendationService.generateForProduct(
      req.params.productId,
    );
    res.json(recommendation);
  } catch (err) {
    next(err);
  }
});
