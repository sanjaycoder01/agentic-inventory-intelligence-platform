#!/usr/bin/env node
/**
 * Seed MongoDB with PRD demo data for the full intelligence flow:
 * - Catalog + warehouse + dark store inventory
 * - Signal data (cartEvents, orders) for replenishment scoring
 * - Milk → eligible REORDER; MacBook → blocked (high demand, low rating/conversion)
 * - Extra products for sales-optimization strategies (clearance, ads, etc.)
 *
 * Usage: npm run seed
 * Tip: npm run reset-db && npm run seed for a clean slate
 */
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_intelligence";

/** Stable ObjectIds so local runs and docs stay reproducible */
const IDS = {
  warehouse: new mongoose.Types.ObjectId("666100000000000000000001"),
  darkStore: new mongoose.Types.ObjectId("666100000000000000000002"),
  products: {
    milk: new mongoose.Types.ObjectId("666100000000000000000011"),
    macbook: new mongoose.Types.ObjectId("666100000000000000000012"),
    bread: new mongoose.Types.ObjectId("666100000000000000000013"),
    staleSnacks: new mongoose.Types.ObjectId("666100000000000000000014"),
    premiumOil: new mongoose.Types.ObjectId("666100000000000000000015"),
  },
};

const SEED_COLLECTIONS = [
  "products",
  "warehouses",
  "darkStores",
  "warehouseProducts",
  "darkStoreProducts",
  "inventories",
  "inventoryPolicies",
  "cartEvents",
  "orders",
  "ratings",
];

const now = new Date();

function hoursAgo(hours) {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);
  return date;
}

function daysAgo(days) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function buildCartEvents(productId, darkStoreId, count, startHoursAgo, endHoursAgo) {
  const events = [];
  for (let i = 0; i < count; i += 1) {
    const span = startHoursAgo - endHoursAgo;
    const offset = span <= 0 ? startHoursAgo : startHoursAgo - (i / Math.max(count - 1, 1)) * span;
    events.push({
      eventId: `seed-cart-${productId.toString()}-${i}`,
      productId,
      darkStoreId,
      quantity: 1,
      eventType: "ADD_TO_CART",
      eventTimestamp: hoursAgo(offset),
      sessionId: `seed-session-${productId.toString()}-${i % 12}`,
      createdAt: hoursAgo(offset),
    });
  }
  return events;
}

function buildOrders(productId, darkStoreId, count, sellingPrice, startHoursAgo, endHoursAgo) {
  const orders = [];
  for (let i = 0; i < count; i += 1) {
    const span = startHoursAgo - endHoursAgo;
    const offset = span <= 0 ? startHoursAgo : startHoursAgo - (i / Math.max(count - 1, 1)) * span;
    const orderedAt = hoursAgo(offset);
    orders.push({
      orderId: `seed-order-${productId.toString()}-${i}`,
      productId,
      darkStoreId,
      quantity: 1,
      sellingPrice,
      orderStatus: "DELIVERED",
      orderedAt,
      deliveredAt: orderedAt,
      sessionId: `seed-session-${productId.toString()}-${i % 12}`,
      createdAt: orderedAt,
    });
  }
  return orders;
}

function buildRatings(orders, productId, darkStoreId, ratingValue) {
  return orders.map((order, index) => ({
    ratingId: `seed-rating-${productId.toString()}-${index}`,
    productId,
    darkStoreId,
    orderId: order._id,
    rating: ratingValue,
    review:
      ratingValue >= 4
        ? "Great product, will buy again."
        : "Not as expected — quality issues.",
    ratedAt: order.deliveredAt,
    createdAt: order.deliveredAt,
  }));
}

async function clearSeedCollections(db) {
  for (const name of SEED_COLLECTIONS) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) {
      await db.collection(name).deleteMany({});
    }
  }
}

async function main() {
  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  console.log("Clearing seed collections...");
  await clearSeedCollections(db);

  const warehouse = {
    _id: IDS.warehouse,
    warehouseCode: "WH-BLR-01",
    name: "Bangalore Central Warehouse",
    address: {
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
    },
    contactPerson: "Ravi Kumar",
    contactNumber: "+91-9876543210",
    storageCapacity: 50000,
    currentUtilization: 12000,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const darkStore = {
    _id: IDS.darkStore,
    darkStoreCode: "DS-BLR-WF-01",
    name: "Whitefield Dark Store",
    address: {
      city: "Bangalore",
      area: "Whitefield",
      state: "Karnataka",
      country: "India",
      pincode: "560066",
    },
    warehouseId: IDS.warehouse,
    managerName: "Priya Sharma",
    contactNumber: "+91-9876501234",
    serviceRadiusKm: 5,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const products = [
    {
      _id: IDS.products.milk,
      sku: "MILK-AMUL-1L",
      name: "Amul Milk",
      category: "Dairy",
      brand: "Amul",
      unit: "1L",
      sellingPrice: 62,
      reorderThreshold: 15,
      safetyStock: 10,
      shelfLifeDays: 7,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: IDS.products.macbook,
      sku: "ELEC-MBP-14",
      name: "MacBook Pro 14",
      category: "Electronics",
      brand: "Apple",
      unit: "piece",
      sellingPrice: 189900,
      reorderThreshold: 3,
      safetyStock: 2,
      shelfLifeDays: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: IDS.products.bread,
      sku: "BAKERY-WW-400G",
      name: "Whole Wheat Bread",
      category: "Bakery",
      brand: "Harvest Gold",
      unit: "400g",
      sellingPrice: 45,
      reorderThreshold: 20,
      safetyStock: 15,
      shelfLifeDays: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: IDS.products.staleSnacks,
      sku: "SNACK-CHIPS-150G",
      name: "Classic Salted Chips",
      category: "Snacks",
      brand: "CrunchCo",
      unit: "150g",
      sellingPrice: 35,
      reorderThreshold: 10,
      safetyStock: 5,
      shelfLifeDays: 180,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: IDS.products.premiumOil,
      sku: "GROC-OLIVE-500ML",
      name: "Premium Olive Oil",
      category: "Grocery",
      brand: "Oliva",
      unit: "500ml",
      sellingPrice: 499,
      reorderThreshold: 8,
      safetyStock: 5,
      shelfLifeDays: 365,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const warehouseProducts = [
    {
      warehouseId: IDS.warehouse,
      productId: IDS.products.milk,
      availableQuantity: 500,
      reservedQuantity: 0,
      damagedQuantity: 0,
      reorderLevel: 100,
      batchNumber: "MILK-BATCH-01",
      manufacturingDate: daysAgo(2),
      expiryDate: daysAgo(-5),
      lastRestockedAt: daysAgo(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      warehouseId: IDS.warehouse,
      productId: IDS.products.macbook,
      availableQuantity: 50,
      reservedQuantity: 0,
      damagedQuantity: 0,
      reorderLevel: 5,
      batchNumber: "MBP-BATCH-01",
      lastRestockedAt: daysAgo(7),
      createdAt: now,
      updatedAt: now,
    },
    {
      warehouseId: IDS.warehouse,
      productId: IDS.products.bread,
      availableQuantity: 200,
      reservedQuantity: 0,
      damagedQuantity: 0,
      reorderLevel: 40,
      batchNumber: "BREAD-BATCH-01",
      manufacturingDate: daysAgo(1),
      expiryDate: daysAgo(-2),
      lastRestockedAt: daysAgo(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      warehouseId: IDS.warehouse,
      productId: IDS.products.staleSnacks,
      availableQuantity: 300,
      reservedQuantity: 0,
      damagedQuantity: 0,
      reorderLevel: 30,
      batchNumber: "CHIPS-BATCH-OLD",
      manufacturingDate: daysAgo(150),
      expiryDate: daysAgo(-30),
      lastRestockedAt: daysAgo(120),
      createdAt: now,
      updatedAt: now,
    },
    {
      warehouseId: IDS.warehouse,
      productId: IDS.products.premiumOil,
      availableQuantity: 150,
      reservedQuantity: 0,
      damagedQuantity: 0,
      reorderLevel: 20,
      batchNumber: "OIL-BATCH-01",
      lastRestockedAt: daysAgo(14),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const darkStoreProducts = [
    {
      darkStoreId: IDS.darkStore,
      productId: IDS.products.milk,
      // Start with enough stock for Cron A continuous orders; replenishment
      // still fires once availableQuantity drops to ≤20 (MAX_AVAILABLE_STOCK).
      availableQuantity: 50,
      reservedQuantity: 0,
      damagedQuantity: 0,
      averageRating: 4.2,
      totalRatings: 20,
      lastTransferredAt: daysAgo(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      darkStoreId: IDS.darkStore,
      productId: IDS.products.macbook,
      availableQuantity: 5,
      reservedQuantity: 0,
      damagedQuantity: 0,
      averageRating: 1.5,
      totalRatings: 10,
      lastTransferredAt: daysAgo(3),
      createdAt: now,
      updatedAt: now,
    },
    {
      darkStoreId: IDS.darkStore,
      productId: IDS.products.bread,
      availableQuantity: 35,
      reservedQuantity: 0,
      damagedQuantity: 0,
      averageRating: 4.5,
      totalRatings: 40,
      lastTransferredAt: daysAgo(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      darkStoreId: IDS.darkStore,
      productId: IDS.products.staleSnacks,
      availableQuantity: 80,
      reservedQuantity: 0,
      damagedQuantity: 0,
      averageRating: 3.2,
      totalRatings: 8,
      lastTransferredAt: daysAgo(125),
      createdAt: daysAgo(125),
      updatedAt: now,
    },
    {
      darkStoreId: IDS.darkStore,
      productId: IDS.products.premiumOil,
      availableQuantity: 65,
      reservedQuantity: 0,
      damagedQuantity: 0,
      averageRating: 4.0,
      totalRatings: 12,
      lastTransferredAt: daysAgo(10),
      createdAt: daysAgo(20),
      updatedAt: now,
    },
  ];

  /** Legacy warehouse stock used by warehouseFulfillmentService.getStockSummary() */
  const legacyInventories = products.map((product) => {
    const warehouseRow = warehouseProducts.find(
      (row) => row.productId.toString() === product._id.toString(),
    );
    return {
      productId: product._id,
      darkStoreId: IDS.darkStore,
      productName: product.name,
      category: product.category,
      safetyStock: product.safetyStock,
      availableQuantity: warehouseRow?.availableQuantity ?? 0,
      batches: [
        {
          productId: product._id.toString(),
          quantity: warehouseRow?.availableQuantity ?? 0,
          receivedAt: daysAgo(7),
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  });

  const inventoryPolicies = products.map((product) => ({
    locationType: "DARK_STORE",
    locationId: IDS.darkStore,
    productId: product._id,
    minimumStockLevel: product.reorderThreshold,
    maximumStockLevel: product.reorderThreshold * 5,
    reorderQuantity: product.safetyStock * 3,
    safetyStock: product.safetyStock,
    isAutoReorderEnabled: false,
    createdAt: now,
    updatedAt: now,
  }));

  /** 24h replenishment window — milk highest demand, MacBook window-shopping pattern */
  const cartEvents = [
    ...buildCartEvents(IDS.products.milk, IDS.darkStore, 36, 23, 1),
    ...buildCartEvents(IDS.products.macbook, IDS.darkStore, 30, 23, 1),
    ...buildCartEvents(IDS.products.bread, IDS.darkStore, 12, 23, 2),
    ...buildCartEvents(IDS.products.staleSnacks, IDS.darkStore, 4, 23, 4),
    ...buildCartEvents(IDS.products.premiumOil, IDS.darkStore, 25, 23, 1),
  ];

  const orders24h = [
    ...buildOrders(IDS.products.milk, IDS.darkStore, 26, 62, 22, 1),
    ...buildOrders(IDS.products.macbook, IDS.darkStore, 6, 189900, 22, 2),
    ...buildOrders(IDS.products.bread, IDS.darkStore, 8, 45, 22, 2),
    ...buildOrders(IDS.products.staleSnacks, IDS.darkStore, 1, 35, 20, 10),
    ...buildOrders(IDS.products.premiumOil, IDS.darkStore, 4, 499, 22, 3),
  ];

  /** 30d sales-opt window — aged dead stock + oil ad candidate */
  const orders30d = [
    ...buildOrders(IDS.products.staleSnacks, IDS.darkStore, 3, 35, 24 * 20, 24 * 2),
    ...buildOrders(IDS.products.premiumOil, IDS.darkStore, 6, 499, 24 * 25, 24 * 3),
    ...buildOrders(IDS.products.bread, IDS.darkStore, 15, 45, 24 * 14, 24 * 2),
  ];

  const cartEvents30d = [
    ...buildCartEvents(IDS.products.premiumOil, IDS.darkStore, 40, 24 * 28, 24 * 2),
    ...buildCartEvents(IDS.products.staleSnacks, IDS.darkStore, 8, 24 * 25, 24 * 5),
  ];

  const allOrders = [...orders24h, ...orders30d];
  const ordersWithIds = allOrders.map((order) => ({
    ...order,
    _id: new mongoose.Types.ObjectId(),
  }));

  const dedupedOrders = [];
  const seenOrderIds = new Set();
  for (const order of ordersWithIds) {
    if (seenOrderIds.has(order.orderId)) continue;
    seenOrderIds.add(order.orderId);
    dedupedOrders.push(order);
  }

  const milkOrders = dedupedOrders.filter(
    (o) => o.productId.toString() === IDS.products.milk.toString(),
  );
  const macbookOrders = dedupedOrders.filter(
    (o) => o.productId.toString() === IDS.products.macbook.toString(),
  );

  const ratings = [
    ...buildRatings(milkOrders.slice(0, 10), IDS.products.milk, IDS.darkStore, 5),
    ...buildRatings(milkOrders.slice(10, 20), IDS.products.milk, IDS.darkStore, 4),
    ...buildRatings(macbookOrders, IDS.products.macbook, IDS.darkStore, 1),
  ];

  console.log("Inserting seed documents...");
  await db.collection("warehouses").insertOne(warehouse);
  await db.collection("darkStores").insertOne(darkStore);
  await db.collection("products").insertMany(products);
  await db.collection("warehouseProducts").insertMany(warehouseProducts);
  await db.collection("darkStoreProducts").insertMany(darkStoreProducts);
  await db.collection("inventories").insertMany(legacyInventories);
  await db.collection("inventoryPolicies").insertMany(inventoryPolicies);
  await db.collection("cartEvents").insertMany([...cartEvents, ...cartEvents30d]);
  await db.collection("orders").insertMany(dedupedOrders);
  await db.collection("ratings").insertMany(ratings);

  console.log("\nSeed complete.\n");
  console.log("Dark store:", darkStore.name, `(${IDS.darkStore.toString()})`);
  console.log("Products:");
  for (const product of products) {
    console.log(`  - ${product.name}: ${product._id.toString()}`);
  }
  console.log("\nExpected replenishment outcomes (POST /api/v1/recommendations/generate):");
  console.log("  Amul Milk      → REORDER once stock ≤20 (starts at 50 for continuous Cron A)");
  console.log("  MacBook Pro 14 → HOLD     (score below 0.6 — high carts, low rating/conversion)");
  console.log("  Whole Wheat Bread → skip   (inventory not low)");
  console.log("\nExpected sales optimization (POST /api/v1/sales-optimization/generate):");
  console.log("  Classic Salted Chips → CLEARANCE / LIQUIDATE (aged, low sell-through)");
  console.log("  Premium Olive Oil    → RUN_ADS (high inventory, low conversion)");
  console.log("  MacBook Pro 14       → QUALITY_CHECK / PRICE_REVIEW");
  console.log("\nContinuous mode:");
  console.log("  npm run dev:backend");
  console.log("  npm run queue:consumer");
  console.log("  npm run cron:simulator");
  console.log("  npm run dev:dashboard");
  console.log("\nOr one-shot pipelines:");
  console.log("  curl -X POST http://localhost:3000/api/v1/recommendations/generate");
  console.log("  curl -X POST http://localhost:3000/api/v1/sales-optimization/generate");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("seed-data failed:", error.message);
  process.exit(1);
});
