import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { ORDER_MESSAGES } from "./order.constants.js";
import { orderService } from "./order.service.js";
import type { CreateOrderDTO } from "./order.validation.js";

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.createOrder(req.body as CreateOrderDTO);

    sendSuccess(res, 201, ORDER_MESSAGES.CREATED, order);
  });

  getOrdersByProduct = asyncHandler(async (
    req: Request<{ productId: string }>,
    res: Response,
  ) => {
    const analytics = await orderService.getOrdersByProduct(req.params.productId);

    sendSuccess(res, 200, ORDER_MESSAGES.ANALYTICS_RETRIEVED, analytics);
  });

  getConversionScore = asyncHandler(async (
    req: Request<{ productId: string }>,
    res: Response,
  ) => {
    const conversion = await orderService.getConversionScore(req.params.productId);

    sendSuccess(res, 200, ORDER_MESSAGES.CONVERSION_RETRIEVED, conversion);
  });
}

export const orderController = new OrderController();
