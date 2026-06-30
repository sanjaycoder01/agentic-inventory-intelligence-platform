import { analyzeScoresNode } from "./nodes/analyze-scores.js";
import { explainDecisionNode } from "./nodes/explain-decision.js";
import { gatherContextNode } from "./nodes/gather-context.js";
import { generateRecommendationNode } from "./nodes/generate-recommendation.js";
import type { AgentState } from "./types.js";

const pipeline = [
  gatherContextNode,
  analyzeScoresNode,
  generateRecommendationNode,
  explainDecisionNode,
];

/** Run the inventory intelligence agent pipeline for a product */
export async function runIntelligenceGraph(
  productId: string,
): Promise<AgentState> {
  let state: AgentState = { productId };

  for (const node of pipeline) {
    const update = await node(state);
    state = { ...state, ...update };
  }

  return state;
}

// TODO: migrate to @langchain/langgraph StateGraph when agent logic stabilizes
