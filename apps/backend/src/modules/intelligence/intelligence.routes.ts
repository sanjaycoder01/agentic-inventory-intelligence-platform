import { Router } from "express";
import { recommendationPersistenceService } from "./recommendation-persistence.service.js";
import { workflowService } from "../workflow/workflow.service.js";

export const intelligenceRouter = Router();

intelligenceRouter.get("/", async (_req, res, next) => {
  try {
    const recommendations = await recommendationPersistenceService.getPendingRecommendations();
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get("/:id", async (req, res, next) => {
  try {
    const rec = await recommendationPersistenceService.getRecommendation(req.params.id);
    res.json(rec);
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const rec = await recommendationPersistenceService.getRecommendation(req.params.id);
    // Approval runs the workflow
    const result = await workflowService.runApprovedRecommendationWorkflow(rec);
    // Mark as approved in persistence
    await recommendationPersistenceService.approveRecommendation(req.params.id, req.body.approvedBy ?? "admin");
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
      req.body.rejectionReason
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
