import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import prisma from "../../config/client.js";
import { env } from "../../config/env.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";

interface InvoiceConfig {
  companyName?: string;
  companyLogoUrl?: string; // optional Cloudinary logo
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  extraFooterText?: string;
  includeVAT?: boolean;
  vatRate?: number; // e.g. 0.15 for 15%
  sendEmail?: boolean; // Send invoice email after generation
}

const defaultConfig: InvoiceConfig = {
  companyName: "ProfessionalsBD",
  companyAddress: "Dhaka, Bangladesh",
  companyEmail: "support@professionalsbd.com",
  companyPhone: "+880 1234 567890",
  extraFooterText: "Thank you for choosing ProfessionalsBD",
  includeVAT: false,
  vatRate: 0,
  sendEmail: true, // Default to sending email
};

export async function generateInvoicePDF(
  paymentId: string,
  customConfig: Partial<InvoiceConfig> = {}
): Promise<string> {
  const config = { ...defaultConfig, ...customConfig };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          professional: { select: { name: true } },
        },
      },
    },
  });

  if (!payment) throw ApiError.notFound("Payment not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const fileName = `invoice_${payment.id}.pdf`;
  const tempDir = path.join(process.cwd(), "temp");
  const tempPath = path.join(tempDir, fileName);

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(tempPath);
  doc.pipe(writeStream);

  // Header
  doc.fontSize(24).font("Helvetica-Bold").text(config.companyName!, { align: "center" });
  if (config.companyLogoUrl) {
    doc.image(config.companyLogoUrl, { fit: [100, 100], align: "center", valign: "center" });
  }
  doc.moveDown(1);
  doc.fontSize(12).text("Invoice", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Invoice #: ${payment.id}`, { align: "center" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-BD")}`, { align: "center" });
  doc.moveDown();

  // Company & Client Info
  doc.fontSize(12).text("From:", 50, doc.y);
  doc.fontSize(10).text(config.companyName!, 50, doc.y);
  doc.text(config.companyAddress!, 50, doc.y);
  doc.text(config.companyEmail!, 50, doc.y);
  doc.text(config.companyPhone!, 50, doc.y);
  doc.moveDown();

  doc.text("To:", 300, doc.y - 80);
  doc.fontSize(10).text(payment.booking.user.name || "Client", 300, doc.y);
  doc.text(payment.booking.user.email || "", 300, doc.y);
  doc.text(payment.booking.user.phone || "", 300, doc.y);
  doc.moveDown(2);

  // Table Header
  doc.fontSize(12).font("Helvetica-Bold").text("Description", 50, doc.y);
  doc.text("Amount (BDT)", 400, doc.y, { align: "right" });
  doc.moveDown(0.5);
  doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  // Table Content
  doc.font("Helvetica").fontSize(11);
  doc.text("Professional Consultation Service", 50, doc.y + 10);
  doc.text(payment.amount.toFixed(2), 400, doc.y + 10, { align: "right" });

  if (config.includeVAT) {
    const vat = payment.amount.toNumber() * (config.vatRate || 0);
    doc.text(`VAT (${(config.vatRate! * 100).toFixed(0)}%)`, 50, doc.y + 10);
    doc.text(vat.toFixed(2), 400, doc.y + 10, { align: "right" });
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Total", 50, doc.y + 10);
    doc.text((payment.amount.toNumber() + vat).toFixed(2), 400, doc.y + 10, { align: "right" });
  }

  doc.moveDown(2);
  doc.fontSize(10).text(config.extraFooterText!, { align: "center" });

  doc.end();

  // Wait for file write to finish
  await new Promise<void>((resolve) => writeStream.on("finish", () => resolve()));

  // Construct Local URL
  const invoiceUrl = `${env.BASE_URL}/invoices/${fileName}`;

  // Save URL
  await prisma.payment.update({
    where: { id: paymentId },
    data: { invoiceUrl },
  });

  // Send email if enabled
  if (config.sendEmail && payment.booking.user.email) {
    await emailService.sendInvoice(
      payment.booking.user.email,
      payment.booking.user.name || "Customer",
      invoiceUrl,
      payment.amount.toNumber(),
      payment.booking.id
    );
  }

  return invoiceUrl;
}