import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "../../middleware/app-errors.js";
import { InventoryService } from "./inventory.service.js";

const DARK_STORE_ID = "507f1f77bcf86cd799439011";
const PRODUCT_ID = "507f1f77bcf86cd799439012";
const PRODUCT_ID_2 = "507f1f77bcf86cd799439013";

const mocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  darkStoreFindById: vi.fn(),
  productFindById: vi.fn(),
  policyFind: vi.fn(),
}));

vi.mock("../dark-store/dark-store-product.model.js", () => ({
  DarkStoreProductModel: {
    findOneAndUpdate: mocks.findOneAndUpdate,
    findOne: mocks.findOne,
    find: mocks.find,
  },
}));

vi.mock("../dark-store/dark-store.model.js", () => ({
  DarkStoreModel: {
    findById: mocks.darkStoreFindById,
  },
}));

vi.mock("../products/product.model.js", () => ({
  ProductModel: {
    findById: mocks.productFindById,
    find: vi.fn(),
  },
}));

vi.mock("./inventory-policy.model.js", () => ({
  InventoryPolicyModel: {
    find: mocks.policyFind,
  },
}));

vi.mock("./stock-ledger.service.js", () => ({
  stockLedgerService: {
    append: vi.fn().mockResolvedValue({}),
    listByProduct: vi.fn().mockResolvedValue([]),
  },
}));

function createInventoryDoc(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-07-02T00:00:00.000Z");

  return {
    _id: { toString: () => "inventory-1" },
    darkStoreId: { toString: () => DARK_STORE_ID },
    productId: { toString: () => PRODUCT_ID },
    availableQuantity: 100,
    reservedQuantity: 0,
    damagedQuantity: 0,
    averageRating: 0,
    totalRatings: 0,
    lastTransferredAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("InventoryService", () => {
  const service = new InventoryService();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.darkStoreFindById.mockResolvedValue({ _id: DARK_STORE_ID });
    mocks.productFindById.mockResolvedValue({ _id: PRODUCT_ID });
  });

  it("rejects non-positive quantities", async () => {
    await expect(service.reserveStock(DARK_STORE_ID, PRODUCT_ID, 0)).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.reserveStock(DARK_STORE_ID, PRODUCT_ID, -5)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("adds stock with upsert", async () => {
    const inventory = createInventoryDoc({ availableQuantity: 150 });
    mocks.findOneAndUpdate.mockResolvedValue(inventory);

    const result = await service.addStock(DARK_STORE_ID, PRODUCT_ID, 50);

    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { darkStoreId: DARK_STORE_ID, productId: PRODUCT_ID },
      expect.objectContaining({
        $inc: { availableQuantity: 50 },
      }),
      { upsert: true, new: true, runValidators: true },
    );
    expect(result.availableQuantity).toBe(150);
    expect(result.id).toBe("inventory-1");
  });

  it("reserves stock atomically", async () => {
    const inventory = createInventoryDoc({
      availableQuantity: 80,
      reservedQuantity: 20,
    });
    mocks.findOneAndUpdate.mockResolvedValue(inventory);

    const result = await service.reserveStock(DARK_STORE_ID, PRODUCT_ID, 20);

    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      {
        darkStoreId: DARK_STORE_ID,
        productId: PRODUCT_ID,
        availableQuantity: { $gte: 20 },
      },
      {
        $inc: {
          availableQuantity: -20,
          reservedQuantity: 20,
        },
      },
      { new: true, runValidators: true },
    );
    expect(result.reservedQuantity).toBe(20);
  });

  it("throws when reserving more than available stock", async () => {
    mocks.findOneAndUpdate.mockResolvedValue(null);
    mocks.findOne.mockResolvedValue(createInventoryDoc({ availableQuantity: 5 }));

    await expect(
      service.reserveStock(DARK_STORE_ID, PRODUCT_ID, 20),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("throws when inventory record does not exist", async () => {
    mocks.findOneAndUpdate.mockResolvedValue(null);
    mocks.findOne.mockResolvedValue(null);

    await expect(
      service.reserveStock(DARK_STORE_ID, PRODUCT_ID, 1),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deducts reserved stock after payment", async () => {
    const inventory = createInventoryDoc({
      availableQuantity: 80,
      reservedQuantity: 0,
    });
    mocks.findOneAndUpdate.mockResolvedValue(inventory);

    await service.deductStock(DARK_STORE_ID, PRODUCT_ID, 20);

    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      {
        darkStoreId: DARK_STORE_ID,
        productId: PRODUCT_ID,
        reservedQuantity: { $gte: 20 },
      },
      { $inc: { reservedQuantity: -20 } },
      { new: true, runValidators: true },
    );
  });

  it("returns low stock products using policy thresholds", async () => {
    const inventory = [
      createInventoryDoc({
        availableQuantity: 3,
        productId: { toString: () => PRODUCT_ID },
      }),
      createInventoryDoc({
        availableQuantity: 50,
        productId: { toString: () => PRODUCT_ID_2 },
      }),
    ];

    mocks.find.mockResolvedValue(inventory);
    mocks.policyFind.mockResolvedValue([
      {
        productId: { toString: () => PRODUCT_ID },
        minimumStockLevel: 10,
      },
      {
        productId: { toString: () => PRODUCT_ID_2 },
        minimumStockLevel: 20,
      },
    ]);

    const { ProductModel } = await import("../products/product.model.js");
    vi.mocked(ProductModel.find).mockResolvedValue([
      { _id: { toString: () => PRODUCT_ID }, safetyStock: 5 },
      { _id: { toString: () => PRODUCT_ID_2 }, safetyStock: 5 },
    ] as never);

    const result = await service.getLowStockProducts(DARK_STORE_ID);

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(PRODUCT_ID);
    expect(result[0].minimumStockLevel).toBe(10);
    expect(result[0].shortage).toBe(7);
  });
});
