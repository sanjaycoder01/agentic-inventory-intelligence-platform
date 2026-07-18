# Demand Intelligence Engine

## What changed

Replenishment **demandScore** is no longer a single relative 24h cart share
(`cartCount / maxCartAcrossCatalog`). It is now produced by a **Demand Intelligence**
layer that still emits one normalized **0–1 `demandScore`**, so:

- Replenishment weights stay **0.4 demand / 0.3 rating / 0.3 conversion**
- Conversion score, rating score, eligibility gates, rules, cron B/C, and Phase 2 are unchanged
- APIs remain backward compatible (`cartCount24h`, `demandScore`, `windowHours` still present)

## Architecture

```
cartEvents (Mongo)
        │
        ▼
DemandService.getProductDemand(productId, darkStoreId?)
        │  windows: 5m / 30m / 2h / 24h (configurable)
        ▼
calculateDemandIntelligence()  ← pure, unit-tested
        │  velocity, baselineMultiplier, trend, demandScore
        ▼
SignalAggregator → ProductSignals.demandIntelligence
        │
        ├── Eligibility / Rules  (still use demandScore only)
        ├── Explanation (factors + Claude facts include windows)
        ├── Persistence (recommendations.demandIntelligence)
        └── Dashboard badges (5m, 30m, velocity, trend, baseline)
```

## Why this improves replenishment

| Before | After |
|--------|--------|
| Flat 24h volume vs catalog max | Multi-horizon intensity (5m→24h) |
| No notion of acceleration | Velocity RISING / STABLE / FALLING |
| No historical context | Baseline multiplier vs avg hourly rate |
| Opaque single number | Explainable intermediates for admins + Claude |

Sudden spikes (e.g. milk rush) raise velocity + baseline multiplier quickly, lifting
`demandScore` even before the full 24h window fills — closer to real quick-commerce
signal reading — without ML or changing the PO approval workflow.
