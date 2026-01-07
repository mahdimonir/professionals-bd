import { emailBaseTemplate } from "./base.template.js";

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);
};

export const bookingConfirmation = (
  userName: string,
  professionalName: string,
  bookingId: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  status: string
) => emailBaseTemplate(
  `
    <h2>Booking Confirmed!</h2>
    <p>Dear ${userName},</p>
    <p>Your consultation with <strong>${professionalName}</strong> has been successfully booked.</p>

    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Booking Details</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Professional:</strong> ${professionalName}</p>
      <p><strong>Date & Time:</strong><br>
         ${formatDate(startDate)}<br>
         to ${formatDate(endDate)}
      </p>
      <p><strong>Total Amount:</strong> ${formatPrice(totalPrice)}</p>
      <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${status}</span></p>
    </div>

    <p>You will receive a meeting link via email 15 minutes before the session starts.</p>
    <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
  `,
  "Your Booking Confirmation - Professionals BD"
);

export const bookingStatusUpdate = (
  userName: string,
  professionalName: string,
  bookingId: string,
  status: string,
  message?: string
) => {
  const statusColor: Record<string, string> = {
    CONFIRMED: "#28a745",
    PAID: "#007bff",
    COMPLETED: "#17a2b8",
    CANCELLED: "#dc3545",
    REFUNDED: "#fd7e14",
  };

  const statusText: Record<string, string> = {
    CONFIRMED: "Your booking has been confirmed by the professional.",
    PAID: "Payment successful! Your booking is now confirmed.",
    COMPLETED: "The consultation has been completed.",
    CANCELLED: "This booking has been cancelled.",
    REFUNDED: "This booking has been refunded.",
  };

  return emailBaseTemplate(
    `
      <h2>Booking Update</h2>
      <p>Dear ${userName},</p>
      <p>${statusText[status] || "Your booking status has changed."}</p>

      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Professional:</strong> ${professionalName}</p>
        <p><strong>New Status:</strong> 
          <span style="color: ${statusColor[status] || "#6c757d"}; font-weight: bold;">${status}</span>
        </p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
      </div>

      <p>Thank you for using Professionals BD.</p>
    `,
    `Booking ${status} - Professionals BD`
  );
};