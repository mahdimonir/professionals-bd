import fs from "fs";
import cron from "node-cron";
import path from "path";
import logger from "../utils/logger.js";

// Runs every hour
// Deletes PDF files in temp directory older than 1 hour

export function startInvoiceCleanupJob() {
    cron.schedule("0 * * * *", async () => {
        try {
            logger.info("Starting invoice cleanup job...");

            const tempDir = path.join(process.cwd(), "temp");

            if (!fs.existsSync(tempDir)) return;

            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            let deletedCount = 0;

            for (const file of files) {
                if (!file.endsWith(".pdf")) continue;

                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > oneHour) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                logger.info(`Cleanup complete: ${deletedCount} old invoice files deleted.`);
            }
        } catch (error) {
            logger.error({ error }, "Error during invoice cleanup job");
        }
    });

    logger.info("Invoice cleanup cron job scheduled: hourly");
}
