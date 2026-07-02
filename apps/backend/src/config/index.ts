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

  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGODB_URI,
    aws: {
      region: env.AWS_REGION,
    },
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  } as const;
}

export const config = loadConfig();
export type Config = typeof config;
