import mongoose from "mongoose";
import { config } from "../config/index.js";

export async function connectMongoDB(): Promise<void> {
  await mongoose.connect(config.mongoUri);
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}
