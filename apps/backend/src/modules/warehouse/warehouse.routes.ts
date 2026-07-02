import { Router } from "express";
import { warehouseController } from "./warehouse.controller.js";
import {
  validateCreateWarehouse,
  validateUpdateWarehouse,
  validateWarehouseIdParam,
} from "./warehouse.validation.js";

export const warehouseRouter = Router();

warehouseRouter.post("/", validateCreateWarehouse, warehouseController.createWarehouse);
warehouseRouter.get("/", warehouseController.getAllWarehouses);
warehouseRouter.get("/:id", validateWarehouseIdParam, warehouseController.getWarehouseById);
warehouseRouter.put("/:id", validateUpdateWarehouse, warehouseController.updateWarehouse);
warehouseRouter.delete("/:id", validateWarehouseIdParam, warehouseController.deleteWarehouse);
