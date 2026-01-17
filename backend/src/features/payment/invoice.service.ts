import fs from "fs";
import path from "path";
import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";
import { generateInvoicePDF } from "./invoice.generator.js";

export class InvoiceService {
  /**
   * Get invoice URL for a payment
   * If invoice doesn't exist, it will be auto-generated
   */
  static async getInvoiceUrl(paymentId: string): Promise<string> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { invoiceUrl: true, status: true },
    });

    if (!payment) {
      throw ApiError.notFound("Payment not found");
    }

    // Check if file actually exists in temp (it might be cleaned up)
    if (payment.invoiceUrl) {
      const fileName = `invoice_${paymentId}.pdf`;
      const tempPath = path.join(process.cwd(), "temp", fileName);

      if (fs.existsSync(tempPath)) {
        return payment.invoiceUrl;
      }
    }

    // Generate invoice if not exists or file missing
    return await generateInvoicePDF(paymentId);
  }

  /**
   * Force regenerate invoice (useful for updates)
   */
  static async regenerateInvoice(paymentId: string): Promise<string> {
    return await generateInvoicePDF(paymentId);
  }
}
