import ExcelJS from "exceljs";

export interface ExcelReportConfig {
    title: string;
    subtitle?: string;
    dateRange?: { start: Date; end: Date };
    generatedBy?: string;
    sheetName?: string;
}

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}

export class ExcelFormatter {
    private workbook: ExcelJS.Workbook;
    private worksheet: ExcelJS.Worksheet;
    private config: ExcelReportConfig;
    private currentRow: number = 1;

    constructor(config: ExcelReportConfig) {
        this.config = config;
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = "ProfessionalsBD";
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet(config.sheetName || "Report");
    }

    // Get buffer for download
    async toBuffer(): Promise<Buffer> {
        const arrayBuffer = await this.workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer);
    }

    // Add header with branding
    addHeader(): this {
        const { title, subtitle, dateRange, generatedBy } = this.config;

        // Company name
        this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
        const brandCell = this.worksheet.getCell(`A${this.currentRow}`);
        brandCell.value = "ProfessionalsBD";
        brandCell.font = { size: 18, bold: true, color: { argb: "FF2563EB" } };
        brandCell.alignment = { horizontal: "center" };
        this.currentRow++;

        // Report title
        this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
        const titleCell = this.worksheet.getCell(`A${this.currentRow}`);
        titleCell.value = title;
        titleCell.font = { size: 14, bold: true };
        titleCell.alignment = { horizontal: "center" };
        this.currentRow++;

        // Subtitle
        if (subtitle) {
            this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
            const subtitleCell = this.worksheet.getCell(`A${this.currentRow}`);
            subtitleCell.value = subtitle;
            subtitleCell.font = { size: 10, color: { argb: "FF64748B" } };
            subtitleCell.alignment = { horizontal: "center" };
            this.currentRow++;
        }

        // Date range
        if (dateRange) {
            this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
            const dateCell = this.worksheet.getCell(`A${this.currentRow}`);
            dateCell.value = `Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
            dateCell.font = { size: 9, color: { argb: "FF94A3B8" } };
            dateCell.alignment = { horizontal: "center" };
            this.currentRow++;
        }

        // Generated info
        this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
        const genCell = this.worksheet.getCell(`A${this.currentRow}`);
        genCell.value = `Generated: ${new Date().toLocaleString()}${generatedBy ? ` by ${generatedBy}` : ""}`;
        genCell.font = { size: 8, color: { argb: "FF94A3B8" } };
        genCell.alignment = { horizontal: "center" };
        this.currentRow += 2;

        return this;
    }

    // Add a section title
    addSection(title: string): this {
        this.worksheet.mergeCells(`A${this.currentRow}:H${this.currentRow}`);
        const cell = this.worksheet.getCell(`A${this.currentRow}`);
        cell.value = title;
        cell.font = { size: 12, bold: true, color: { argb: "FF334155" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        this.currentRow += 2;
        return this;
    }

    // Add summary stats
    addStats(stats: { label: string; value: string | number }[]): this {
        const row = this.worksheet.getRow(this.currentRow);

        stats.forEach((stat, i) => {
            const cell = row.getCell(i + 1);
            cell.value = `${stat.label}: ${stat.value}`;
            cell.font = { bold: true };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
            cell.border = {
                top: { style: "thin", color: { argb: "FFE2E8F0" } },
                left: { style: "thin", color: { argb: "FFE2E8F0" } },
                bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                right: { style: "thin", color: { argb: "FFE2E8F0" } },
            };
        });

        this.currentRow += 2;
        return this;
    }

    // Add a data table
    addTable(columns: ExcelColumn[], data: any[]): this {
        const startRow = this.currentRow;

        // Set column headers and widths
        columns.forEach((col, i) => {
            const cell = this.worksheet.getCell(this.currentRow, i + 1);
            cell.value = col.header.toUpperCase();
            cell.font = { bold: true, color: { argb: "FF475569" }, size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
            cell.alignment = { horizontal: "center" };
            cell.border = {
                top: { style: "thin", color: { argb: "FFE2E8F0" } },
                left: { style: "thin", color: { argb: "FFE2E8F0" } },
                bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                right: { style: "thin", color: { argb: "FFE2E8F0" } },
            };

            // Set column width
            this.worksheet.getColumn(i + 1).width = col.width || 15;
        });

        this.currentRow++;

        // Add data rows
        data.forEach((row, rowIndex) => {
            columns.forEach((col, colIndex) => {
                const cell = this.worksheet.getCell(this.currentRow, colIndex + 1);
                cell.value = row[col.key] ?? "-";
                cell.font = { size: 10, color: { argb: "FF334155" } };
                cell.border = {
                    top: { style: "thin", color: { argb: "FFE2E8F0" } },
                    left: { style: "thin", color: { argb: "FFE2E8F0" } },
                    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                    right: { style: "thin", color: { argb: "FFE2E8F0" } },
                };

                // Alternate row colors
                if (rowIndex % 2 === 0) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
                }
            });
            this.currentRow++;
        });

        this.currentRow += 2;
        return this;
    }

    // Add multiple sheets
    addSheet(name: string): this {
        this.worksheet = this.workbook.addWorksheet(name);
        this.currentRow = 1;
        return this;
    }

    // Auto-fit columns
    autoFitColumns(): this {
        this.worksheet.columns.forEach(column => {
            let maxLength = 10;
            column.eachCell?.({ includeEmpty: true }, cell => {
                const cellLength = cell.value ? String(cell.value).length : 10;
                if (cellLength > maxLength) {
                    maxLength = cellLength;
                }
            });
            column.width = Math.min(maxLength + 2, 50);
        });
        return this;
    }
}
