export interface SimulatorConfig {
  backendBaseUrl?: string;
  timeoutMs: number;
}

export const simulatorConfig: SimulatorConfig = {
  backendBaseUrl: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  timeoutMs: Number(process.env.SIMULATOR_HTTP_TIMEOUT_MS ?? 5000),
};
