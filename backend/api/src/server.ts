import { createApp } from "./app";
import { config } from "./config/config";
import { connectDB, disconnectDB } from "./config/db";
import { logger } from "./utils/logger";

async function start() {
  await connectDB();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`🚀 API listening on http://localhost:${config.port} (${config.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason: String(reason) });
  });
}

start().catch((err) => {
  logger.error("Failed to start server", { err: (err as Error).message });
  process.exit(1);
});
