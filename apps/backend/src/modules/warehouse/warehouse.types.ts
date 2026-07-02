import type { WarehouseDocument, WarehouseStatus } from "./warehouse.model.js";

export interface WarehouseAddressDTO {
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface WarehouseResponseDTO {
  id: string;
  warehouseCode: string;
  name: string;
  address: WarehouseAddressDTO;
  contactPerson: string;
  contactNumber: string;
  storageCapacity: number;
  currentUtilization: number;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

type WarehouseLike = WarehouseDocument & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export function toWarehouseResponseDTO(
  warehouse: WarehouseLike,
): WarehouseResponseDTO {
  return {
    id: warehouse._id.toString(),
    warehouseCode: warehouse.warehouseCode,
    name: warehouse.name,
    address: {
      city: warehouse.address.city,
      state: warehouse.address.state,
      country: warehouse.address.country,
      pincode: warehouse.address.pincode,
    },
    contactPerson: warehouse.contactPerson,
    contactNumber: warehouse.contactNumber,
    storageCapacity: warehouse.storageCapacity,
    currentUtilization: warehouse.currentUtilization,
    status: warehouse.status,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
  };
}

export function toWarehouseResponseList(
  warehouses: WarehouseLike[],
): WarehouseResponseDTO[] {
  return warehouses.map(toWarehouseResponseDTO);
}
