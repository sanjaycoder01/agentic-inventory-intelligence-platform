import { Router } from "express";
import { z } from "zod";
import { NotFoundError, ValidationError } from "../../middleware/app-errors.js";
import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { salesOptimizationPipelineService } from "./sales-optimization.pipeline.js";
import { salesOptimizationWorkflowService } from "./sales-optimization.workflow.js";

export const salesOptimizationRouter = Router();

const generateSchema = z.object({
  darkStoreId: z.string().optional(),
  productId: z.string().optional(),
});

salesOptimizationRouter.post("/generate", async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body ?? {});
    const result = await salesOptimizationPipelineService.generate(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

salesOptimizationRouter.get("/", async (_req, res, next) => {
  try {
    const recommendations = await RecommendationModel.find({
      intelligenceType: "SALES_OPTIMIZATION",
      status: { $in: ["PENDING", "BLOCKED"] },
    }).sort({ generatedAt: -1 });
    res.json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
});

salesOptimizationRouter.get("/history", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {
      intelligenceType: "SALES_OPTIMIZATION",
    };
    if (typeof req.query.productId === "string") {
      filter.productId = req.query.productId;
    }
    if (typeof req.query.darkStoreId === "string") {
      filter.darkStoreId = req.query.darkStoreId;
    }
    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 50;

    const history = await RecommendationModel.find(filter)
      .sort({ generatedAt: -1 })
      .limit(Number.isFinite(limit) ? limit : 50);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

salesOptimizationRouter.get("/:id", async (req, res, next) => {
  try {
    const rec = await RecommendationModel.findOne({
      recommendationId: req.params.id,
      intelligenceType: "SALES_OPTIMIZATION",
    });
    if (!rec) {
      throw new NotFoundError(
        `Sales optimization recommendation ${req.params.id} not found`,
      );
    }
    res.json({ success: true, data: rec });
  } catch (err) {
    next(err);
  }
});

salesOptimizationRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const result = await salesOptimizationWorkflowService.runApproved(
      req.params.id,
      req.body.approvedBy ?? "admin",
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

salesOptimizationRouter.post("/:id/reject", async (req, res, next) => {
  try {
    const existing = await RecommendationModel.findOne({
      recommendationId: req.params.id,
      intelligenceType: "SALES_OPTIMIZATION",
    });
    if (!existing) {
      throw new NotFoundError(
        `Sales optimization recommendation ${req.params.id} not found`,
      );
    }
    if (existing.status !== "PENDING" && existing.status !== "BLOCKED") {
      throw new ValidationError(
        `Recommendation ${req.params.id} is already ${existing.status}`,
      );
    }

    const updated = await RecommendationModel.findOneAndUpdate(
      { recommendationId: req.params.id },
      {
        status: "REJECTED",
        rejectedBy: req.body.rejectedBy ?? "admin",
        rejectedAt: new Date(),
        rejectionReason: req.body.rejectionReason,
      },
      { new: true },
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
