import { Router } from "express";
import { orderController } from "./order.controller.js";
import {
  validateCreateOrder,
  validateProductIdParam,
} from "./order.validation.js";

export const orderRouter = Router();

orderRouter.post("/", validateCreateOrder, orderController.createOrder);
orderRouter.get(
  "/conversion/:productId",
  validateProductIdParam,
  orderController.getConversionScore,
);
orderRouter.get(
  "/:productId",
  validateProductIdParam,
  orderController.getOrdersByProduct,
);
