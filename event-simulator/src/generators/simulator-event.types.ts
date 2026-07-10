export type SimulatorEventType = "CART" | "ORDER" | "RATING";

export interface SimulatorEvent<
  TType extends SimulatorEventType = SimulatorEventType,
  TPayload = unknown,
> {
  eventId?: string;
  simulationRunId: string;
  type: TType;
  payload: TPayload;
  createdAt: Date;
}
