# Phase 1 Architecture — Replenishment Intelligence

This document describes the **Phase 1** architecture of the Agentic Inventory Intelligence Platform: how operational signals become explainable reorder recommendations, and how admins approve purchase orders. It also shows where **Phase 2 (Sales Optimization)** plugs in without changing Phase 1’s core loops.

---

## 1. System context

```mermaid
flowchart TB
  subgraph Actors
    Admin[Dark store admin]
    Dev[Developer / demo operator]
  end

  subgraph Platform["Inventory Intelligence Platform"]
    Dashboard[Admin dashboard<br/>React + Tailwind]
    Backend[Backend API<br/>Node.js / Express]
    Simulator[Event simulator]
  end

  subgraph DataAndMsg
    Mongo[(MongoDB)]
    SQS[AWS SQS FIFO]
  end

  subgraph External
    Claude[Anthropic Claude API<br/>explanations + assistant only]
  end

  Admin --> Dashboard
  Dashboard --> Backend
  Dev --> Simulator
  Simulator --> SQS
  SQS --> Simulator
  Simulator -->|consumer → HTTP| Backend
  Backend --> Mongo
  Backend --> Claude
```

**Boundaries**

| Concern | Phase 1 | Phase 2 |
|--------|---------|---------|
| Primary question | Should we reorder from the warehouse? | This isn’t selling — what strategy? |
| Decision math | Deterministic scoring + rules | Deterministic sell-through / strategy table |
| LLM role | Explain decisions + read-only chat | Explain strategy recommendations the same way |
| Scope | Single dark store ↔ one main warehouse | Same store; no multi-store transfers yet |

---

## 2. High-level Phase 1 architecture

```mermaid
flowchart LR
  subgraph P1["Pipeline 1 — Customer activity"]
    Sim[Event simulator]
    Q[SQS]
  end

  subgraph P2["Pipeline 2 — Event ingestion"]
    Cons[SQS consumer]
    API[Backend signal APIs]
    Ev[(cartEvents / orders / ratings)]
  end

  subgraph P3["Pipeline 3 — Intelligence"]
    Cron[Cron B / POST generate]
    Eng[Recommendation pipeline]
    Rec[(recommendations)]
    Dec[Admin dashboard]
    WF[Approve → workflow]
    PO[(purchaseOrders)]
  end

  Sim --> Q --> Cons --> API --> Ev
  Ev --> Cron --> Eng --> Rec --> Dash
  Dash -->|approve| WF --> PO
```

These three pipelines are **independent**:

1. **Simulator** creates synthetic demand (no real customers).
2. **Ingestion** persists append-friendly signal history.
3. **Intelligence** reads Mongo signals on a schedule (or manually), scores products, and surfaces actions — **it does not consume SQS**.

---

## 3. Pipeline 1 — Event generation (simulator)

```mermaid
sequenceDiagram
  participant Op as Operator
  participant Sim as Event simulator
  participant SQS as SQS FIFO
  participant Cons as Consumer
  participant API as Backend APIs

  Op->>Sim: npm run simulate
  loop Customers / scenarios
    Sim->>Sim: Cart → Order → Rating events
    Sim->>SQS: Publish messages
  end
  Cons->>SQS: Receive
  Cons->>API: POST cart / order / rating
  API-->>Cons: 2xx → delete message
```

**Notes**

- Scenarios (e.g. high demand, poor rating / MacBook pattern) live in `event-simulator/`.
- **Cron A** (`npm run cron:simulator`, every 1 minute) continuously publishes synthetic customer events to SQS. The consumer must run in parallel (`npm run queue:consumer`, batch size 10).
- Message grouping by product supports per-product ordering when used for scoring jobs later; today SQS primarily carries **ingestion** events.

---

## 4. Pipeline 2 — Event ingestion

```mermaid
flowchart TD
  SQS[SQS message] --> Cons[SqsConsumer]
  Cons --> Disp[EventDispatcher]
  Disp --> Cart[POST /api/v1/cart-events]
  Disp --> Ord[POST /api/v1/orders]
  Disp --> Rat[POST /api/v1/ratings]
  Cart --> CE[(cartEvents)]
  Ord --> OD[(orders)]
  Rat --> RT[(ratings)]
```

After this stage, Mongo holds **historical signals only**. No recommendations are created here.

---

## 5. Pipeline 3 — Replenishment intelligence (Phase 1 core)

```mermaid
flowchart TD
  Trigger[Cron B every 5 min<br/>or POST /recommendations/generate] --> Agg[Aggregate signals]
  Agg --> Score[Demand / rating / conversion<br/>→ replenishment score]
  Score --> Gate{Score ≥ threshold<br/>+ low stock<br/>+ warehouse stock?}
  Gate -->|No| Ne[Not eligible / DO_NOT_REORDER<br/>reason logged]
  Gate -->|Yes| Qty[Recommended qty<br/>demand × lead time × buffer]
  Qty --> WH{Warehouse can fulfill qty?}
  WH -->|No| Bl[Status BLOCKED]
  WH -->|Yes| Rec[Status PENDING · REORDER]
  Ne --> Expl[Claude explanation<br/>or template fallback]
  Bl --> Expl
  Rec --> Expl
  Expl --> Persist[(recommendations)]
  Persist --> Audit[(agentDecisions)]
  Persist --> UI[Dashboard]
  UI -->|Approve eligible only| WF[Workflow]
  WF --> Alloc[Warehouse allocation]
  Alloc --> PO[(purchaseOrders)]
  Alloc --> Notif[Notifications]
  UI -->|Reject| End[No PO]
```

### Deterministic scoring (LLM never computes numbers)

```
demand_score       ← cart-add volume (normalized 0–1)
conversion_score   ← purchases ÷ cart adds
rating_score       ← avg rating / 5

replenishment_score = 0.4·demand + 0.3·rating + 0.3·conversion
                      (weights sum to 1.0)

eligible if score ≥ THRESHOLD (0.6)
         and store stock is low
         and warehouse has stock
```

### Orchestration modules

| Step | Module |
|------|--------|
| Aggregate | `signal-aggregator.service` |
| Gate | `eligibility.service` |
| Rules | `recommendation.rules` / `recommendation.service` |
| Qty | `calculateReorderQuantity` in `scoring.ts` |
| Explain | `explanation.service` → Claude + templates |
| Persist | `recommendation-persistence.service` |
| Audit | `agent-decision.service` |
| Schedule | `recommendation.scheduler` (Cron B) |
| Approve path | `workflow.service` → allocation → PO |

---

## 6. Runtime component view

```mermaid
flowchart TB
  subgraph apps
    Dash[apps/admin-dashboard]
    BE[apps/backend]
    ES[event-simulator]
  end

  subgraph BE_mods["Backend modules"]
    Demand[demand / orders / ratings]
    Inv[inventory + stockLedger]
    Intel[intelligence pipeline]
    WH[warehouse]
    PO[purchase-orders]
    Ret[returns]
    Asst[assistant]
    AI[ai / Claude client]
    WF[workflow]
    Notif[notifications]
    An[analytics]
  end

  Dash --> BE
  ES --> SQS[(SQS)]
  ES --> BE
  BE --> BE_mods
  BE_mods --> Mongo[(MongoDB)]
  AI --> Claude[Claude API]
```

---

## 7. Data stores (Phase 1)

```mermaid
erDiagram
  products ||--o{ cartEvents : signals
  products ||--o{ orders : signals
  products ||--o{ ratings : signals
  products ||--o{ recommendations : scored
  products ||--o{ stockLedger : movements
  products ||--o{ returnOrders : returns
  darkStores ||--o{ darkStoreProducts : inventory
  warehouses ||--o{ warehouseProducts : stock
  recommendations ||--o| purchaseOrders : approved
  products ||--o{ agentDecisions : audit

  products {
    string sku
    number reorderThreshold
    number safetyStock
  }
  recommendations {
    string status
    number overallScore
    number recommendedQuantity
    string summary
  }
  stockLedger {
    number change
    string reason
    number balanceAfter
  }
  agentDecisions {
    string nodeName
    string runId
    object inputSummary
    object outputSummary
  }
```

**Primary collections**

| Collection | Role |
|------------|------|
| `cartEvents`, `orders`, `ratings` | Customer signals |
| `darkStoreProducts`, `warehouseProducts` | Current stock state |
| `stockLedger` | Append-only inventory history |
| `recommendations` | Actionable / blocked / historical decisions |
| `agentDecisions` | Per-node pipeline audit |
| `purchaseOrders` | Admin-executed replenishment |
| `returnOrders` | Near-expiry / excess return-to-warehouse |
| `notifications` | Workflow events |

---

## 8. Admin & assistant surfaces

```mermaid
flowchart LR
  Admin --> RecUI[Recommendations<br/>generate / approve / reject]
  Admin --> POUI[Purchase orders]
  Admin --> InvUI[Inventory]
  Admin --> Chat[AI assistant<br/>read-only tools]
  RecUI --> API[/api/v1/recommendations]
  Chat --> Asst[/api/v1/assistant/chat]
  Asst --> Tools[Tools: recommendations,<br/>inventory, ledger, decisions, POs]
  Tools --> Mongo[(MongoDB)]
```

- Assistant is **read-only** — cannot create POs or mutate inventory.
- Claude **explains**; all scores and quantities remain deterministic.

---

## 9. Where Phase 2 attaches

Phase 2 does **not** replace Pipelines 1–3. It adds a parallel **sales optimization** intelligence path that reuses the same signals, dashboard, and explanation pattern.

```mermaid
flowchart TB
  subgraph Shared["Shared foundation (Phase 1)"]
    Signals[(cartEvents / orders / ratings)]
    Inv[(inventory + ledger)]
    Dash[Admin dashboard]
    Claude[Claude explanations]
  end

  subgraph Phase1["Phase 1 — Replenishment"]
    RPipe[Replenishment pipeline]
    Rec[(recommendations<br/>REORDER / BLOCKED / …)]
    PO[Purchase orders]
  end

  subgraph Phase2["Phase 2 — Sales optimization — future"]
    ST[Sell-through %]
    Age[Inventory age]
    Strat[Strategy engine<br/>discount / bundle / homepage / clearance]
    SalesRec[(strategy recommendations)]
  end

  Signals --> RPipe
  Inv --> RPipe
  RPipe --> Rec --> Dash
  Rec --> PO

  Signals --> ST
  Inv --> ST
  Inv --> Age
  ST --> Strat
  Age --> Strat
  Strat --> SalesRec
  SalesRec --> Dash
  Strat --> Claude
  RPipe --> Claude
```

### Phase 2 strategy bands (planned)

| Sell-through % | Interpretation | Strategy |
|----------------|----------------|----------|
| 90–100% | Excellent | Continue normal pricing |
| 70–90% | Good | Monitor |
| 40–70% | Slow moving | Homepage highlight |
| 20–40% | Poor | Discount or bundle |
| &lt;20% | Dead stock | Aggressive clearance |

### Explicitly deferred past Phase 2

- Multi-store transfer recommendations  
- Real external supplier integrations  
- Production multi-tenant auth / mobile app  

---

## 10. End-to-end Phase 1 demo path

```mermaid
flowchart TD
  A[Start Mongo + backend] --> B[Seed / load catalog + stock]
  B --> C[Run simulator]
  C --> D[Consumer writes signals]
  D --> E[Cron B or POST /generate]
  E --> F[Dashboard shows recommendations]
  F --> G[Ask assistant: why reorder X?]
  G --> H[Approve eligible recommendation]
  H --> I[PO created + notification]
```

**Operator commands (typical local flow)**

```bash
docker compose up -d          # Mongo
npm run dev                   # Backend (+ Cron B)
npm run simulate              # Pipeline 1
npm run queue:consumer        # Pipeline 2
# Pipeline 3: wait for Cron B, or:
curl -X POST http://localhost:3000/api/v1/recommendations/generate -H 'Content-Type: application/json' -d '{}'
npm run dev:dashboard         # Admin UI + assistant
```

---

## 11. Non-functional guarantees (Phase 1)

| Principle | How it is enforced |
|-----------|-------------------|
| Correctness over cleverness | Scores, thresholds, qty in TypeScript; unit-tested |
| Explainability | Every recommendation has `summary` + `factors` |
| Auditability | `agentDecisions` + `stockLedger` + recommendation history |
| No autonomous spending | Only admin approve creates a PO |
| Idempotent regenerations | Pending recs expired before new ones for same product/store |
| Scheduler safety | Cron B skips if previous tick still running |

---

## Related docs

- [Architecture index](./README.md)
- [Database schema](../database/database-schema.md)
- [PRD index](../PRD/README.md)
- [Diagrams index](../diagrams/README.md)
