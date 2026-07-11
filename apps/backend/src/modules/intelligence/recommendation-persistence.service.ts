import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { RecommendationModel } from "./recommendation.model.js";
import { RecommendationType } from "./recommendation.types.js";
import { calculateReorderQuantity } from "./scoring.js";
import type {
  RecommendationSnapshotDTO,
  SaveRecommendationInput,
} from "./recommendation-persistence.types.js";
import { toRecommendationSnapshotDTO } from "./recommendation-persistence.types.js";

export class RecommendationPersistenceService {
  async saveRecommendation(
    input: SaveRecommendationInput,
  ): Promise<RecommendationSnapshotDTO> {
    const { signals, eligibility, recommendation, explanation } = input;

    const recommendedQuantity =
      recommendation.recommendation === RecommendationType.REORDER
        ? calculateReorderQuantity({
            cartCount: signals.cartCount24h ?? 0,
            windowHours: signals.windowHours,
          })
        : undefined;

    const overallScore =
      eligibility.replenishmentScore ??
      signals.replenishmentScore ??
      recommendation.confidence;

    const savedRecommendation = await RecommendationModel.create({
      recommendationId: randomUUID(),
      productId: signals.productId,
      darkStoreId: signals.darkStoreId,
      recommendationType: recommendation.recommendation,
      recommendationReason: explanation.summary,
      matchedRule: recommendation.matchedRule,
      eligible: eligibility.eligible,
      demandScore: signals.demandScore,
      conversionScore: signals.conversionScore,
      ratingScore: signals.ratingScore,
      overallScore,
      availableQuantity: signals.availableQuantity,
      reservedQuantity: signals.reservedQuantity,
      warehouseStock: signals.warehouseStock,
      summary: explanation.summary,
      factors: explanation.factors,
      recommendedQuantity,
      status: "PENDING",
      generatedAt: new Date(),
    });

    return toRecommendationSnapshotDTO(savedRecommendation);
  }

  async getRecommendation(
    recommendationId: string,
  ): Promise<RecommendationSnapshotDTO> {
    const recommendation = await RecommendationModel.findOne({ recommendationId });
    if (!recommendation) {
      throw new NotFoundError(`Recommendation ${recommendationId} not found`);
    }

    return toRecommendationSnapshotDTO(recommendation);
  }

  async getPendingRecommendations(): Promise<RecommendationSnapshotDTO[]> {
    const recommendations = await RecommendationModel.find({
      status: "PENDING",
    }).sort({ generatedAt: -1 });

    return recommendations.map(toRecommendationSnapshotDTO);
  }

  async approveRecommendation(
    recommendationId: string,
    approvedBy?: string,
  ): Promise<RecommendationSnapshotDTO> {
    return this.updateRecommendationStatus(recommendationId, {
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
    });
  }

  async rejectRecommendation(
    recommendationId: string,
    rejectedBy?: string,
    rejectionReason?: string,
  ): Promise<RecommendationSnapshotDTO> {
    return this.updateRecommendationStatus(recommendationId, {
      status: "REJECTED",
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason,
    });
  }

  private async updateRecommendationStatus(
    recommendationId: string,
    update: {
      status: "APPROVED" | "REJECTED";
      approvedBy?: string;
      approvedAt?: Date;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
    },
  ): Promise<RecommendationSnapshotDTO> {
    const existing = await RecommendationModel.findOne({ recommendationId });
    if (!existing) {
      throw new NotFoundError(`Recommendation ${recommendationId} not found`);
    }

    if (existing.status !== "PENDING") {
      throw new ValidationError(
        `Recommendation ${recommendationId} is already ${existing.status}`,
      );
    }

    const recommendation = await RecommendationModel.findOneAndUpdate(
      { recommendationId },
      update,
      { new: true, runValidators: true },
    );

    if (!recommendation) {
      throw new NotFoundError(`Recommendation ${recommendationId} not found`);
    }

    return toRecommendationSnapshotDTO(recommendation);
  }
}

export const recommendationPersistenceService =
  new RecommendationPersistenceService();
