import { config } from "./config/index.js";
import { connectDatabase } from "./db/connection.js";
import { createApp } from "./app.js";

async function main() {
  await connectDatabase();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});
