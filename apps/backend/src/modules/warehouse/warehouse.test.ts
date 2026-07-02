import { describe, expect, it } from "vitest";
import { toWarehouseResponseDTO } from "./warehouse.types.js";

describe("toWarehouseResponseDTO", () => {
  it("maps a warehouse document to a response DTO", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const dto = toWarehouseResponseDTO({
      _id: { toString: () => "warehouse-123" },
      warehouseCode: "WH-BLR-001",
      name: "Bangalore Central Warehouse",
      address: {
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560001",
      },
      contactPerson: "Ravi Kumar",
      contactNumber: "+91-9876543210",
      storageCapacity: 10000,
      currentUtilization: 0,
      status: "ACTIVE",
      createdAt,
      updatedAt,
    });

    expect(dto).toEqual({
      id: "warehouse-123",
      warehouseCode: "WH-BLR-001",
      name: "Bangalore Central Warehouse",
      address: {
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560001",
      },
      contactPerson: "Ravi Kumar",
      contactNumber: "+91-9876543210",
      storageCapacity: 10000,
      currentUtilization: 0,
      status: "ACTIVE",
      createdAt,
      updatedAt,
    });
  });
});

describe("warehouse validation", () => {
  it.todo("rejects invalid create payload");
  it.todo("rejects duplicate warehouse code via service");
});
