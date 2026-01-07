import app from "./app.js";
import prisma from "./config/client.js";
import { env } from "./config/env.js";
// import { startOTPCleanupJob } from "./jobs/cleanupExpiredOTPs.js";
import logger from "./utils/logger.js";

const PORT = env.PORT || 8000;

const server = app.listen(PORT, () => {
  logger.info(
    `⚙️ Server running in ${env.NODE_ENV} mode on http://localhost:${PORT}`
  );

  // Start cron jobs
  // startOTPCleanupJob();
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info("Shutting down server...");
  server.close(async () => {
    logger.info("HTTP server closed.");
    await prisma.$disconnect();
    logger.info("Database connection closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
