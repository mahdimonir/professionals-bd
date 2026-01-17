import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { paymentLimiter } from "../../middleware/rateLimit.middleware.js";
import { PaymentController } from "./payment.controller.js";

const router = Router();

// Webhooks
router.get("/bkash/callback", PaymentController.bkashCallback);
router.post("/webhook/bkash", PaymentController.bkashWebhook);
router.post("/sslcommerz/success", PaymentController.sslSuccess);
router.post("/sslcommerz/fail", PaymentController.sslFail);
router.post("/sslcommerz/cancel", PaymentController.sslCancel);
router.post("/sslcommerz/callback", PaymentController.sslCallback); // IPN

// Authenticated routes
router.use(authenticate);
router.use(paymentLimiter);

// Initiate payments
router.post("/initiate/bkash", PaymentController.initiateBkash);
router.post("/initiate/sslcommerz", PaymentController.initiateSslCommerz);
router.post("/initiate/cash", PaymentController.initiateCash);

// Verify & History
router.get("/verify/:paymentId", PaymentController.verifyPayment);
router.get("/history", PaymentController.getPaymentHistory);

router.get("/invoice/:paymentId", authenticate, PaymentController.getInvoice);

export const paymentRoutes = router;