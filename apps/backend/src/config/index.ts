import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().positive().default(3000),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://localhost:27017/inventory_intelligence"),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  /** Cron B — recommendation engine. Default: enabled in non-test envs. */
  RECOMMENDATION_CRON_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("true"),
  /** Default: every 5 minutes */
  RECOMMENDATION_CRON_EXPRESSION: z.string().optional().default("*/5 * * * *"),
  RECOMMENDATION_CRON_DARK_STORE_ID: z.string().optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      "Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    process.exit(1);
  }

  const env = result.data;
  const cronEnabled =
    env.NODE_ENV === "test"
      ? false
      : env.RECOMMENDATION_CRON_ENABLED === "true";

  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGODB_URI,
    aws: {
      region: env.AWS_REGION,
    },
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    recommendationCron: {
      enabled: cronEnabled,
      expression: env.RECOMMENDATION_CRON_EXPRESSION,
      darkStoreId: env.RECOMMENDATION_CRON_DARK_STORE_ID || undefined,
    },
  } as const;
}

export const config = loadConfig();
export type Config = typeof config;
