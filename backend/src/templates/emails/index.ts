import { accountStatusUpdate, professionalStatusUpdate, withdrawStatusUpdate } from "./admin.template.js";
import { passwordResetOTP, registrationOTP } from "./auth.template.js";
import { emailBaseTemplate } from "./base.template.js";
import { bookingConfirmation, bookingStatusUpdate, newBookingNotification } from "./booking.template.js";
import {
    disputeNotificationUser,
    disputeRaisedAdmin,
    disputeResolved,
    disputeResolvedProfessional
} from "./dispute.template.js";


import { invoiceEmail } from "./invoice.template.js";
import { professionalApplicationReceived } from "./professional.template.js";

export {
    accountStatusUpdate,
    bookingConfirmation,
    bookingStatusUpdate, disputeNotificationUser,
    disputeRaisedAdmin,
    disputeResolved,
    disputeResolvedProfessional,
    emailBaseTemplate,
    invoiceEmail, newBookingNotification, passwordResetOTP,
    professionalApplicationReceived,
    professionalStatusUpdate,
    registrationOTP,
    withdrawStatusUpdate
};

