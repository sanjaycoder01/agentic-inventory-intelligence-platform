import { Router } from "express";
import { analyticsService } from "./analytics.service.js";

export const analyticsRouter = Router();

analyticsRouter.get("/executive-dashboard", async (_req, res, next) => {
  try {
    const data = await analyticsService.getExecutiveDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/demand", async (_req, res, next) => {
  try {
    const data = await analyticsService.getDemandAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/orders", async (_req, res, next) => {
  try {
    const data = await analyticsService.getOrderAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/ratings", async (_req, res, next) => {
  try {
    const data = await analyticsService.getRatingAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/inventory", async (_req, res, next) => {
  try {
    const data = await analyticsService.getInventorySummary();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/recommendations", async (_req, res, next) => {
  try {
    const data = await analyticsService.getRecommendationAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/dark-stores", async (_req, res, next) => {
  try {
    const data = await analyticsService.getDarkStoreDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/warehouses", async (_req, res, next) => {
  try {
    const data = await analyticsService.getWarehouseDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
