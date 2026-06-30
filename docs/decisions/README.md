# Architecture Decision Records

## ADR-001: Modular Monolith over Microservices

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Early-stage project needs fast iteration; domain modules are tightly coupled around the intelligence pipeline |
| **Decision** | Single `apps/backend` with domain modules instead of separate microservices |
| **Consequences** | Simpler local dev and deployment; can extract services later if boundaries harden |

## Index

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Modular Monolith over Microservices | Accepted |
