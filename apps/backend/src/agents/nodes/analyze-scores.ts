import type { AgentNode } from "../types.js";

export const analyzeScoresNode: AgentNode = async (state) => {
  if (!state.scores || !state.eligibility) {
    throw new Error("Scores and eligibility must be gathered first");
  }

  const { scores, eligibility } = state;
  const breakdown = [
    `Demand: ${(scores.demandScore * 100).toFixed(0)}%`,
    `Rating: ${(scores.ratingScore * 100).toFixed(0)}%`,
    `Conversion: ${(scores.conversionScore * 100).toFixed(0)}%`,
    `Composite: ${(scores.compositeScore * 100).toFixed(0)}%`,
  ].join(" | ");

  return {
    explanation: `Analysis for ${state.productName}: ${breakdown}. Recommended action: ${eligibility.action}.`,
  };
};
