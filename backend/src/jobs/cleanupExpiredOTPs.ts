import cron from "node-cron";
import prisma from "../config/client.js";
import logger from "../utils/logger.js";

// Runs every day at 2:00 AM server time
// Deletes all OTP records that have expired

export function startOTPCleanupJob() {
  cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("Starting expired OTP cleanup job...");

      const result = await prisma.oTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(), // less than current time
          },
        },
      });

      logger.info(
        `Cleanup complete: ${result.count} expired OTP records deleted.`
      );
    } catch (error) {
      logger.error({ error }, "Error during OTP cleanup job");
    }
  });

  logger.info("OTP cleanup cron job scheduled: daily at 2:00 AM");
}
