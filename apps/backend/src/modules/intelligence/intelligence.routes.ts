import { Router } from "express";
import { z } from "zod";
import { agentDecisionService } from "./agent-decision.service.js";
import { recommendationPersistenceService } from "./recommendation-persistence.service.js";
import { recommendationPipelineService } from "./recommendation-pipeline.service.js";
import { workflowService } from "../workflow/workflow.service.js";

export const intelligenceRouter = Router();

const generateSchema = z.object({
  darkStoreId: z.string().optional(),
  productId: z.string().optional(),
});

intelligenceRouter.post("/generate", async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body ?? {});
    const result = await recommendationPipelineService.generate(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/history", async (req, res, next) => {
  try {
    const productId =
      typeof req.query.productId === "string" ? req.query.productId : undefined;
    const darkStoreId =
      typeof req.query.darkStoreId === "string"
        ? req.query.darkStoreId
        : undefined;
    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 50;

    const history = await recommendationPersistenceService.getRecommendationHistory(
      productId,
      darkStoreId,
      Number.isFinite(limit) ? limit : 50,
    );
    res.json(history);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/decisions/:productId", async (req, res, next) => {
  try {
    const decisions = await agentDecisionService.listByProduct(
      req.params.productId,
    );
    res.json({ success: true, data: decisions });
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/", async (_req, res, next) => {
  try {
    const recommendations =
      await recommendationPersistenceService.getPendingRecommendations();
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/:id", async (req, res, next) => {
  try {
    const rec = await recommendationPersistenceService.getRecommendation(
      req.params.id,
    );
    res.json(rec);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const rec = await recommendationPersistenceService.getRecommendation(
      req.params.id,
    );
    if (rec.status === "BLOCKED" || !rec.eligible) {
      res.status(400).json({
        success: false,
        error: "Blocked or ineligible recommendations cannot be approved",
      });
      return;
    }
    const result = await workflowService.runApprovedRecommendationWorkflow(rec);
    await recommendationPersistenceService.approveRecommendation(
      req.params.id,
      req.body.approvedBy ?? "admin",
    );
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.post("/:id/reject", async (req, res, next) => {
  try {
    await recommendationPersistenceService.rejectRecommendation(
      req.params.id,
      req.body.rejectedBy ?? "admin",
      req.body.rejectionReason,
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
