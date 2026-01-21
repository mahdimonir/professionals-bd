import { emailBaseTemplate } from "./base.template.js";

/**
 * Email sent to admin when a new dispute is raised
 */
export const disputeRaisedAdmin = (
  bookingId: string,
  disputeId: string,
  userName: string,
  professionalName: string,
  description: string
) =>
  emailBaseTemplate(
    `
      <h2 style="color: #dc3545;">⚠️ New Dispute Raised</h2>
      <p>Dear Admin,</p>
      <p>A new dispute has been raised on the platform and requires your attention.</p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Dispute Details</h3>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Complainant:</strong> ${userName}</p>
        <p><strong>Professional:</strong> ${professionalName}</p>
        <p><strong>Description:</strong></p>
        <p style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">${description}</p>
      </div>

      <p>Please review and resolve this dispute as soon as possible.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || "https://professionalsbd.com"}/admin/disputes/${disputeId}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          View Dispute
        </a>
      </p>
    `,
    "⚠️ New Dispute Raised - Action Required"
  );

/**
 * Email sent to the other party (professional or user) when a dispute is raised
 */
export const disputeNotificationUser = (
  userName: string,
  bookingId: string,
  disputeId: string,
  message: string
) =>
  emailBaseTemplate(
    `
      <h2 style="color: #ffc107;">Dispute Notification</h2>
      <p>Dear ${userName},</p>
      <p>${message}</p>

      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
      </div>

      <p>Our support team will review this dispute and reach out to both parties if needed.</p>
      <p>If you have any questions or would like to provide additional information, please contact our support team.</p>

      <p>
        <a href="${process.env.FRONTEND_URL || "https://professionalsbd.com"}/disputes" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          View My Disputes
        </a>
      </p>
    `,
    "Dispute Notification - Professionals BD"
  );

/**
 * Email sent to complainant when dispute is resolved
 */
export const disputeResolved = (
  userName: string,
  bookingId: string,
  disputeId: string,
  status: "approved" | "rejected",
  refundAmount?: number,
  note?: string
) => {
  const isApproved = status === "approved";
  const statusColor = isApproved ? "#28a745" : "#dc3545";
  const statusText = isApproved ? "✅ Approved" : "❌ Rejected";

  return emailBaseTemplate(
    `
      <h2 style="color: ${statusColor};">Dispute ${isApproved ? "Resolved" : "Closed"}</h2>
      <p>Dear ${userName},</p>
      <p>Your dispute has been reviewed by our team.</p>

      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Resolution Details</h3>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${isApproved && refundAmount
      ? `<p><strong>Refund Amount:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">৳${refundAmount.toLocaleString("en-BD")}</span></p>`
      : ""
    }
        ${note ? `<p><strong>Admin Note:</strong></p><p style="background-color: white; padding: 15px; border-radius: 5px;">${note}</p>` : ""}
      </div>

      ${isApproved && refundAmount
      ? `
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>✓ Your refund of ৳${refundAmount.toLocaleString("en-BD")} will be processed within 3-5 business days.</strong>
          </p>
        </div>
      `
      : ""
    }

      <p>If you have any questions about this decision, please don't hesitate to contact our support team.</p>
      <p>Thank you for your patience and for using Professionals BD.</p>
    `,
    `Dispute ${isApproved ? "Approved" : "Closed"} - Professionals BD`
  );
};

/**
 * Email sent to professional when dispute is resolved
 */
export const disputeResolvedProfessional = (
  professionalName: string,
  bookingId: string,
  disputeId: string,
  status: "approved" | "rejected",
  note?: string
) => {
  const isApproved = status === "approved";
  const statusColor = isApproved ? "#28a745" : "#dc3545";
  const statusText = isApproved ? "Approved (Refunded)" : "Rejected";

  return emailBaseTemplate(
    `
      <h2 style="color: ${statusColor};">Dispute Update</h2>
      <p>Dear ${professionalName},</p>
      <p>A dispute on your booking has been ${isApproved ? "resolved in favor of the client" : "closed"}.</p>

      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Details</h3>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Resolution:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${note ? `<p><strong>Admin Note:</strong></p><p style="background-color: white; padding: 15px; border-radius: 5px;">${note}</p>` : ""}
      </div>

      ${isApproved
      ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Note:</strong> The client has been refunded. This may affect your earnings for this booking.
          </p>
        </div>
      `
      : `
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>Good news!</strong> The dispute was resolved in your favor. Your earnings remain unchanged.
          </p>
        </div>
      `
    }

      <p>Thank you for maintaining high standards of service on Professionals BD.</p>
    `,
    `Dispute ${isApproved ? "Resolved" : "Closed"} - Professionals BD`
  );
};
