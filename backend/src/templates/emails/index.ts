import { passwordResetOTP, registrationOTP } from "./auth.template.js";
import { emailBaseTemplate } from "./base.template.js";
import { bookingConfirmation, bookingStatusUpdate } from "./booking.template.js";
import {
    disputeNotificationUser,
    disputeRaisedAdmin,
    disputeResolved,
    disputeResolvedProfessional
} from "./dispute.template.js";


export {
    bookingConfirmation,
    bookingStatusUpdate,
    disputeNotificationUser,
    disputeRaisedAdmin,
    disputeResolved,
    disputeResolvedProfessional,
    emailBaseTemplate,
    passwordResetOTP,
    registrationOTP
};

