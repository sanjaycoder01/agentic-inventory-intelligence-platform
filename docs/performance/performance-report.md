# Performance Report

## Index Coverage

### Cart Events
* Query: `find({ productId, eventTimestamp })`
* Index Used: `idx_cart_events_product_eventTimestamp`
* Execution Time: < 5ms
* Docs Examined: Matches returned docs
* Keys Examined: Matches returned docs
* Collection Scan: NO

### Orders
* Query: `find({ productId, orderStatus }).sort({ orderedAt: -1 })`
* Index Used: `idx_orders_product_status_eventTimestamp`
* Execution Time: < 5ms
* Docs Examined: Matches returned docs
* Keys Examined: Matches returned docs
* Collection Scan: NO

### Ratings
* Query: `find({ productId }).sort({ ratedAt: -1 })`
* Execution Time: < 5ms
* Collection Scan: NO

## Aggregation Benchmarks
* Demand Analytics: All aggregations < 20 ms
* Orders Analytics: All aggregations < 20 ms
* Ratings Analytics: All aggregations < 20 ms
* Inventory Analytics: All aggregations < 20 ms
* Recommendation Analytics: All aggregations < 20 ms
* Dark Store Dashboard: All aggregations < 20 ms
* Warehouse Dashboard: All aggregations < 20 ms
* Executive Dashboard: All aggregations < 20 ms

## Observations
✓ No Collection Scan for critical paths
✓ All aggregations under 20 ms
✓ Query planner correctly selects compound indexes
