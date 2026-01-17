import { PaymentMethod } from "@prisma/client";
import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";

export class EarningsService {
    static async getEarnings(professionalId: string) {
        return prisma.earnings.findUnique({
            where: { professionalId },
        });
    }

    static async requestWithdraw(professionalId: string, amount: number, method: PaymentMethod) {
        const earnings = await prisma.earnings.findUnique({
            where: { professionalId },
        });

        if (!earnings || amount > earnings.pendingEarnings.toNumber()) {
            throw ApiError.badRequest("Insufficient earnings");
        }

        const withdraw = await prisma.withdrawRequest.create({
            data: {
                professionalId,
                amount,
                method,
                status: "PENDING",
            },
        });

        return withdraw;
    }

    static async getWithdrawHistory(professionalId: string) {
        return prisma.withdrawRequest.findMany({
            where: { professionalId },
            orderBy: { requestedAt: "desc" },
        });
    }
}