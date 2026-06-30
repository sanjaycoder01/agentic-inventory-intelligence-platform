# Architecture

Modular monolith — a single Node.js backend with domain modules and a React admin dashboard.

## Design

- **apps/backend** — Express API, MongoDB persistence, scoring engine, LangGraph agents
- **apps/admin-dashboard** — Operator UI for recommendations, PO approval, and AI chat

## Planned Documents

- High-Level Architecture
- Module Interaction Diagram
- Scoring & Eligibility Algorithm
- Agent Pipeline (LangGraph)
- MongoDB Schema
