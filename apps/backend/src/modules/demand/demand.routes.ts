import { Router } from "express";
import { demandController } from "./demand.controller.js";
import {
  validateProductIdParam,
  validateRecordCartEvent,
} from "./demand.validation.js";

export const cartEventRouter = Router();

cartEventRouter.post("/", validateRecordCartEvent, demandController.recordCartEvent);

export const demandRouter = Router();

demandRouter.get("/trending", demandController.getTrendingProducts);
demandRouter.get("/:productId", validateProductIdParam, demandController.getProductDemand);
