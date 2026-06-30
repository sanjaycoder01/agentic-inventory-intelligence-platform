import type { AgentNode } from "../types.js";

export const generateRecommendationNode: AgentNode = async (state) => {
  if (!state.eligibility) {
    throw new Error("Eligibility must be evaluated first");
  }

  return {
    explanation: `${state.explanation ?? ""} Decision: ${state.eligibility.action} — ${state.eligibility.reason}`,
  };
};
