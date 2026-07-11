import { randomUUID } from "node:crypto";
import { AgentDecisionModel, type AgentDecisionNode } from "./agent-decision.model.js";

export interface LogAgentDecisionInput {
  runId: string;
  nodeName: AgentDecisionNode;
  productId: string;
  darkStoreId: string;
  relatedRecommendationId?: string;
  inputSummary: Record<string, unknown>;
  outputSummary: Record<string, unknown> | string;
  reasoningText: string;
}

export class AgentDecisionService {
  async log(input: LogAgentDecisionInput) {
    return AgentDecisionModel.create({
      decisionId: randomUUID(),
      runId: input.runId,
      nodeName: input.nodeName,
      productId: input.productId,
      darkStoreId: input.darkStoreId,
      relatedRecommendationId: input.relatedRecommendationId,
      inputSummary: input.inputSummary,
      outputSummary: input.outputSummary,
      reasoningText: input.reasoningText,
    });
  }

  async listByProduct(productId: string, limit = 50) {
    return AgentDecisionModel.find({ productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async listByRun(runId: string) {
    return AgentDecisionModel.find({ runId }).sort({ createdAt: 1 }).lean();
  }
}

export const agentDecisionService = new AgentDecisionService();
