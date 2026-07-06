# Phase 7.1 MongoDB Query Analysis and Index Plan

This document records the MongoDB query shapes currently used by the backend.
Phase 7.1 is planning only: no new indexes are created here.

## Naming Notes

The implemented code uses these collection names as source of truth:

- `darkStoreProducts` for dark store inventory.
- `warehouseProducts` for warehouse inventory.
- `cartEvents` for demand events.
- `orders` for order/conversion data.
- `ratings` for customer ratings.
- `recommendations` for AI recommendations.
- `purchaseOrders` for replenishment purchase orders.
- `notifications` for workflow business events.

The roadmap names `darkStoreInventory` and `warehouseInventory` map to the
implemented `darkStoreProducts` and `warehouseProducts` collections.

## Index Plan Summary

| Collection | Primary Query Shape | Module(s) | Proposed Index | Status |
| --- | --- | --- | --- | --- |
| `darkStoreProducts` | `{ darkStoreId, productId }` | `inventory`, `orders` | `{ darkStoreId: 1, productId: 1 }` unique | Already exists |
| `darkStoreProducts` | `{ darkStoreId }` sorted/read by `productId` | `inventory` | Covered by `{ darkStoreId: 1, productId: 1 }` | Already exists |
| `darkStoreProducts` | `{ productId }` for rating aggregates | `ratings` | `{ productId: 1 }` or compound analytics index if explain shows need | Single-field exists |
| `warehouseProducts` | `{ productId, availableQuantity: { $gte } }` | `warehouse/allocation` | `{ productId: 1, availableQuantity: -1 }` | Candidate |
| `warehouseProducts` | `{ warehouseId, productId }` | Future inventory/dashboard | `{ warehouseId: 1, productId: 1 }` | Candidate; current `{ warehouseId, productId, batchNumber }` can partially cover |
| `cartEvents` | `{ productId, eventType, eventTimestamp: { $gte } }` | `demand`, `orders` | `{ productId: 1, eventType: 1, eventTimestamp: -1 }` | Candidate |
| `cartEvents` | `{ eventTimestamp: { $gte }, eventType: { $in } }` aggregate across products | `demand` | `{ eventType: 1, eventTimestamp: -1, productId: 1 }` | Candidate; validate with explain |
| `orders` | `{ productId, orderStatus: { $in }, orderedAt: { $gte } }` | `orders` | `{ productId: 1, orderStatus: 1, orderedAt: -1 }` | Candidate |
| `orders` | `{ orderStatus: { $in }, orderedAt: { $gte } }` aggregate across products | `orders` | `{ orderStatus: 1, orderedAt: -1, productId: 1 }` | Candidate |
| `ratings` | `{ productId }` sorted by `ratedAt` | `ratings` | `{ productId: 1, ratedAt: -1 }` | Already exists |
| `ratings` | `{ darkStoreId, productId }` sorted by `ratedAt` | Future dashboard/store analytics | `{ darkStoreId: 1, productId: 1, ratedAt: -1 }` | Already exists |
| `ratings` | `{ orderId }` duplicate-rating check | `ratings` | `{ orderId: 1 }` unique | Already exists |
| `recommendations` | `{ status }` sorted by `generatedAt` | `intelligence`, `workflow`, dashboard | `{ status: 1, generatedAt: -1 }` | Already exists |
| `recommendations` | `{ darkStoreId, status }` sorted by `generatedAt` | `intelligence`, `workflow`, dashboard, AI agent | `{ darkStoreId: 1, status: 1, generatedAt: -1 }` | Added |
| `recommendations` | `{ recommendationId }` | `intelligence`, `workflow` | `{ recommendationId: 1 }` unique | Already exists |
| `purchaseOrders` | `{ status }` sorted by `createdAt` | `purchase-orders`, dashboard, workflow | `{ status: 1, createdAt: -1 }` | Already exists |
| `purchaseOrders` | `{ warehouseId, status }` sorted by `createdAt` | `purchase-orders`, warehouse dashboard, approval queues | `{ warehouseId: 1, status: 1, createdAt: -1 }` | Added |
| `purchaseOrders` | `{ purchaseOrderId }` | `purchase-orders` | `{ purchaseOrderId: 1 }` unique | Already exists |
| `notifications` | `{ status }` sorted by `createdAt` ascending | `notifications`, future consumers | `{ status: 1, createdAt: 1 }` | Already exists |
| `notifications` | `{ eventType }` sorted by `createdAt` | Future dashboard/audit filters | `{ eventType: 1, createdAt: -1 }` | Already exists |
| `notifications` | `{ entityType, entityId }` sorted by `createdAt` | Future entity audit trail | `{ entityType: 1, entityId: 1, createdAt: -1 }` | Already exists |

## Collection Analysis

### `darkStoreProducts`

Primary queries:

- `DarkStoreProductModel.findOne({ darkStoreId, productId })`
- `DarkStoreProductModel.findOneAndUpdate({ darkStoreId, productId, availableQuantity: { $gte } })`
- `DarkStoreProductModel.findOneAndUpdate({ darkStoreId, productId, reservedQuantity: { $gte } })`
- `DarkStoreProductModel.find({ darkStoreId }).sort({ productId: 1 })`
- `DarkStoreProductModel.find({ darkStoreId })`
- `DarkStoreProductModel.findOne({ productId }).select("averageRating totalRatings")`
- `DarkStoreProductModel.updateMany({ productId })`
- `DarkStoreProductModel.aggregate([{ $match: { totalRatings: { $gt: 0 } } }, ...])`

Why they exist:

- Inventory writes and validation must locate a specific product at a specific
  dark store.
- Order creation validates and deducts dark store stock.
- Recommendation signal gathering depends on available/reserved quantities.
- Rating score reads cached aggregate rating fields from dark store products.
- Dashboard analytics need low-stock and top-rated product lists.

Modules:

- `apps/backend/src/modules/inventory/inventory.service.ts`
- `apps/backend/src/modules/orders/order.service.ts`
- `apps/backend/src/modules/ratings/rating.service.ts`

Proposed index:

- Keep `{ darkStoreId: 1, productId: 1 }` unique. It already exists and covers
  the most important point reads, writes, and `darkStoreId` inventory scans.
- Keep the existing single-field `productId` index for rating aggregate reads
  and updates.
- Do not add a low-stock/top-rated index yet. Those are aggregation/reporting
  paths and should be tested with explain plans before adding more write cost.

### `warehouseProducts`

Primary queries:

- `WarehouseProductModel.find({ productId, availableQuantity: { $gte: quantity } }).lean()`

Why they exist:

- Warehouse allocation finds candidate warehouses that can fulfill a reorder
  quantity, then ranks candidates in application code by distance and stock.

Modules:

- `apps/backend/src/modules/warehouse/allocation.service.ts`

Proposed index:

- Add `{ productId: 1, availableQuantity: -1 }` in Phase 7.2. The equality
  predicate on `productId` should come first, followed by the range predicate on
  `availableQuantity`.
- Consider `{ warehouseId: 1, productId: 1 }` for future dashboard or direct
  warehouse inventory lookups. The current `{ warehouseId: 1, productId: 1,
  batchNumber: 1 }` partially covers this shape, but it is not unique and is
  batch-aware.

### `cartEvents`

Primary queries:

- Aggregation `$match`: `{ productId, eventType: "ADD_TO_CART", eventTimestamp: { $gte: since } }`
- Aggregation `$match`: `{ productId, eventType: "REMOVE_FROM_CART", eventTimestamp: { $gte: since } }`
- Aggregation `$match`: `{ eventTimestamp: { $gte: since }, eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] } }`

Why they exist:

- Demand score uses per-product add/remove cart counts over the demand window.
- Trending products aggregates cart counts across all products in the same
  window.
- Conversion score reuses cart count as the denominator.

Modules:

- `apps/backend/src/modules/demand/demand.service.ts`
- `apps/backend/src/modules/orders/order.service.ts`

Proposed index:

- Add `{ productId: 1, eventType: 1, eventTimestamp: -1 }` for per-product
  demand and conversion-score queries.
- Evaluate `{ eventType: 1, eventTimestamp: -1, productId: 1 }` for trending
  aggregation. It may outperform the per-product index for cross-product time
  window scans, but explain plans should decide whether the extra write cost is
  justified.

### `orders`

Primary queries:

- `OrderModel.countDocuments({ productId, orderStatus: { $in: COMPLETED_ORDER_STATUSES }, orderedAt: { $gte: since } })`
- `OrderModel.find({ productId, orderStatus: { $in: COMPLETED_ORDER_STATUSES }, orderedAt: { $gte: since } }).sort({ orderedAt: -1 })`
- Aggregation `$match`: `{ orderStatus: { $in: COMPLETED_ORDER_STATUSES }, orderedAt: { $gte: since } }`

Why they exist:

- Conversion score counts completed orders within the order window.
- Product order analytics lists recent completed orders.
- Top-selling products aggregates completed orders across products.

Modules:

- `apps/backend/src/modules/orders/order.service.ts`

Proposed index:

- Add `{ productId: 1, orderStatus: 1, orderedAt: -1 }` for product analytics,
  counts, and sorted recent order reads.
- Add `{ orderStatus: 1, orderedAt: -1, productId: 1 }` only if explain plans
  show top-selling aggregation scanning too much data with existing indexes.

### `ratings`

Primary queries:

- `RatingModel.findOne({ orderId })`
- `RatingModel.find({ productId }).sort({ ratedAt: -1 })`
- Aggregation `$match`: `{ productId }`

Why they exist:

- Duplicate rating prevention uses `orderId`.
- Product ratings list uses `productId` and latest-first sorting.
- Rating aggregate recalculation groups all ratings for a product.

Modules:

- `apps/backend/src/modules/ratings/rating.service.ts`

Proposed index:

- Keep `{ orderId: 1 }` unique. It already exists.
- Keep `{ productId: 1, ratedAt: -1 }`. It already exists and supports the
  product ratings list plus product aggregate `$match`.
- Keep `{ darkStoreId: 1, productId: 1, ratedAt: -1 }`. It already exists for
  store/product rating analytics.

### `recommendations`

Primary queries:

- `RecommendationModel.findOne({ recommendationId })`
- `RecommendationModel.find({ status: "PENDING" }).sort({ generatedAt: -1 })`
- `RecommendationModel.find({ darkStoreId, status: "PENDING" }).sort({ generatedAt: -1 })`
- `RecommendationModel.findOneAndUpdate({ recommendationId }, update)`

Why they exist:

- Workflow loads and approves/rejects specific recommendations.
- Dashboard and workflow need pending recommendations newest-first.

Modules:

- `apps/backend/src/modules/intelligence/recommendation-persistence.service.ts`
- `apps/backend/src/modules/workflow/workflow.service.ts`

Proposed index:

- Keep `{ recommendationId: 1 }` unique. It already exists.
- Keep `{ status: 1, generatedAt: -1 }`. It already exists and matches pending
  recommendation reads across all dark stores.
- Add `{ darkStoreId: 1, status: 1, generatedAt: -1 }` named
  `idx_recommendations_darkStore_status_generatedAt`. It supports pending
  approvals per dark store for dashboard, manager UI, workflow, and AI agent
  queries without scanning extra documents.

### `purchaseOrders`

Primary queries:

- `PurchaseOrderModel.findOne({ purchaseOrderId })`
- `PurchaseOrderModel.find({ status }).sort({ createdAt: -1 })`
- `PurchaseOrderModel.find({ warehouseId, status: "DRAFT" }).sort({ createdAt: -1 })`
- `PurchaseOrderModel.find(filter).sort({ createdAt: -1 })`

Why they exist:

- Workflow creates purchase orders and can fetch them by business id.
- Dashboard lists purchase orders by status, newest-first.

Modules:

- `apps/backend/src/modules/purchase-orders/purchase-order.service.ts`
- `apps/backend/src/modules/purchase-orders/po.service.ts`
- `apps/backend/src/modules/workflow/workflow.service.ts`

Proposed index:

- Keep `{ purchaseOrderId: 1 }` unique. It already exists.
- Keep `{ status: 1, createdAt: -1 }`. It already exists and matches the
  dashboard/workflow status list query across all warehouses.
- Keep `{ warehouseId: 1, darkStoreId: 1, createdAt: -1 }`. It already exists
  for regional warehouse/dark store reporting.
- Add `{ warehouseId: 1, status: 1, createdAt: -1 }` named
  `idx_po_warehouse_status_createdAt`. It supports draft and approval queues
  scoped to a warehouse without scanning extra documents.

### `notifications`

Primary queries:

- `NotificationModel.find({ status: "PENDING" }).sort({ createdAt: 1 })`

Why they exist:

- Notification service stores workflow business events as an event log.
- Future consumers need to pull pending notifications oldest-first.

Modules:

- `apps/backend/src/modules/notifications/notification.service.ts`
- `apps/backend/src/modules/workflow/workflow.service.ts`

Proposed index:

- Keep `{ status: 1, createdAt: 1 }`. It already exists and matches pending
  notification reads.
- Keep existing event-log helper indexes `{ eventType: 1, createdAt: -1 }` and
  `{ entityType: 1, entityId: 1, createdAt: -1 }` for future dashboard/audit
  filters.

## Phase 7.2 Candidate Changes

Based on current query usage, Phase 7.2 should focus on only these new index
candidates:

1. `warehouseProducts`: `{ productId: 1, availableQuantity: -1 }`
2. `cartEvents`: `{ productId: 1, eventType: 1, eventTimestamp: -1 }`
3. `orders`: `{ productId: 1, orderStatus: 1, orderedAt: -1 }`

Indexes to validate with explain plans before implementing:

1. `cartEvents`: `{ eventType: 1, eventTimestamp: -1, productId: 1 }`
2. `orders`: `{ orderStatus: 1, orderedAt: -1, productId: 1 }`

Indexes already present and aligned with current query shapes should not be
duplicated.
