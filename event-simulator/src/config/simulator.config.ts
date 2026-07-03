export interface SimulatorConfig {
  backendBaseUrl?: string;
  timeoutMs: number;
}

export const simulatorConfig: SimulatorConfig = {
  backendBaseUrl: process.env.BACKEND_URL,
  timeoutMs: Number(process.env.SIMULATOR_HTTP_TIMEOUT_MS ?? 5000),
};
