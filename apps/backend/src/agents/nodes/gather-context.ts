import { recommendationService } from "../../modules/intelligence/recommendation.service.js";
import type { AgentNode } from "../types.js";

export const gatherContextNode: AgentNode = async (state) => {
  const recommendation = await recommendationService.generateForProduct(
    state.productId,
  );

  return {
    productName: recommendation.productName,
    scores: recommendation.scores,
    eligibility: recommendation.eligibility,
  };
};
