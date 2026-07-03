import { describe, expect, it, vi } from "vitest";
import type { DarkStoreContext } from "../context/context.types.js";
import type { DispatchableSimulatorEvent } from "../dispatch/event.dispatcher.js";
import { MemoryEventPipeline } from "../pipeline/event.pipeline.js";
import { estimateCustomerCount, SimulationRunner } from "./simulation.runner.js";
import type { EventSchedulerPort } from "../scheduler/scheduler.types.js";

const sampleContext: DarkStoreContext = {
  darkStore: {
    id: "ds-1",
    code: "DS-BLR-001",
    name: "Koramangala Dark Store",
    area: "Koramangala",
    city: "Bengaluru",
  },
  catalogProducts: [
    {
      darkStoreId: "ds-1",
      productId: "prod-milk",
      productName: "Milk",
      category: "Dairy",
    },
  ],
  inventory: [
    {
      darkStoreId: "ds-1",
      productId: "prod-milk",
      productName: "Milk",
      category: "Dairy",
      availableQuantity: 100,
    },
  ],
};

function createSchedulerMock(
  pipeline: MemoryEventPipeline<DispatchableSimulatorEvent>,
): EventSchedulerPort {
  return {
    start: vi.fn(async () => {
      await Promise.resolve();
    }),
    stop: vi.fn(async () => {
      await Promise.resolve();
    }),
    waitUntilComplete: vi.fn(async () => {
      while (pipeline.size() > 0) {
        pipeline.dequeue();
      }
    }),
    isRunning: vi.fn(() => false),
  };
}

describe("SimulationRunner", () => {
  it("orchestrates scenario execution and returns a summary", async () => {
    const pipeline = new MemoryEventPipeline<DispatchableSimulatorEvent>();
    const scheduler = createSchedulerMock(pipeline);
    const runner = new SimulationRunner({ pipeline, scheduler });

    const summary = await runner.runScenario("HIGH_DEMAND", {
      contexts: [sampleContext],
      customerCount: 25,
      simulationRunId: "sim-test-1",
    });

    expect(summary.completed).toBe(true);
    expect(summary.scenario).toBe("HIGH_DEMAND");
    expect(summary.customers).toBe(25);
    expect(summary.simulationRunId).toBe("sim-test-1");
    expect(summary.cartEvents).toBeGreaterThan(0);
    expect(pipeline.size()).toBe(0);
    expect(scheduler.start).toHaveBeenCalledOnce();
    expect(scheduler.waitUntilComplete).toHaveBeenCalledOnce();
  });

  it("estimates customer count from scenario demand profile", () => {
    expect(
      estimateCustomerCount({
        id: "HIGH_DEMAND",
        name: "High Demand Milk",
        description: "test",
        durationMinutes: 30,
        targetProducts: ["Milk"],
        targetDarkStores: ["ALL"],
        personaMix: [],
        behavior: {
          cartEventsPerMinute: 120,
          conversionRate: 0.9,
          reviewParticipationRate: 0.2,
          averageRating: 4.8,
        },
      }),
    ).toBe(500);
  });
});
