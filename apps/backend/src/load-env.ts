import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

/**
 * Must be imported before any module that reads process.env at load time.
 * Tries monorepo root `.env` from common working directories, then cwd.
 */
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"), // apps/backend → repo root
  path.resolve(process.cwd(), "../.env"),
];

for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

dotenv.config();
