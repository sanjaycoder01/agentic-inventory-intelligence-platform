import { describe, expect, it } from "vitest";
import type { SimulatorEvent } from "../generators/simulator-event.types.js";
import { MemoryEventPipeline } from "./event.pipeline.js";

function createEvent(
  type: SimulatorEvent["type"],
  simulationRunId: string,
): SimulatorEvent {
  return {
    simulationRunId,
    type,
    payload: {},
    createdAt: new Date(),
  };
}

describe("MemoryEventPipeline", () => {
  it("enqueues and dequeues events in FIFO order", () => {
    const pipeline = new MemoryEventPipeline<SimulatorEvent>();
    const first = createEvent("CART", "run-1");
    const second = createEvent("ORDER", "run-1");

    pipeline.enqueue(first);
    pipeline.enqueueMany([second]);

    expect(pipeline.size()).toBe(2);
    expect(pipeline.dequeue()).toBe(first);
    expect(pipeline.dequeue()).toBe(second);
    expect(pipeline.dequeue()).toBeUndefined();
    expect(pipeline.size()).toBe(0);
  });

  it("dequeues batches without exceeding queue size", () => {
    const pipeline = new MemoryEventPipeline<SimulatorEvent>();
    const events = [
      createEvent("CART", "run-1"),
      createEvent("ORDER", "run-1"),
      createEvent("RATING", "run-1"),
    ];

    pipeline.enqueueMany(events);

    expect(pipeline.dequeueBatch(2)).toEqual(events.slice(0, 2));
    expect(pipeline.dequeueBatch(10)).toEqual(events.slice(2));
    expect(pipeline.size()).toBe(0);
  });

  it("returns an empty batch for non-positive batch sizes", () => {
    const pipeline = new MemoryEventPipeline<SimulatorEvent>();
    pipeline.enqueue(createEvent("CART", "run-1"));

    expect(pipeline.dequeueBatch(0)).toEqual([]);
    expect(pipeline.dequeueBatch(-5)).toEqual([]);
    expect(pipeline.size()).toBe(1);
  });

  it("clears all queued events", () => {
    const pipeline = new MemoryEventPipeline<SimulatorEvent>();
    pipeline.enqueueMany([
      createEvent("CART", "run-1"),
      createEvent("ORDER", "run-1"),
    ]);

    pipeline.clear();

    expect(pipeline.size()).toBe(0);
    expect(pipeline.dequeue()).toBeUndefined();
  });
});
