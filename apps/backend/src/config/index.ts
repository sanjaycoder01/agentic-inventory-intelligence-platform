import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongodbUri:
    process.env.MONGODB_URI ??
    "mongodb://localhost:27017/inventory_intelligence",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
} as const;
