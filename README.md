# Agentic Inventory Intelligence Platform

A modular platform for real-time inventory intelligence, demand scoring, and AI-driven replenishment decisions.

## Repository Structure

```
agentic-inventory-intelligence-platform/
├── apps/
│   ├── admin-dashboard/     # React dashboard (recommendations, approve/reject, score breakdown)
│   └── backend/             # Single Node.js app — API + orchestration + agents
│       └── src/
│           ├── modules/
│           │   ├── inventory/        # Stock ledger, batches, FEFO logic
│           │   ├── demand/           # Cart events, orders, ratings, conversion
│           │   ├── intelligence/     # Scoring + eligibility engine
│           │   ├── warehouse/        # Main warehouse stock, fulfillment check
│           │   ├── purchase-orders/  # Admin approve/reject, PO lifecycle
│           │   ├── returns/          # Near-expiry / excess returns
│           │   └── assistant/        # Claude-powered chat (read-only tools)
│           └── agents/
│               ├── graph.ts          # LangGraph pipeline definition
│               └── nodes/            # Agent workflow nodes
├── infrastructure/          # Docker, AWS, Terraform
├── docs/                    # Architecture, API specs, ADRs
└── scripts/                 # Seed data, DB reset, event generation
```

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB + backend
npm run dev

# Run tests (milk vs MacBook scoring cases)
npm run test --workspace=@aiip/backend

# Seed the database
npm run seed
```

## Backend Modules

| Module | Responsibility |
|--------|----------------|
| **inventory** | Stock ledger, batches, FEFO allocation |
| **demand** | Cart/order/rating events, conversion rate |
| **intelligence** | Demand/rating/conversion scoring, eligibility, recommendations |
| **warehouse** | Stock summary, fulfillment checks |
| **purchase-orders** | PO lifecycle, admin approve/reject |
| **returns** | Near-expiry and excess stock returns |
| **assistant** | Claude chat with read-only inventory tools |

## API Routes

| Prefix | Endpoints |
|--------|-----------|
| `/api/demand` | `POST /cart`, `POST /order`, `POST /rating` |
| `/api/inventory` | `GET /`, `GET /:productId` |
| `/api/v1/recommendations` | `GET /`, `POST /generate`, `GET /:id`, `POST /:id/approve`, `POST /:id/reject` |
| `/api/warehouse` | `GET /stock`, `GET /fulfillment/:productId` |
| `/api/purchase-orders` | `GET /`, `POST /`, `POST /:id/approve`, `POST /:id/reject` |
| `/api/assistant` | `POST /chat`, `GET /tools` |

## Continuous quick-commerce loop

```
Seed (once) → Cron A (1 min) → SQS → Consumer (batch 10) → Mongo signals
                              → Cron B (5 min)  → Replenishment recommendations → Approve → PO
                              → Cron C (15 min) → Sales strategies → Approve → Sales Action
```

```bash
# 1) One-time data
npm run reset-db && npm run seed

# 2) Backend — Cron B + Cron C + Claude explanations
npm run dev:backend

# 3) SQS consumer — batch receive (10) → cartEvents / orders / ratings
npm run queue:consumer

# 4) Cron A — simulate customer behaviour → publish to SQS every minute
npm run cron:simulator

# 5) Dashboard
npm run dev:dashboard
```

| Cron | Interval | Responsibility |
|------|----------|----------------|
| **A** | 1 min | Event simulator → AWS SQS FIFO |
| **B** | 5 min | Replenishment scoring from Mongo signals |
| **C** | 15 min | Sales optimization strategies |

Manual one-shot simulate (without Cron A): `npm run simulate -- HIGH_DEMAND 25`

Set `ANTHROPIC_API_KEY` in root `.env` for live Claude recommendation explanations.


## Documentation

See [`docs/`](docs/) for architecture diagrams, API specs, and architecture decision records.
See [`docs/phase2.md`](docs/phase2.md) for Phase 2 requirements.
