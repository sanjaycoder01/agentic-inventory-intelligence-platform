import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerate = vi.fn();

vi.mock("./recommendation-pipeline.service.js", () => ({
  recommendationPipelineService: {
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
import { RecommendationScheduler } from "./recommendation.scheduler.js";

describe("RecommendationScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue({
      darkStoreId: "store-1",
      processed: 2,
      created: 2,
      failed: 0,
    });
  });

  it("does not schedule when disabled", () => {
    const scheduler = new RecommendationScheduler({ enabled: false });
    scheduler.start();
    expect(cron.schedule).not.toHaveBeenCalled();
  });

  it("schedules with the configured cron expression", () => {
    const scheduler = new RecommendationScheduler({
      enabled: true,
      cronExpression: "*/5 * * * *",
    });
    scheduler.start();
    expect(cron.validate).toHaveBeenCalledWith("*/5 * * * *");
    expect(cron.schedule).toHaveBeenCalledOnce();
  });

  it("runs the recommendation pipeline on tick", async () => {
    const scheduler = new RecommendationScheduler({
      enabled: true,
      darkStoreId: "store-1",
    });

    await scheduler.tick();

    expect(mockGenerate).toHaveBeenCalledWith({ darkStoreId: "store-1" });
  });

  it("skips overlapping ticks while a run is in progress", async () => {
    let resolveGenerate: (() => void) | undefined;
    mockGenerate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGenerate = () =>
            resolve({
              darkStoreId: "store-1",
              processed: 1,
              created: 1,
              failed: 0,
            });
        }),
    );

    const scheduler = new RecommendationScheduler({ enabled: true });
    const first = scheduler.tick();
    const second = scheduler.tick();

    resolveGenerate?.();
    await Promise.all([first, second]);

    expect(mockGenerate).toHaveBeenCalledOnce();
  });
});
