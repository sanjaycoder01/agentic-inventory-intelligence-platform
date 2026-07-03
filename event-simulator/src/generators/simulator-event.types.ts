export type SimulatorEventType = "CART" | "ORDER" | "RATING";

export interface SimulatorEvent<
  TType extends SimulatorEventType = SimulatorEventType,
  TPayload = unknown,
> {
  type: TType;
  payload: TPayload;
  createdAt: Date;
}
