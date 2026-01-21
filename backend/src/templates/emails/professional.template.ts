import { emailBaseTemplate } from "./base.template.js";

export const professionalApplicationReceived = (name: string) => {
    const content = `
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: #2563eb;">Application Received</h2>
        <p>Dear ${name},</p>
        <p>Thank you for applying to become a professional on Professionals BD.</p>
        <p>We have received your application and it is currently under review by our moderation team.</p>
        <p>You will be notified via email once your profile status changes.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDING REVIEW</span></p>
        </div>
        <p>If you have any questions, please contact support.</p>
    </div>
    `;
    return emailBaseTemplate(content, "Application Received - Professionals BD");
};
