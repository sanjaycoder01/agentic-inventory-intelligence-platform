import type {
  BackendClientPort,
  BackendClientResult,
  CartEvent,
} from "../dispatch/event.dispatcher.js";
import type { OrderDTO, OrderEvent } from "../generators/order.generator.js";
import type { RatingDTO, RatingEvent } from "../generators/rating.generator.js";
import { simulatorConfig, type SimulatorConfig } from "../config/simulator.config.js";

type BackendSuccessEnvelope = {
  success?: boolean;
  data?: unknown;
  message?: string;
};

export class BackendClient implements BackendClientPort {
  private readonly orderIdMap = new Map<string, string>();
  private readonly backendBaseUrl?: string;
  private readonly timeoutMs: number;

  constructor(config: SimulatorConfig = simulatorConfig) {
    this.backendBaseUrl = config.backendBaseUrl;
    this.timeoutMs = config.timeoutMs;
  }

  async sendCartEvent(event: CartEvent): Promise<BackendClientResult> {
    return this.post(
      "/api/v1/cart-events",
      {
        ...event.payload,
        ...(event.eventId ? { eventId: event.eventId } : {}),
      },
      event,
    );
  }

  async sendOrder(event: OrderEvent): Promise<BackendClientResult> {
    const result = await this.post(
      "/api/v1/orders",
      toBackendOrderPayload(event.payload),
      event,
    );

    if (result.success) {
      const persistedOrderId = extractPersistedId(result.response);

      if (persistedOrderId) {
        this.orderIdMap.set(event.payload.orderId, persistedOrderId);
      }
    }

    return result;
  }

  async sendRating(event: RatingEvent): Promise<BackendClientResult> {
    const persistedOrderId = this.orderIdMap.get(event.payload.orderId);

    if (!persistedOrderId) {
      return {
        success: false,
        error: `No persisted order ID found for synthetic order ${event.payload.orderId}`,
      };
    }

    return this.post(
      "/api/v1/ratings",
      toBackendRatingPayload(event.payload, persistedOrderId),
      event,
    );
  }

  private async post(
    path: string,
    body: unknown,
    event: CartEvent | OrderEvent | RatingEvent,
  ): Promise<BackendClientResult> {
    if (!this.backendBaseUrl) {
      return {
        success: false,
        error: "BACKEND_URL is not configured",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${trimTrailingSlash(this.backendBaseUrl)}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Simulation-Run-Id": event.simulationRunId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const responseBody = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: extractErrorMessage(responseBody, response.statusText),
          response: responseBody,
        };
      }

      return {
        success: true,
        status: response.status,
        eventId: extractPersistedId(responseBody),
        response: responseBody,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown backend error",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toBackendOrderPayload(order: OrderDTO) {
  return {
    productId: order.productId,
    darkStoreId: order.darkStoreId,
    quantity: order.quantity,
    sessionId: order.sessionId,
    orderStatus: order.orderStatus,
  };
}

function toBackendRatingPayload(rating: RatingDTO, persistedOrderId: string) {
  return {
    orderId: persistedOrderId,
    productId: rating.productId,
    darkStoreId: rating.darkStoreId,
    rating: rating.rating,
    // Zod optional() rejects null — omit empty reviews
    ...(rating.review != null ? { review: rating.review } : {}),
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractPersistedId(response: unknown): string | undefined {
  if (!isRecord(response)) {
    return undefined;
  }

  const envelope = response as BackendSuccessEnvelope;
  const data = envelope.data;

  if (isRecord(data) && typeof data.id === "string") {
    return data.id;
  }

  if (typeof response.id === "string") {
    return response.id;
  }

  return undefined;
}

function extractErrorMessage(response: unknown, fallback: string): string {
  if (isRecord(response)) {
    if (typeof response.message === "string") {
      return response.message;
    }

    if (typeof response.error === "string") {
      return response.error;
    }
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
