import { NextFunction, Request, Response } from "express";
import prisma from "../../config/client.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { InvoiceService } from "./invoice.service.js";
import { PaymentService } from "./payment.service.js";

export class PaymentController {
  // bKash Initiate
  static async initiateBkash(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId, payerNumber } = req.body;

      const result = await PaymentService.initiatePayment(bookingId, "BKASH", req.body.amount, { phone: payerNumber });

      res.json(ApiResponse.success(result, "bKash payment initiated"));
    } catch (error) {
      next(error);
    }
  }

  // SSLCommerz Initiate
  static async initiateSslCommerz(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId } = req.body;

      const result = await PaymentService.initiatePayment(bookingId, "SSL_COMMERZ", req.body.amount, req.body.payerInfo);

      res.json(ApiResponse.success(result, "SSLCommerz payment initiated"));
    } catch (error) {
      next(error);
    }
  }

  // Cash Initiate (manual)
  static async initiateCash(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId } = req.body;

      const result = await PaymentService.initiatePayment(bookingId, "CASH", req.body.amount, req.body.payerInfo);

      res.json(ApiResponse.success(result, "Cash payment registered"));
    } catch (error) {
      next(error);
    }
  }

  // bKash Webhook (callback)
  static async bkashWebhook(req: Request, res: Response) {
    try {
      await PaymentService.handleWebhook("BKASH", req.body);
      res.status(200).send("OK");
    } catch (error) {
      res.status(500).send("Error");
    }
  }

  static async bkashCallback(req: Request, res: Response) {
    try {
      const { paymentID, status, bookingId } = req.query;

      if (status === 'cancel' || status === 'failure') {
        let professionalId;
        if (bookingId) {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId as string },
            select: { professionalId: true }
          });
          professionalId = booking?.professionalId;
        }

        const redirectUrl = professionalId
          ? `${env.FRONTEND_URL}/professionals/${professionalId}?paymentStatus=${status}&bookingId=${bookingId}`
          : `${env.FRONTEND_URL}/profile?tab=bookings&paymentStatus=${status}`;

        return res.redirect(redirectUrl);
      }

      if (!paymentID) {
        return res.redirect(`${env.FRONTEND_URL}/profile?tab=bookings&error=invalid_payment_id`);
      }

      // Execute Payment
      const data = await PaymentService.executeBkash(paymentID as string);

      if (data && data.statusCode === '0000' && data.transactionStatus === 'Completed') {
        const payment = await PaymentService.handleWebhook("BKASH", {
          paymentID: data.paymentID,
          merchantInvoiceNumber: data.merchantInvoiceNumber,
          status: "Completed",
          trxID: data.trxID
        });

        if (payment) {
          return res.redirect(`${env.FRONTEND_URL}/professionals/${payment.booking.professionalId}?paymentStatus=success&bookingId=${payment.bookingId}&tranId=${data.trxID}&paymentId=${payment.id}`);
        }
      }

      throw new Error("Payment execution failed or invalid status");

    } catch (error) {
      console.error("bKash Callback Error:", error);
      const bookingId = req.query.bookingId;
      res.redirect(`${env.FRONTEND_URL}/profile?tab=bookings&error=payment_execution_failed&bookingId=${bookingId || ''}`);
    }
  }

  // SSLCommerz Callbacks
  static async sslSuccess(req: Request, res: Response) {
    try {
      let payment = await PaymentService.handleWebhook("SSL_COMMERZ", req.body);
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;
      const tranId = req.body.tran_id || "";

      let professionalId = payment?.booking?.professionalId;

      // Fallback: If webhook didn't return payment, find via bookingId
      if (!payment && bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { payment: true }
        });
        professionalId = booking?.professionalId;
        payment = booking?.payment as any;
      }

      const paymentId = payment?.id || "";

      if (professionalId) {
        res.redirect(`${frontendUrl}/professionals/${professionalId}?paymentStatus=success&bookingId=${bookingId}&tranId=${tranId}&paymentId=${paymentId}`);
      } else {
        // Fallback if professionalId STILL not found
        res.redirect(`${frontendUrl}/profile?tab=bookings`);
      }
    } catch (error) {
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;
      res.redirect(`${frontendUrl}/profile?tab=bookings&error=payment_failed&bookingId=${bookingId}`);
    }
  }

  static async sslFail(req: Request, res: Response) {
    try {
      let payment = await PaymentService.handleWebhook("SSL_COMMERZ", req.body);
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;

      let professionalId = payment?.booking?.professionalId;

      if (!payment && bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { payment: true }
        });
        professionalId = booking?.professionalId;
        payment = booking?.payment as any;
      }

      const paymentId = payment?.id || "";

      if (professionalId) {
        res.redirect(`${frontendUrl}/professionals/${professionalId}?paymentStatus=failed&bookingId=${bookingId}&paymentId=${paymentId}`);
      } else {
        res.redirect(`${frontendUrl}/profile?tab=bookings`);
      }
    } catch (error) {
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;
      res.redirect(`${frontendUrl}/profile?tab=bookings&error=payment_failed&bookingId=${bookingId}`);
    }
  }

  static async sslCancel(req: Request, res: Response) {
    try {
      let payment = await PaymentService.handleWebhook("SSL_COMMERZ", req.body);
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;

      let professionalId = payment?.booking?.professionalId;

      if (!payment && bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { payment: true }
        });
        professionalId = booking?.professionalId;
        payment = booking?.payment as any;
      }

      const paymentId = payment?.id || "";

      if (professionalId) {
        res.redirect(`${frontendUrl}/professionals/${professionalId}?paymentStatus=cancelled&bookingId=${bookingId}&paymentId=${paymentId}`);
      } else {
        res.redirect(`${frontendUrl}/profile?tab=bookings`);
      }
    } catch (error) {
      const frontendUrl = env.FRONTEND_URL;
      const bookingId = req.query.booking_id as string;
      res.redirect(`${frontendUrl}/profile?tab=bookings&error=payment_cancelled&bookingId=${bookingId}`);
    }
  }

  static async sslCallback(req: Request, res: Response) {
    // IPN (Instant Payment Notification) - background update
    await PaymentService.handleWebhook("SSL_COMMERZ", req.body);
    res.status(200).send("OK");
  }

  // Verify Payment Status
  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) throw ApiError.notFound("Payment not found");

      res.json(ApiResponse.success({
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        transactionId: payment.transactionId,
      }));
    } catch (error) {
      next(error);
    }
  }

  // Payment History
  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payments = await prisma.payment.findMany({
        where: {
          booking: {
            OR: [
              { userId },
              { professionalId: userId },
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        include: { booking: { select: { id: true, status: true } } },
      });

      res.json(ApiResponse.success(payments));
    } catch (error) {
      next(error);
    }
  }

  static async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const url = await InvoiceService.getInvoiceUrl(paymentId);
      res.json(ApiResponse.success({ invoiceUrl: url }));
    } catch (error) {
      next(error);
    }
  }
}