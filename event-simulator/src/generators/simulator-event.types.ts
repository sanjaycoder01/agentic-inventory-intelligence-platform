export type SimulatorEventType = "CART" | "ORDER" | "RATING";

export interface SimulatorEvent<
  TType extends SimulatorEventType = SimulatorEventType,
  TPayload = unknown,
> {
  simulationRunId: string;
  type: TType;
  payload: TPayload;
  createdAt: Date;
}
