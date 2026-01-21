import { BookingStatus, PaymentStatus } from "@prisma/client";
import axios from "axios";
import prisma from "../../config/client.js";
import { env } from "../../config/env.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";

export class PaymentService {
    static async initiatePayment(
        bookingId: string,
        method: "BKASH" | "SSL_COMMERZ" | "CASH",
        amount: number,
        payerInfo: { phone?: string; name?: string; email?: string; address?: string }
    ) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                price: true,
                userId: true,
                createdAt: true,
                startTime: true,
                endTime: true,
                professionalId: true,
                status: true
            },
        });

        if (!booking) throw ApiError.notFound("Booking not found");
        if (!booking.price) throw ApiError.badRequest("Booking has no price");

        const totalAmount = booking.price.toNumber();
        if (amount != totalAmount) throw ApiError.badRequest("Amount mismatch");

        const now = Date.now();
        const creationTime = new Date(booking.createdAt).getTime();
        const isExpired = (now - creationTime) > 15 * 60 * 1000;

        if (booking.status === "PENDING" && isExpired) {
            const conflict = await prisma.booking.findFirst({
                where: {
                    professionalId: booking.professionalId,
                    id: { not: bookingId },
                    status: { not: "CANCELLED" },
                    AND: [
                        { startTime: { lt: booking.endTime }, endTime: { gt: booking.startTime } },
                        {
                            OR: [
                                { status: "CONFIRMED" },
                                { status: "COMPLETED" },
                                {
                                    status: "PENDING",
                                    createdAt: { gt: new Date(now - 15 * 60 * 1000) }
                                }
                            ]
                        }
                    ]
                }
            });

            if (conflict) {
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: "CANCELLED", cancellationReason: "Payment initiated after slot expiry and taken" }
                });
                throw ApiError.conflict("Time slot expired and was taken by another user. Please book a new slot.");
            }

            await prisma.booking.update({
                where: { id: bookingId },
                data: { createdAt: new Date() }
            });
        }

        let paymentResult: any;

        switch (method) {
            case "BKASH":
                paymentResult = await this.initiateBkash(totalAmount, bookingId, payerInfo.phone || "");
                break;

            case "SSL_COMMERZ":
                paymentResult = await this.initiateSslCommerz(totalAmount, bookingId, payerInfo);
                break;

            case "CASH":
                paymentResult = await this.initiateCash(totalAmount, bookingId, payerInfo);
                break;

            default:
                throw ApiError.badRequest("Unsupported payment method");
        }

        const payment = await prisma.payment.create({
            data: {
                bookingId,
                amount: totalAmount,
                currency: "BDT",
                method,
                transactionId: paymentResult.transactionId,
                paymentUrl: paymentResult.paymentUrl,
                payerNumber: payerInfo.phone,
                status: PaymentStatus.PENDING,
            },
        });

        await prisma.paymentLog.create({
            data: {
                paymentId: payment.id,
                action: "INITIATE",
                request: { amount: totalAmount, method, payerInfo },
                response: paymentResult,
            },
        });

        return {
            paymentId: payment.id,
            paymentUrl: paymentResult.paymentUrl,
            transactionId: paymentResult.transactionId,
            status: payment.status,
        };
    }

    private static async initiateBkash(amount: number, bookingId: string, payerReference: string) {
        const token = await this.getBkashToken();
        // Confirm token reception
        if (!token) {
            console.error("❌ bKash Token is missing or undefined!");
            throw new Error("Failed to retrieve bKash Token");
        }

        console.log("✅ bKash Token retrieved (first 10 chars):", token.substring(0, 10));

        // Check if BASE_URL already has /api/v1 to avoid duplication
        const baseUrl = env.BASE_URL?.endsWith('/api/v1')
            ? env.BASE_URL.replace('/api/v1', '')
            : env.BASE_URL;

        // Use a shorter invoice number: INV-{random5}-{timestamp}
        const shortId = Math.random().toString(36).substring(2, 7);
        const uniqueInvoiceNumber = `Inv${shortId}${Date.now().toString().slice(-6)}`;

        // FIXED: Use a valid Sandbox Wallet Number if the dummy is provided.
        // The dummy '01700000000' often triggers 403 Forbidden in Sandbox.
        const validPayerReference = (payerReference === "01700000000" || payerReference === "01770618575") ? "01929918378" : payerReference;

        const payload = {
            mode: "0011",
            amount: Number(amount).toFixed(2),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: uniqueInvoiceNumber,
            payerReference: validPayerReference,
            callbackURL: `${baseUrl}/api/v1/payments/bkash/callback?bookingId=${bookingId}`,
        };

        // CONSISTENT: Using Root sandbox URL for Creation
        // UPDATED: User's ref doc says /tokenized/checkout/create (no /payment segment)
        const createUrl = `https://tokenized.sandbox.bka.sh/tokenized/checkout/create`;

        console.log("Creating Payment at URL:", createUrl);
        console.log("Using Payer:", validPayerReference);

        try {
            const res = await axios.post(
                createUrl,
                payload,
                {
                    headers: {
                        Authorization: token, // Raw token
                        "x-app-key": env.BKASH_APP_KEY!,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status !== "Success") {
                throw ApiError.paymentFailed(res.data.errorMessage || "bKash payment failed");
            }

            return {
                paymentUrl: res.data.bkashURL,
                transactionId: res.data.paymentID,
            };
        } catch (error: any) {
            console.error("❌ bKash Create Payment FAILED. Status:", error.response?.status);
            console.error("Error Body:", JSON.stringify(error.response?.data));
            throw ApiError.paymentFailed(error.response?.data?.errorMessage || "bKash Payment Creation Failed");
        }
    }

    static async executeBkash(paymentID: string) {
        // We will fix this one too if initiate works
        const token = await this.getBkashToken();

        try {
            const res = await axios.post(
                `https://tokenized.sandbox.bka.sh/tokenized/checkout/payment/execute/${paymentID}`,
                {},
                {
                    headers: {
                        Authorization: token,
                        "X-APP-Key": env.BKASH_APP_KEY!,
                        "Content-Type": "application/json",
                    },
                }
            );

            return res.data;
        } catch (error: any) {
            throw ApiError.paymentFailed(error.response?.data?.errorMessage || "bKash Execution Failed");
        }
    }

    private static async getBkashToken() {
        // console.log("Requesting bKash Token from:", env.BKASH_BASE_URL);

        try {
            // EXPERIMENTAL: Use Root URL for Grant too, to match Create
            const grantUrl = `https://tokenized.sandbox.bka.sh/tokenized/checkout/token/grant`;
            console.log("Requesting Token from:", grantUrl);

            const res = await axios.post(
                grantUrl,
                { app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET },
                {
                    headers: {
                        "username": env.BKASH_USERNAME!,
                        "password": env.BKASH_PASSWORD!,
                        "Content-Type": "application/json"
                    },
                }
            );
            return res.data.id_token;
        } catch (error: any) {
            console.error("bKash Token Error Response:", error.response?.data);
            throw new Error(`bKash Token Failed: ${error.response?.status} - ${JSON.stringify(error.response?.data || error.message)}`);
        }
    }

    private static async initiateSslCommerz(amount: number, bookingId: string, payerInfo: any) {
        const store_id = env.SSL_STORE_ID!;
        const store_passwd = env.SSL_STORE_PASSWORD!;
        const is_sandbox = env.SSL_SANDBOX === "true";

        const baseUrl = is_sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";

        const uniqueTranId = `${bookingId}_${Date.now()}`;

        const sslData = new URLSearchParams();
        sslData.append("store_id", store_id);
        sslData.append("store_passwd", store_passwd);
        sslData.append("total_amount", amount.toString());
        sslData.append("currency", "BDT");
        sslData.append("tran_id", uniqueTranId);
        sslData.append("success_url", `${env.BASE_URL}/payments/sslcommerz/success?booking_id=${bookingId}`);
        sslData.append("fail_url", `${env.BASE_URL}/payments/sslcommerz/fail?booking_id=${bookingId}`);
        sslData.append("cancel_url", `${env.BASE_URL}/payments/sslcommerz/cancel?booking_id=${bookingId}`);
        sslData.append("ipn_url", `${env.BASE_URL}/payments/sslcommerz/callback`);
        sslData.append("cus_name", payerInfo.name || "Customer");
        sslData.append("cus_email", payerInfo.email || "customer@example.com");
        sslData.append("cus_add1", payerInfo.address || "Dhaka");
        sslData.append("cus_city", "Dhaka");
        sslData.append("cus_postcode", "1000");
        sslData.append("cus_country", "Bangladesh");
        sslData.append("cus_phone", payerInfo.phone || "01700000000");
        sslData.append("shipping_method", "NO");
        sslData.append("product_name", "Professional Consultation");
        sslData.append("product_category", "Service");
        sslData.append("product_profile", "non-physical-goods");

        const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
            method: "POST",
            body: sslData,
        });

        const result = await response.json();

        if (result.status !== "SUCCESS") {
            throw ApiError.paymentFailed(result.failedreason || "SSLCommerz session failed");
        }

        return {
            paymentUrl: result.GatewayPageURL,
            transactionId: uniqueTranId, // Use the one we generated to ensure it matches DB
        };
    }

    private static async initiateCash(amount: number, bookingId: string, payerInfo: any) {
        return {
            paymentUrl: null,
            transactionId: `CASH-${bookingId}-${Date.now()}`,
            instructions: "Pay cash to the professional on the day of service.",
        };
    }

    static async handleWebhook(method: "BKASH" | "SSL_COMMERZ", payload: any) {
        let transactionId: string;
        let status: PaymentStatus;

        if (method === "BKASH") {
            transactionId = payload.paymentID || payload.merchantInvoiceNumber;
            status = payload.status === "Completed" ? PaymentStatus.PAID : PaymentStatus.FAILED;
        } else { // SSL_COMMERZ
            transactionId = payload.tran_id;
            // Relaxed validation: SSLCommerz 'VALID' is standard, but some sandboxes use 'SUCCESS' or others.
            // Log payload status for debugging
            console.log(`Payment Webhook [${method}]: Payload Status = ${payload.status}`);
            const s = payload.status;
            status = (s === "VALID" || s === "SUCCESS" || s === "VALIDATED") ? PaymentStatus.PAID : PaymentStatus.FAILED;
        }

        let payment = await prisma.payment.findFirst({
            where: { transactionId },
            include: { booking: true }
        });

        // Fallback: If not found by transactionId, try to find by Booking ID (extract from tran_id)
        if (!payment && method === "SSL_COMMERZ" && transactionId.includes("_")) {
            const possibleBookingId = transactionId.split("_")[0];
            console.warn(`Payment not found by Transaction ID. Trying Booking ID: ${possibleBookingId}`);
            payment = await prisma.payment.findFirst({
                where: { bookingId: possibleBookingId },
                include: { booking: true }
            });
        }

        if (!payment) return null;

        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: { status },
            include: { booking: true }
        });

        if (status === PaymentStatus.PAID) {
            await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: BookingStatus.PAID },
            });

            try {
                const { generateInvoicePDF } = await import("./invoice.generator.js");
                const invoiceUrl = await generateInvoicePDF(payment.id);

                const booking = await prisma.booking.findUnique({
                    where: { id: payment.bookingId },
                    include: {
                        user: { select: { name: true, email: true } },
                        professional: { select: { name: true, email: true } }
                    },
                });

                if (booking) {
                    console.log(`[Payment] Invoice URL generated: ${invoiceUrl}`);
                    // 1. Send User Confirmation + Invoice
                    if (booking.user.email) {
                        await emailService.sendBookingConfirmation(
                            booking.user.email,
                            booking.user.name || "User",
                            booking.professional.name || "Professional",
                            booking.id,
                            new Date(booking.startTime).toISOString(),
                            new Date(booking.endTime).toISOString(),
                            payment.amount.toNumber(),
                            "PAID",
                            invoiceUrl
                        ).catch((error) => {
                            console.error("Failed to send booking confirmation email to user", error);
                        });
                    }

                    // 2. Send Professional Notification
                    if (booking.professional.email) {
                        await emailService.sendNewBookingNotification(
                            booking.professional.email,
                            booking.professional.name || "Professional",
                            booking.user.name || "Client",
                            booking.id,
                            new Date(booking.startTime).toISOString(),
                            new Date(booking.endTime).toISOString(),
                            payment.amount.toNumber()
                        ).catch((error) => {
                            console.error("Failed to send booking notification email to professional", error);
                        });
                    }
                }
            } catch (error) {
                console.error("Error in post-payment processing (invoice/email):", error);
            }
        }

        await prisma.paymentLog.create({
            data: {
                paymentId: payment.id,
                action: "WEBHOOK",
                request: payload,
                response: { status, transactionId },
            },
        });

        return updatedPayment;
    }
}