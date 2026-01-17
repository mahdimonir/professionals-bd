import { ApiResponse } from '@/lib/types';
import { api } from './api';

export type ReportFormat = 'pdf' | 'excel' | 'json';
export type ReportType = 'my-bookings' | 'my-payments';

export interface ReportDownloadOptions {
    format: ReportFormat;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
}

export class ReportService {
    /**
     * Download bookings report
     */
    static async downloadBookingsReport(options: ReportDownloadOptions): Promise<void> {
        const params = new URLSearchParams({
            format: options.format,
            ...(options.startDate && { startDate: options.startDate }),
            ...(options.endDate && { endDate: options.endDate }),
        });

        const url = `/reports/me/bookings/download?${params}`;

        try {
            // Use api instance to get access token automatically
            const response = await api.get(url, { responseType: 'blob' });

            // Get filename from header or create default
            const contentDisposition = response.headers['content-disposition'];
            const extension = options.format === 'excel' ? 'xlsx' : options.format; // Map excel to xlsx
            let filename = `bookings-report.${extension}`;
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Download file
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading bookings report:', error);
            throw error;
        }
    }

    /**
     * Download payments report
     */
    static async downloadPaymentsReport(options: ReportDownloadOptions): Promise<void> {
        const params = new URLSearchParams({
            format: options.format,
            ...(options.startDate && { startDate: options.startDate }),
            ...(options.endDate && { endDate: options.endDate }),
        });

        const url = `/reports/me/payments/download?${params}`;

        try {
            // Use api instance to get access token automatically
            const response = await api.get(url, { responseType: 'blob' });

            // Get filename from header or create default
            const contentDisposition = response.headers['content-disposition'];
            const extension = options.format === 'excel' ? 'xlsx' : options.format; // Map excel to xlsx
            let filename = `payments-report.${extension}`;
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Download file
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading payments report:', error);
            throw error;
        }
    }

    /**
     * Get available reports for current user
     */
    static async getAvailableReports(): Promise<ApiResponse<string[]>> {
        const response = await api.get<ApiResponse<string[]>>('/reports/available');
        return response.data;
    }

    /**
     * Preview report data (JSON)
     */
    static async previewReport(type: ReportType): Promise<ApiResponse<any>> {
        const response = await api.get<ApiResponse<any>>(`/reports/${type}/preview`);
        return response.data;
    }
}
