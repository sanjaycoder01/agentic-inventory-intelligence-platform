import type { OrderEvent } from "../generators/order.generator.js";
import type { RatingEvent } from "../generators/rating.generator.js";
import type { SimulatorEvent } from "../generators/simulator-event.types.js";

export type CartEvent = SimulatorEvent<"CART", unknown>;
export type DispatchableSimulatorEvent = CartEvent | OrderEvent | RatingEvent;

export type BackendClientResult =
  | {
      success: true;
      status: number;
      eventId?: string;
      response: unknown;
    }
  | {
      success: false;
      status?: number;
      error: string;
      response?: unknown;
    };

export interface BackendClientPort {
  sendCartEvent(event: CartEvent): Promise<BackendClientResult>;
  sendOrder(event: OrderEvent): Promise<BackendClientResult>;
  sendRating(event: RatingEvent): Promise<BackendClientResult>;
}

export interface EventDispatchResult {
  simulationRunId: string;
  type: DispatchableSimulatorEvent["type"];
  result: BackendClientResult;
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
      const result = await this.dispatchOne(event);

      results.push({
        simulationRunId: event.simulationRunId,
        type: event.type,
        result,
        dispatchedAt: new Date(),
      });
    }

    return results;
  }

  private async dispatchOne(
    event: DispatchableSimulatorEvent,
  ): Promise<BackendClientResult> {
    switch (event.type) {
      case "CART":
        return this.backendClient.sendCartEvent(event);
      case "ORDER":
        return this.backendClient.sendOrder(event);
      case "RATING":
        return this.backendClient.sendRating(event);
      default:
        assertNever(event);
    }
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported simulator event type: ${JSON.stringify(value)}`);
}
