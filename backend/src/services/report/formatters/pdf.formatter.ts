import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface PDFReportConfig {
    title: string;
    subtitle?: string;
    dateRange?: { start: Date; end: Date };
    generatedBy?: string;
}

export interface TableColumn {
    header: string;
    key: string;
    width?: number;
    align?: "left" | "center" | "right";
}

export class PDFFormatter {
    private doc: typeof PDFDocument.prototype;
    private config: PDFReportConfig;
    private currentY: number = 50;

    constructor(config: PDFReportConfig) {
        this.config = config;
        this.doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    }

    // Get buffer for direct download
    async toBuffer(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            this.doc.on("data", (chunk: Buffer) => chunks.push(chunk));
            this.doc.on("end", () => resolve(Buffer.concat(chunks)));
            this.doc.on("error", reject);
            this.doc.end();
        });
    }

    // Get readable stream
    toStream(): Readable {
        this.doc.end();
        return this.doc;
    }

    // Add header with branding
    addHeader(): this {
        const { title, subtitle, dateRange, generatedBy } = this.config;

        // Company branding
        this.doc.fontSize(20).font("Helvetica-Bold").fillColor("#2563eb")
            .text("ProfessionalsBD", 50, 40, { align: "center" });

        this.doc.fontSize(10).font("Helvetica").fillColor("#64748b")
            .text("www.professionalsbd.com", { align: "center" });

        this.doc.moveDown(1);

        // Report title
        this.doc.fontSize(16).font("Helvetica-Bold").fillColor("#1e293b")
            .text(title, { align: "center" });

        if (subtitle) {
            this.doc.fontSize(10).font("Helvetica").fillColor("#64748b")
                .text(subtitle, { align: "center" });
        }

        // Date range
        if (dateRange) {
            this.doc.fontSize(9).fillColor("#94a3b8")
                .text(`Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`, { align: "center" });
        }

        // Generated info
        this.doc.fontSize(8).fillColor("#94a3b8")
            .text(`Generated: ${new Date().toLocaleString()}${generatedBy ? ` by ${generatedBy}` : ""}`, { align: "center" });

        this.doc.moveDown(2);
        this.currentY = this.doc.y;

        // Separator line
        this.doc.strokeColor("#e2e8f0").lineWidth(1)
            .moveTo(50, this.currentY).lineTo(545, this.currentY).stroke();

        this.doc.moveDown(1);
        this.currentY = this.doc.y;

        return this;
    }

    // Add a section title
    addSection(title: string): this {
        this.doc.fontSize(12).font("Helvetica-Bold").fillColor("#334155")
            .text(title, 50, this.doc.y);
        this.doc.moveDown(0.5);
        this.currentY = this.doc.y;
        return this;
    }

    // Add summary stats in a grid
    addStats(stats: { label: string; value: string | number }[]): this {
        const boxWidth = 120;
        const boxHeight = 50;
        const startX = 50;
        let x = startX;
        let y = this.doc.y;

        stats.forEach((stat, i) => {
            // Box background
            this.doc.rect(x, y, boxWidth, boxHeight).fillColor("#f8fafc").fill();
            this.doc.rect(x, y, boxWidth, boxHeight).strokeColor("#e2e8f0").stroke();

            // Value
            this.doc.fontSize(16).font("Helvetica-Bold").fillColor("#1e293b")
                .text(String(stat.value), x, y + 10, { width: boxWidth, align: "center" });

            // Label
            this.doc.fontSize(8).font("Helvetica").fillColor("#64748b")
                .text(stat.label, x, y + 32, { width: boxWidth, align: "center" });

            x += boxWidth + 10;
            if ((i + 1) % 4 === 0) {
                x = startX;
                y += boxHeight + 10;
            }
        });

        this.doc.y = y + boxHeight + 20;
        this.currentY = this.doc.y;
        return this;
    }

    // Add a data table
    addTable(columns: TableColumn[], data: any[]): this {
        const startX = 50;
        const pageWidth = 495;
        const colWidth = pageWidth / columns.length;
        let y = this.doc.y;

        // Header row
        this.doc.rect(startX, y, pageWidth, 25).fillColor("#f1f5f9").fill();

        columns.forEach((col, i) => {
            this.doc.fontSize(9).font("Helvetica-Bold").fillColor("#475569")
                .text(col.header.toUpperCase(), startX + i * colWidth + 5, y + 8, {
                    width: colWidth - 10,
                    align: col.align || "left"
                });
        });

        y += 25;

        // Data rows
        data.forEach((row, rowIndex) => {
            // Check for page break
            if (y > 750) {
                this.doc.addPage();
                y = 50;
            }

            // Alternate row colors
            if (rowIndex % 2 === 0) {
                this.doc.rect(startX, y, pageWidth, 22).fillColor("#fafafa").fill();
            }

            columns.forEach((col, i) => {
                const value = row[col.key] ?? "-";
                this.doc.fontSize(9).font("Helvetica").fillColor("#334155")
                    .text(String(value), startX + i * colWidth + 5, y + 6, {
                        width: colWidth - 10,
                        align: col.align || "left"
                    });
            });

            y += 22;
        });

        // Draw table border
        this.doc.rect(startX, this.doc.y, pageWidth, y - this.doc.y).strokeColor("#e2e8f0").stroke();

        this.doc.y = y + 10;
        this.currentY = this.doc.y;
        return this;
    }

    // Add footer
    addFooter(): this {
        const pageCount = this.doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            this.doc.switchToPage(i);
            this.doc.fontSize(8).fillColor("#94a3b8")
                .text(
                    `Page ${i + 1} of ${pageCount} | ProfessionalsBD Report`,
                    50, 780, { align: "center", width: 495 }
                );
        }
        return this;
    }

    // Add custom text
    addText(text: string, options?: { fontSize?: number; bold?: boolean; color?: string }): this {
        this.doc.fontSize(options?.fontSize || 10)
            .font(options?.bold ? "Helvetica-Bold" : "Helvetica")
            .fillColor(options?.color || "#334155")
            .text(text, 50, this.doc.y);
        this.doc.moveDown(0.5);
        return this;
    }

    // Add chart placeholder (description text)
    addChartPlaceholder(description: string): this {
        this.doc.rect(50, this.doc.y, 495, 80).fillColor("#f8fafc").fill();
        this.doc.rect(50, this.doc.y, 495, 80).strokeColor("#e2e8f0").stroke();
        this.doc.fontSize(10).fillColor("#94a3b8")
            .text(`[Chart: ${description}]`, 50, this.doc.y + 35, { width: 495, align: "center" });
        this.doc.y += 90;
        return this;
    }
}
