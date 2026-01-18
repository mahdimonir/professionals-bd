import { emailBaseTemplate } from "./base.template.js";

export const accountStatusUpdate = (name: string, status: "BANNED" | "ACTIVE", reason?: string) => {
    const title = status === "BANNED" ? "Account Suspended" : "Account Restored";
    const color = status === "BANNED" ? "#ef4444" : "#22c55e";
    const message = status === "BANNED"
        ? `We regret to inform you that your account has been suspended due to a violation of our terms of service.${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ""}`
        : `We are pleased to inform you that your account has been restored. You can now log in and use our services.`;

    const content = `
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: ${color};">${title}</h2>
        <p>Dear ${name},</p>
        <p>${message}</p>
        <p>If you have any questions, please contact support.</p>
    </div>
    `;
    return emailBaseTemplate(content, title);
};

export const professionalStatusUpdate = (name: string, status: "VERIFIED" | "APPROVED" | "REJECTED", reason?: string) => {
    let title = "";
    let color = "#3b82f6";
    let message = "";

    switch (status) {
        case "VERIFIED":
            title = "Profile Verified";
            color = "#3b82f6";
            message = "Your professional profile has been verified by our moderators. It is now awaiting final approval from the admin.";
            break;
        case "APPROVED":
            title = "Profile Approved";
            color = "#22c55e";
            message = "Congratulations! Your professional profile has been fully approved. You are now live on Professionals BD.";
            break;
        case "REJECTED":
            title = "Profile Rejected";
            color = "#ef4444";
            message = `We regret to inform you that your professional profile application has been rejected.${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ""}`;
            break;
    }

    const content = `
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: ${color};">${title}</h2>
        <p>Dear ${name},</p>
        <p>${message}</p>
        <p>You can check your dashboard for more details.</p>
    </div>
    `;
    return emailBaseTemplate(content, title);
};

export const withdrawStatusUpdate = (name: string, amount: number, status: "PROCESSED" | "REJECTED", reason?: string) => {
    const title = status === "PROCESSED" ? "Withdrawal Approved" : "Withdrawal Rejected";
    const color = status === "PROCESSED" ? "#22c55e" : "#ef4444";
    const message = status === "PROCESSED"
        ? `Your withdrawal request for <strong>${amount} BDT</strong> has been processed successfully.`
        : `Your withdrawal request for <strong>${amount} BDT</strong> has been rejected.${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ""}`;

    const content = `
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: ${color};">${title}</h2>
        <p>Dear ${name},</p>
        <p>${message}</p>
    </div>
    `;
    return emailBaseTemplate(content, title);
};
