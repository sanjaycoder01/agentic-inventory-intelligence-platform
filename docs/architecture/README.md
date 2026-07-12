# Architecture

Modular monolith — a single Node.js backend with domain modules and a React admin dashboard.

## Design

- **apps/backend** — Express API, MongoDB persistence, scoring engine, recommendation pipeline, Claude explanations/assistant
- **apps/admin-dashboard** — Operator UI for recommendations, PO approval, and AI chat
- **event-simulator** — Synthetic cart / order / rating events via SQS

## Documents

| Document | Description |
|----------|-------------|
| [Phase 1 architecture](./phase-1-architecture.md) | End-to-end Phase 1 diagrams, three pipelines, and Phase 2 attachment points |
| [Database schema](../database/database-schema.md) | MongoDB collections |
| [Diagrams](../diagrams/README.md) | Additional diagram index |

## Planned follow-ups

- Phase 2 sales-optimization architecture (after Phase 2 implementation)
- MongoDB entity relationship deep-dive (ER beyond Phase 1 summary)
