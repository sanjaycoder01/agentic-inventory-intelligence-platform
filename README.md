# Agentic Inventory Intelligence Platform

A microservices-based platform for real-time inventory intelligence, demand forecasting, and AI-driven replenishment decisions.

## Repository Structure

```
agentic-inventory-intelligence-platform/
├── apps/                    # User-facing applications
│   ├── admin-dashboard/     # React dashboard (inventory, POs, analytics, AI chat)
│   ├── api-gateway/         # Public API entry point
│   └── event-simulator/     # Synthetic cart, order, and inventory events
├── services/                # Business logic microservices
│   ├── inventory-service/
│   ├── demand-service/
│   ├── inventory-intelligence-service/  # Decision pipeline & AI recommendations
│   ├── warehouse-service/
│   ├── purchase-order-service/
│   ├── notification-service/
│   └── ai-agent-service/
├── packages/                # Shared libraries
│   ├── config/
│   ├── database/
│   ├── logger/
│   ├── shared/
│   └── types/
├── infrastructure/          # IaC (Docker, AWS, Terraform)
├── docs/                    # Architecture, API specs, ADRs
└── scripts/                 # Seed data, DB reset, event generation
```

## Quick Start

```bash
# Install dependencies
npm install

# Start local infrastructure (MongoDB)
npm run dev

# Seed the database
npm run seed
```

## Services Overview

| Service | Responsibility |
|---------|----------------|
| **inventory-service** | Stock levels, safety stock, available quantity |
| **demand-service** | Demand calculation, cart counts, demand scores |
| **inventory-intelligence-service** | Score calculation, replenishment decisions, AI recommendations |
| **warehouse-service** | Warehouse stock, transfers, availability |
| **purchase-order-service** | PO creation, approval, supplier orders |
| **notification-service** | Email, Slack, SMS, push notifications |
| **ai-agent-service** | LangGraph agent workflows, decision explanations |

## Documentation

See [`docs/`](docs/) for architecture diagrams, API specs, and architecture decision records.
