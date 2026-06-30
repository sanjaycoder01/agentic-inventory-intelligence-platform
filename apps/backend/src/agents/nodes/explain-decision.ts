import type { AgentNode } from "../types.js";

export const explainDecisionNode: AgentNode = async (state) => {
  if (!state.scores || !state.eligibility) {
    throw new Error("Cannot explain without scores and eligibility");
  }

  const explanation = [
    `Product: ${state.productName} (${state.productId})`,
    `Action: ${state.eligibility.action}`,
    `Reason: ${state.eligibility.reason}`,
    `Score breakdown — demand ${state.scores.demandScore.toFixed(2)}, rating ${state.scores.ratingScore.toFixed(2)}, conversion ${state.scores.conversionScore.toFixed(2)}, composite ${state.scores.compositeScore.toFixed(2)}`,
  ].join("\n");

  return { explanation };
};
