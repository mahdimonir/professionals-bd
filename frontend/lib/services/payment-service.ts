import { ApiResponse } from '@/lib/types';
import { api } from './api';

export enum PaymentMethod {
    BKASH = 'BKASH',
    SSL_COMMERZ = 'SSL_COMMERZ',
    CASH = 'CASH',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export interface Payment {
    id: string;
    bookingId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paymentUrl?: string;
    bkashURL?: string;
    createdAt: string;
}

export interface PaymentInitiateResult {
    paymentId: string;
    paymentUrl: string;
    transactionId?: string;
    status: string;
}

export interface PaymentInitiateResponse {
    payment: Payment;
    paymentUrl?: string; // Legacy
    bkashURL?: string;   // Legacy
}

export class PaymentService {
    // Initiate bKash payment
    // Initiate bKash payment
    static async initiateBkash(bookingId: string, amount: number, payerNumber?: string) {
        const response = await api.post<ApiResponse<PaymentInitiateResult>>('/payments/initiate/bkash', {
            bookingId,
            amount,
            payerNumber,
        });
        return response.data;
    }

    // Initiate SSLCommerz payment
    static async initiateSslCommerz(bookingId: string, amount: number, payerInfo?: any) {
        const response = await api.post<ApiResponse<PaymentInitiateResult>>('/payments/initiate/sslcommerz', {
            bookingId,
            amount,
            payerInfo
        });
        return response.data;
    }

    // Initiate Cash payment (on-site)
    static async initiateCash(bookingId: string, amount: number) {
        const response = await api.post<ApiResponse<PaymentInitiateResponse>>('/payments/initiate/cash', {
            bookingId,
            amount
        });
        return response.data;
    }

    // Verify payment status
    static async verifyPayment(paymentId: string) {
        const response = await api.get<ApiResponse<Payment>>(`/payments/verify/${paymentId}`);
        return response.data;
    }

    // Get payment history for current user
    static async getPaymentHistory() {
        const response = await api.get<ApiResponse<Payment[]>>('/payments/history');
        return response.data;
    }

    // Get invoice for a payment
    static async getInvoice(paymentId: string) {
        const response = await api.get<ApiResponse<any>>(`/payments/invoice/${paymentId}`);
        return response.data;
    }

    /**
     * Download Invoice PDF
     * This handles the blob fetching and browser download trigger
     */
    static async downloadInvoicePDF(paymentId: string): Promise<boolean> {
        const res = await this.getInvoice(paymentId);

        if (!res.success || !res.data.invoiceUrl) {
            return false;
        }

        try {
            const response = await fetch(res.data.invoiceUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `invoice_${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return true;
        } catch (error) {
            // Fallback: Open in new window
            window.open(res.data.invoiceUrl, "_blank");
            return true;
        }
    }
}
