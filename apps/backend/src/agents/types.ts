import type { ProductScores } from "../modules/intelligence/scoring.js";
import type { EligibilityResult } from "../modules/intelligence/eligibility.js";

export interface AgentState {
  productId: string;
  productName?: string;
  scores?: ProductScores;
  eligibility?: EligibilityResult;
  explanation?: string;
}

export type AgentNode = (state: AgentState) => Promise<Partial<AgentState>>;
