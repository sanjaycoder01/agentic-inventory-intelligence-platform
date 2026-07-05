import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { DEMAND_MESSAGES } from "./demand.constants.js";
import { demandService } from "./demand.service.js";
import type { RecordCartEventDTO } from "./demand.validation.js";

export class DemandController {
  recordCartEvent = asyncHandler(async (req: Request, res: Response) => {
    const event = await demandService.recordCartEvent(req.body as RecordCartEventDTO);

    sendSuccess(res, 201, DEMAND_MESSAGES.CART_EVENT_RECORDED, event);
  });

  getProductDemand = asyncHandler(async (
    req: Request<{ productId: string }>,
    res: Response,
  ) => {
    const demand = await demandService.getProductDemand(req.params.productId);

    sendSuccess(res, 200, DEMAND_MESSAGES.DEMAND_RETRIEVED, demand);
  });

  getTrendingProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const products = await demandService.getTrendingProducts(limit);

    sendSuccess(res, 200, DEMAND_MESSAGES.TRENDING_RETRIEVED, products);
  });
}

export const demandController = new DemandController();
