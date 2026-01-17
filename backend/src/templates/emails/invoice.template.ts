export const invoiceEmail = (userName: string, invoiceUrl: string, amount: number, bookingId: string) => `
  <h2>Invoice for Your Consultation</h2>
  <p>Dear ${userName},</p>
  <p>Thank you for your payment! Your consultation booking (${bookingId}) is now confirmed.</p>
  
  <p><strong>Total Amount:</strong> ${amount.toFixed(2)} BDT</p>
  <p><strong>Invoice PDF:</strong> <a href="${invoiceUrl}" style="color:#0066cc; text-decoration:none;">Download Invoice</a></p>
  
  <p>You can also view it anytime in your dashboard.</p>
  <p>Best regards,<br>ProfessionalsBD Team</p>
`;