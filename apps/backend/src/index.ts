import "dotenv/config";

import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectMongoDB, disconnectMongoDB } from "./db/connection.js";
import { RecommendationScheduler } from "./modules/intelligence/recommendation.scheduler.js";

async function main() {
  await connectMongoDB();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(
      `Backend listening on port ${config.port} [${config.nodeEnv}]`,
    );
  });

  const recommendationScheduler = new RecommendationScheduler({
    enabled: config.recommendationCron.enabled,
    cronExpression: config.recommendationCron.expression,
    darkStoreId: config.recommendationCron.darkStoreId,
  });
  recommendationScheduler.start();

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    recommendationScheduler.stop();
    server.close(async () => {
      await disconnectMongoDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch(async (err) => {
  console.error("Failed to start backend:", err);
  await disconnectMongoDB().catch(() => undefined);
  process.exit(1);
});
