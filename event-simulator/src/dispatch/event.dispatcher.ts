import type { OrderEvent } from "../generators/order.generator.js";
import type { RatingEvent } from "../generators/rating.generator.js";
import type { SimulatorEvent } from "../generators/simulator-event.types.js";

export type CartEvent = SimulatorEvent<"CART", unknown>;
export type DispatchableSimulatorEvent = CartEvent | OrderEvent | RatingEvent;

export interface BackendClientPort {
  sendCartEvent(event: CartEvent): Promise<void>;
  sendOrder(event: OrderEvent): Promise<void>;
  sendRating(event: RatingEvent): Promise<void>;
}

export interface EventDispatchResult {
  simulationRunId: string;
  type: DispatchableSimulatorEvent["type"];
  dispatchedAt: Date;
}

export class EventDispatcher {
  constructor(private readonly backendClient: BackendClientPort) {}

  async dispatch(
    events: DispatchableSimulatorEvent | DispatchableSimulatorEvent[],
  ): Promise<EventDispatchResult[]> {
    const eventList = Array.isArray(events) ? events : [events];
    const results: EventDispatchResult[] = [];

    for (const event of eventList) {
      await this.dispatchOne(event);

      results.push({
        simulationRunId: event.simulationRunId,
        type: event.type,
        dispatchedAt: new Date(),
      });
    }

    return results;
  }

  private async dispatchOne(event: DispatchableSimulatorEvent): Promise<void> {
    switch (event.type) {
      case "CART":
        await this.backendClient.sendCartEvent(event);
        return;
      case "ORDER":
        await this.backendClient.sendOrder(event);
        return;
      case "RATING":
        await this.backendClient.sendRating(event);
        return;
      default:
        assertNever(event);
    }
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported simulator event type: ${JSON.stringify(value)}`);
}
