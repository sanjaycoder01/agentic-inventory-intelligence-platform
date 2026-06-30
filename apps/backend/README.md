# Backend

Single Node.js application — API, orchestration, and AI agents.

## Structure

```
src/
├── modules/
│   ├── inventory/        # Stock ledger, batches, FEFO logic
│   ├── demand/           # Cart events, orders, ratings, conversion
│   ├── intelligence/     # Scoring + eligibility engine
│   ├── warehouse/        # Main warehouse stock, fulfillment check
│   ├── purchase-orders/  # Admin approve/reject, PO lifecycle
│   ├── returns/          # Near-expiry / excess returns to warehouse
│   └── assistant/        # Claude-powered chat (read-only tools)
└── agents/
    ├── graph.ts          # LangGraph pipeline definition
    └── nodes/            # Agent workflow nodes
```

## Development

```bash
npm run dev --workspace=@aiip/backend
```
