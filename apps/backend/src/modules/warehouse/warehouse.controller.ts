import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { WAREHOUSE_MESSAGES } from "./warehouse.constants.js";
import { warehouseService } from "./warehouse.service.js";
import type {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
} from "./warehouse.validation.js";

export class WarehouseController {
  createWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await warehouseService.createWarehouse(
      req.body as CreateWarehouseDTO,
    );

    sendSuccess(res, 201, WAREHOUSE_MESSAGES.CREATED, warehouse);
  });

  getWarehouseById = asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);

    sendSuccess(res, 200, WAREHOUSE_MESSAGES.RETRIEVED, warehouse);
  });

  getAllWarehouses = asyncHandler(async (_req: Request, res: Response) => {
    const warehouses = await warehouseService.getAllWarehouses();

    sendSuccess(res, 200, WAREHOUSE_MESSAGES.RETRIEVED_ALL, warehouses);
  });

  updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await warehouseService.updateWarehouse(
      req.params.id,
      req.body as UpdateWarehouseDTO,
    );

    sendSuccess(res, 200, WAREHOUSE_MESSAGES.UPDATED, warehouse);
  });

  deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await warehouseService.deleteWarehouse(req.params.id);

    sendSuccess(res, 200, WAREHOUSE_MESSAGES.DEACTIVATED, warehouse);
  });
}

export const warehouseController = new WarehouseController();
