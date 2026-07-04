import type { RecommendationRuleId } from "./recommendation.types.js";
import type { ExplanationTemplate } from "./explanation.types.js";

export const explanationTemplates: Record<
  RecommendationRuleId,
  ExplanationTemplate
> = {
  RULE_REORDER: {
    summary:
      "Inventory is running low while demand, conversion, and ratings remain strong. Warehouse stock is available, so replenishment is recommended.",
  },
  RULE_DO_NOT_REORDER_LOW_CONVERSION: {
    summary:
      "Although customer interest is high, too few customers complete purchases. Reordering could increase unsold inventory.",
  },
  RULE_RETURN_TO_WAREHOUSE: {
    summary:
      "Demand is weak while store inventory remains high. Returning excess stock to the warehouse can reduce holding risk.",
  },
  RULE_NO_ACTION: {
    summary:
      "No inventory action is recommended because the current signals do not match a reorder or return rule.",
  },
};
