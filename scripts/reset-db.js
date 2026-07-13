#!/usr/bin/env node
/**
 * Drop all MongoDB collections in the inventory database.
 * Usage: npm run reset-db
 */
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_intelligence";

async function main() {
  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log("No collections to drop.");
  } else {
    for (const { name } of collections) {
      await db.collection(name).drop();
      console.log(`  dropped ${name}`);
    }
    console.log(`Dropped ${collections.length} collection(s).`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("reset-db failed:", error.message);
  process.exit(1);
});
