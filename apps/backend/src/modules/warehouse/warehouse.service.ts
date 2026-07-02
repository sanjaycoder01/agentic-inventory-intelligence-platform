import { ConflictError, NotFoundError } from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { WAREHOUSE_ERRORS, WAREHOUSE_LOG } from "./warehouse.constants.js";
import { WarehouseModel } from "./warehouse.model.js";
import {
  toWarehouseResponseDTO,
  toWarehouseResponseList,
  type WarehouseResponseDTO,
} from "./warehouse.types.js";
import type {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
} from "./warehouse.validation.js";

const LISTABLE_STATUSES = ["ACTIVE", "UNDER_MAINTENANCE"] as const;

export class WarehouseService {
  async createWarehouse(
    data: CreateWarehouseDTO,
  ): Promise<WarehouseResponseDTO> {
    logger.info(WAREHOUSE_LOG.CREATING, { warehouseCode: data.warehouseCode });

    const existing = await WarehouseModel.findOne({
      warehouseCode: data.warehouseCode,
    });
    if (existing) {
      throw new ConflictError(
        WAREHOUSE_ERRORS.ALREADY_EXISTS(data.warehouseCode),
      );
    }

    const warehouse = await WarehouseModel.create({
      ...data,
      status: data.status ?? "ACTIVE",
    });

    logger.info(WAREHOUSE_LOG.CREATED, {
      warehouseId: warehouse._id.toString(),
      warehouseCode: data.warehouseCode,
    });

    return toWarehouseResponseDTO(warehouse);
  }

  async getWarehouseById(id: string): Promise<WarehouseResponseDTO> {
    const warehouse = await WarehouseModel.findById(id);
    if (!warehouse) {
      throw new NotFoundError(WAREHOUSE_ERRORS.NOT_FOUND(id));
    }

    return toWarehouseResponseDTO(warehouse);
  }

  async getAllWarehouses(): Promise<WarehouseResponseDTO[]> {
    const warehouses = await WarehouseModel.find({
      status: { $in: LISTABLE_STATUSES },
    }).sort({ name: 1 });

    return toWarehouseResponseList(warehouses);
  }

  async updateWarehouse(
    id: string,
    data: UpdateWarehouseDTO,
  ): Promise<WarehouseResponseDTO> {
    logger.info(WAREHOUSE_LOG.UPDATING, { warehouseId: id });

    const warehouse = await WarehouseModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!warehouse) {
      throw new NotFoundError(WAREHOUSE_ERRORS.NOT_FOUND(id));
    }

    logger.info(WAREHOUSE_LOG.UPDATED, { warehouseId: id });

    return toWarehouseResponseDTO(warehouse);
  }

  async deleteWarehouse(id: string): Promise<WarehouseResponseDTO> {
    logger.info(WAREHOUSE_LOG.DEACTIVATING, { warehouseId: id });

    const warehouse = await WarehouseModel.findByIdAndUpdate(
      id,
      { status: "INACTIVE" },
      { new: true },
    );

    if (!warehouse) {
      throw new NotFoundError(WAREHOUSE_ERRORS.NOT_FOUND(id));
    }

    logger.info(WAREHOUSE_LOG.DEACTIVATED, { warehouseId: id });

    return toWarehouseResponseDTO(warehouse);
  }
}

export const warehouseService = new WarehouseService();
