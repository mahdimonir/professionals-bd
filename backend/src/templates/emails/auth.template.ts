import { emailBaseTemplate } from "./base.template.js";

export const registrationOTP = (name: string, otp: string) => emailBaseTemplate(
  `
    <h2>Welcome to Professionals BD, ${name}!</h2>
    <p>Thank you for signing up. Please verify your email with the code below:</p>
    <div class="otp">${otp}</div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
  `,
  "Verify Your Email - Professionals BD"
);

export const passwordResetOTP = (name: string, otp: string) => emailBaseTemplate(
  `
    <h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>You requested to reset your password. Use the code below:</p>
    <div class="otp">${otp}</div>
    <p>Valid for <strong>10 minutes</strong>.</p>
  `,
  "Reset Your Password - Professionals BD"
);