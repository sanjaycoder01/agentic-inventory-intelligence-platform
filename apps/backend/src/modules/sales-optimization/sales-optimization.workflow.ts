import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notification.constants.js";
import { notificationService } from "../notifications/notification.service.js";
import { SalesActionModel } from "./sales-action.model.js";
import type { SalesStrategyType } from "./sales-optimization.types.js";

function actionTypeForStrategy(strategy: string) {
  switch (strategy) {
    case "DISCOUNT":
    case "CLEARANCE":
    case "LIQUIDATE":
      return "PROMOTION" as const;
    case "RUN_ADS":
    case "HOMEPAGE_HIGHLIGHT":
      return "MARKETING_CAMPAIGN" as const;
    case "BUNDLE":
      return "BUNDLE_DEFINITION" as const;
    case "PRICE_REVIEW":
      return "PRICING_REVIEW_TASK" as const;
    case "QUALITY_CHECK":
      return "QA_INVESTIGATION_TASK" as const;
    default:
      return null;
  }
}

export class SalesOptimizationWorkflowService {
  async runApproved(recommendationId: string, approvedBy = "admin") {
    const rec = await RecommendationModel.findOne({ recommendationId });
    if (!rec) {
      throw new NotFoundError(`Recommendation ${recommendationId} not found`);
    }
    if (rec.intelligenceType !== "SALES_OPTIMIZATION") {
      throw new ValidationError(
        "Only sales optimization recommendations can use this workflow",
      );
    }
    if (rec.status !== "PENDING") {
      throw new ValidationError(
        `Recommendation ${recommendationId} is already ${rec.status}`,
      );
    }

    const strategy = (rec.strategy ??
      rec.recommendationType) as SalesStrategyType;
    const actionType = actionTypeForStrategy(strategy);

    let actionReferenceId: string | undefined;

    if (actionType) {
      const action = await SalesActionModel.create({
        actionId: randomUUID(),
        actionType,
        recommendationId,
        productId: rec.productId,
        darkStoreId: rec.darkStoreId,
        strategy,
        discountPercent: rec.discountPercent,
        title: `${strategy} for product ${rec.productId}`,
        details: {
          summary: rec.summary,
          metrics: rec.metrics,
          matchedRule: rec.matchedRule,
        },
        status: "ACTIVE",
        createdBy: approvedBy,
      });
      actionReferenceId = action.actionId;
    }

    const updated = await RecommendationModel.findOneAndUpdate(
      { recommendationId },
      {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        actionReferenceId,
      },
      { new: true },
    );

    await notificationService
      .publish({
        eventType: NOTIFICATION_EVENT_TYPES.SALES_OPTIMIZATION_APPROVED,
        entityType: "SalesOptimizationRecommendation",
        entityId: recommendationId,
        payload: {
          strategy,
          actionReferenceId,
          summary: rec.summary,
        },
      })
      .catch(() => undefined);

    return {
      recommendationId,
      strategy,
      actionReferenceId,
      status: "APPROVED" as const,
      recommendation: updated,
    };
  }
}

export const salesOptimizationWorkflowService =
  new SalesOptimizationWorkflowService();
