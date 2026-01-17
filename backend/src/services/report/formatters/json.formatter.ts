export interface JSONReportConfig {
    title: string;
    type: string;
    dateRange?: { start: Date; end: Date };
    generatedBy?: string;
}

export interface JSONReportOutput {
    meta: {
        title: string;
        type: string;
        generatedAt: string;
        generatedBy?: string;
        dateRange?: {
            start: string;
            end: string;
        };
        totalRecords: number;
    };
    summary?: Record<string, any>;
    data: any[];
}

export class JSONFormatter {
    private config: JSONReportConfig;
    private summary: Record<string, any> = {};
    private data: any[] = [];

    constructor(config: JSONReportConfig) {
        this.config = config;
    }

    // Add summary stats
    addSummary(stats: Record<string, any>): this {
        this.summary = { ...this.summary, ...stats };
        return this;
    }

    // Add data array
    addData(data: any[]): this {
        this.data = data;
        return this;
    }

    // Get formatted JSON output
    toJSON(): JSONReportOutput {
        const { title, type, dateRange, generatedBy } = this.config;

        return {
            meta: {
                title,
                type,
                generatedAt: new Date().toISOString(),
                generatedBy,
                dateRange: dateRange ? {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                } : undefined,
                totalRecords: this.data.length,
            },
            summary: Object.keys(this.summary).length > 0 ? this.summary : undefined,
            data: this.data,
        };
    }

    // Get as string
    toString(pretty: boolean = true): string {
        return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0);
    }

    // Get as buffer
    toBuffer(): Buffer {
        return Buffer.from(this.toString());
    }
}
