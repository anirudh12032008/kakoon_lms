import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "../utils/logger";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => logger.info("✅ MongoDB connected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", { err: err.message }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  await mongoose.connect(config.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
