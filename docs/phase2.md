We have successfully completed Phase 1 of the Agentic Inventory Intelligence Platform.

DO NOT rewrite or replace any existing Phase 1 logic.

Your task is to extend the existing architecture with Phase 2 (Sales Optimization Intelligence).

====================================================
FIRST
====================================================

Before writing code, inspect the entire repository.

Understand the existing architecture including:

- Products
- Dark Stores
- Warehouse
- Inventory
- cartEvents
- orders
- ratings
- recommendations
- purchaseOrders
- workflow
- stockLedger
- agentDecisions
- recommendation pipeline
- scheduler
- dashboard
- AI assistant
- simulator
- SQS consumer

Reuse existing services whenever possible.

Do NOT duplicate functionality.

Follow the existing project structure and coding style.

====================================================
PHASE 2 GOAL
====================================================

Phase 2 focuses on SALES OPTIMIZATION.

Unlike Phase 1, which answers

"Should we replenish this product?"

Phase 2 answers

"How can we increase sales and reduce dead inventory?"

The output should be optimization recommendations.

====================================================
INPUT SIGNALS
====================================================

The optimization engine must consume existing data.

Use:

orders
cartEvents
ratings
products
recommendations
stockLedger
warehouse inventory
darkStore inventory

DO NOT introduce another event pipeline.

Read existing Mongo collections.

====================================================
METRICS ENGINE
====================================================

Create an aggregation service that computes:

Sell Through %

Inventory Age

Days Since Last Sale

Average Daily Sales

Cart Adds

Conversion Rate

Average Rating

Current Inventory

Warehouse Inventory

Days of Cover

Demand Trend

Velocity

Dead Stock Score

Every metric should be deterministic.

====================================================
SELL THROUGH
====================================================

Sell Through %

Units Sold
------------------- ×100
Units Received

====================================================
INVENTORY AGE
====================================================

Track

30 days

60 days

90 days

120+ days

====================================================
VELOCITY
====================================================

Classify products into

FAST_MOVING

NORMAL

SLOW

DEAD

====================================================
STRATEGY ENGINE
====================================================

Create a rule engine.

Rules should be deterministic.

Example

IF

SellThrough < 25%

AND

InventoryAge > 90

↓

Recommendation

DISCOUNT

-----------------------------------

IF

High Inventory

AND

Low Conversion

↓

RUN ADS

-----------------------------------

IF

Frequently Bought Together

↓

CREATE BUNDLE

-----------------------------------

IF

High Views

Low Orders

↓

PRICE REVIEW

-----------------------------------

IF

Low Rating

↓

QUALITY INVESTIGATION

-----------------------------------

IF

Fast Moving

High Conversion

↓

NO ACTION

====================================================
RECOMMENDATION TYPES
====================================================

Extend recommendation enums with

DISCOUNT

BUNDLE

RUN_ADS

PRICE_REVIEW

QUALITY_CHECK

CLEARANCE

LIQUIDATE

NO_ACTION

====================================================
PIPELINE
====================================================

Create a new optimization pipeline.

Do NOT merge it into replenishment.

Pipeline should be

Aggregate Metrics

↓

Strategy Engine

↓

Inventory Validation

↓

Claude Explanation

↓

Persist Recommendation

↓

Dashboard

Reuse:

agentDecisions

stockLedger

Claude service

recommendation persistence

====================================================
SCHEDULER
====================================================

Create a separate scheduler.

Cron every 15 minutes.

Do NOT reuse replenishment scheduler.

====================================================
DATABASE
====================================================

Reuse recommendation collection.

Differentiate by

type

REPLENISHMENT

or

SALES_OPTIMIZATION

Store

metrics

reason

strategy

confidence

Claude explanation

====================================================
DASHBOARD
====================================================

Create a Sales Optimization page.

Show

Product

Inventory

Inventory Age

Sell Through %

Velocity

Strategy

Recommendation

Confidence

Status

Reason

Admin can

Approve

Reject

====================================================
WORKFLOW
====================================================

On approval

DISCOUNT

↓

Create Promotion record

--------------------------------

RUN_ADS

↓

Create Marketing Campaign

--------------------------------

BUNDLE

↓

Create Bundle definition

--------------------------------

PRICE REVIEW

↓

Create Pricing Review task

--------------------------------

QUALITY CHECK

↓

Create QA Investigation task

Workflow should reuse existing approval architecture.

====================================================
CLAUDE
====================================================

Claude MUST NOT make decisions.

Claude only explains deterministic decisions.

Example

"Inventory has not moved for 97 days while sell-through remains below 18%, therefore a 20% promotional discount is recommended."

====================================================
AUDIT
====================================================

Log every node into

agentDecisions

Metrics

↓

Strategy

↓

Validation

↓

Persistence

====================================================
API
====================================================

Provide

POST /api/v1/sales-optimization/generate

GET /api/v1/sales-optimization

GET /api/v1/sales-optimization/history

POST approve

POST reject

====================================================
TESTS
====================================================

Write unit tests for

Metric calculations

Sell Through

Inventory Age

Velocity

Strategy engine

Pipeline

Scheduler

Workflow

====================================================
IMPORTANT
====================================================

DO NOT break Phase 1.

DO NOT modify replenishment logic.

Keep replenishment and sales optimization as independent pipelines.

Reuse existing architecture.

Follow SOLID principles.

Avoid duplicated code.

At the end, provide:

1. Architecture changes
2. New files created
3. APIs added
4. Database changes
5. Scheduler changes
6. Dashboard changes
7. Tests added
8. Any assumptions made

Implementation should be production-ready and consistent with the existing codebase.

One architectural recommendation

Before you start Phase 2, rename your current recommendation pipeline to make the separation explicit:

Phase 1

Recommendation Pipeline
        ↓
Rename to

Replenishment Pipeline

Then your system becomes:

                Customer Events
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
Replenishment Intelligence     Sales Optimization Intelligence
         │                           │
         ▼                           ▼
Replenishment Recs         Sales Optimization Recs
         │                           │
         └─────────────┬─────────────┘
                       ▼
                Admin Dashboard
                       ▼
                  Workflow Engine

This separation mirrors how real retail systems are designed: one intelligence pipeline ensures products are available, while another optimizes how well those products sell. It also keeps your codebase modular and easier to extend in the future.