import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerate = vi.fn();

vi.mock("./sales-optimization.pipeline.js", () => ({
  salesOptimizationPipelineService: {
    generate: (...args: unknown[]) => mockGenerate(...args),
  },
}));

vi.mock("node-cron", () => {
  const schedule = vi.fn((_expr: string, _cb: () => void) => ({
    stop: vi.fn(),
  }));
  return {
    default: {
      schedule,
      validate: vi.fn(() => true),
    },
  };
});

import cron from "node-cron";
import { SalesOptimizationScheduler } from "./sales-optimization.scheduler.js";

describe("SalesOptimizationScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue({
      darkStoreId: "store-1",
      processed: 1,
      created: 1,
      failed: 0,
    });
  });

  it("does not schedule when disabled", () => {
    const scheduler = new SalesOptimizationScheduler({ enabled: false });
    scheduler.start();
    expect(cron.schedule).not.toHaveBeenCalled();
  });

  it("schedules every 15 minutes by default expression", () => {
    const scheduler = new SalesOptimizationScheduler({
      enabled: true,
      cronExpression: "*/15 * * * *",
    });
    scheduler.start();
    expect(cron.schedule).toHaveBeenCalledOnce();
  });

  it("runs the sales optimization pipeline on tick", async () => {
    const scheduler = new SalesOptimizationScheduler({
      enabled: true,
      darkStoreId: "store-1",
    });
    await scheduler.tick();
    expect(mockGenerate).toHaveBeenCalledWith({ darkStoreId: "store-1" });
  });
});
