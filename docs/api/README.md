# API Documentation

REST API served by `apps/backend`.

## Public Endpoints

### Demand (`/api/demand`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cart` | Record a cart event |
| POST | `/order` | Record an order event |
| POST | `/rating` | Record a product rating |

### Intelligence (`/api/intelligence`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recommendations` | List all product recommendations |
| GET | `/recommendations/:productId` | Score breakdown + eligibility for one product |

### Purchase Orders (`/api/purchase-orders`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List POs (optional `?status=pending`) |
| POST | `/` | Create a purchase order |
| POST | `/:id/approve` | Approve a PO |
| POST | `/:id/reject` | Reject a PO |

### Assistant (`/api/assistant`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Chat with the inventory assistant |
| GET | `/tools` | List available read-only tools |
