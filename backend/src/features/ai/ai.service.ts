import { GoogleGenAI, Type } from "@google/genai";
import prisma from "../../config/client.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";

const ai = env.GOOGLE_AI_API_KEY
    ? new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY })
    : null;

export class AIService {
    /**
     * Security: READ-ONLY database access
     * AI can only SELECT data, never INSERT/UPDATE/DELETE user data
     */

    // Check if AI feature is enabled
    static async checkFeatureEnabled(featureName: string): Promise<boolean> {
        const feature = await prisma.aIFeature.findUnique({
            where: { featureName },
        });
        return feature?.enabled || false;
    }

    // Extract keywords from user query
    private static extractKeywords(query: string): string[] {
        const lowercaseQuery = query.toLowerCase();
        const keywords = lowercaseQuery
            .split(/\s+/)
            .filter((word) => word.length > 3);
        return keywords;
    }

    // Detect query intent
    private static isBookingQuery(keywords: string[]): boolean {
        const bookingKeywords = [
            "booking", "appointment", "schedule", "meeting",
            "consultation", "book", "reserve", "upcoming",
            "past", "cancel", "reschedule", "sessions"
        ];
        return keywords.some((kw) => bookingKeywords.includes(kw));
    }

    private static isProfessionalSearchQuery(keywords: string[]): boolean {
        const searchKeywords = [
            "find", "search", "looking", "need", "want",
            "lawyer", "legal", "doctor", "medical", "consultant",
            "financial", "accountant", "professional", "expert",
            "specialist", "advisor", "there", "have",
            "suggest", "recommend", "show", "list",
            "available", "find", "browse", "view"
        ];
        return keywords.some((kw) => searchKeywords.includes(kw));
    }

    private static isEarningsQuery(keywords: string[]): boolean {
        const earningsKeywords = [
            "earning", "earnings", "income", "payment", "withdraw",
            "money", "balance", "paid", "revenue", "commission"
        ];
        return keywords.some((kw) => earningsKeywords.includes(kw));
    }

    // Gather relevant database context (READ-ONLY)
    private static async gatherContext(
        query: string,
        userId: string
    ): Promise<any> {
        const keywords = this.extractKeywords(query);
        const context: any = {};

        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                role: true,
                professionalProfile: {
                    select: {
                        title: true,
                        specialties: true,
                        status: true,
                    },
                },
            },
        });
        context.user = user;

        // Booking-related queries
        if (this.isBookingQuery(keywords)) {
            const bookings = await prisma.booking.findMany({
                where: {
                    OR: [{ userId }, { professionalId: userId }],
                    status: { not: "CANCELLED" },
                },
                take: 10,
                orderBy: { startTime: "desc" },
                include: {
                    user: { select: { name: true } },
                    professional: { select: { name: true } },
                },
            });
            context.bookings = bookings;
        }

        // Professional search queries
        if (this.isProfessionalSearchQuery(keywords)) {
            const professionals = await prisma.professionalProfile.findMany({
                where: {
                    status: "APPROVED",
                },
                take: 5,
                include: {
                    user: {
                        select: { name: true, location: true, avatar: true },
                    },
                },
            });
            context.professionals = professionals;
        }

        // Earnings queries (for professionals only)
        if (
            this.isEarningsQuery(keywords) &&
            user?.role === "PROFESSIONAL"
        ) {
            const earnings = await prisma.earnings.findUnique({
                where: { professionalId: userId },
            });
            context.earnings = earnings;
        }

        return context;
    }

    // Main AI query with database context
    static async queryWithContext(query: string, userId?: string): Promise<string> {
        if (!ai) {
            throw ApiError.internal("AI service is not configured");
        }

        // Gather context only if user is authenticated
        const context = userId ? await this.gatherContext(query, userId) : {};

        const systemInstruction = `You are ProBD AI Assistant for ProfessionalsBD, Bangladesh's premier expert network connecting clients with Legal, Financial, and Medical professionals.

${userId ? `The user is logged in (ID: ${userId}).` : 'The user is browsing as a guest.'}

**Your Role**: Provide direct, helpful answers with actionable guidance using the database information below.

**CRITICAL INSTRUCTIONS**:
1. **ALWAYS check context.bookings, context.professionals, context.earnings first**
2. **Give DIRECT answers** - if array is empty, say "You have no bookings" not "I don't have that info"
3. **Use actual data** - Provide specific details from context (names, dates, amounts)
4. **Format nicely** - Use markdown: **bold**, *italic*, bullet lists, numbered steps
5. **Use BDT (৳)** for money, format dates as "Jan 15, 2026"
6. **User role does NOT affect search** - Anyone can search professionals
7. **For the user**: ${context.user?.name} (${context.user?.role})

**PLATFORM KNOWLEDGE - Use this to help users**:

**🔍 How to Find & Book Professionals:**
1. Browse professionals by category (Legal, Medical, Financial)
2. Filter by specialty, location, rate, experience
3. Click professional's profile → View details
4. Click "Book Consultation" → Select date/time
5. Confirm booking → Pay via payment gateway

**💳 Payment Methods:**
- SSLCommerz (Credit/Debit cards, Mobile Banking, Online Payment)
- bKash Mobile Banking
All payments are secure and processed instantly.

**📅 Booking Process:**
- Select professional → Choose time slot
- Confirm booking details
- Pay securely
- Receive confirmation email
- Join video meeting at scheduled time (via profile → booking)

**📞 Contact & Support:**
- **For Clients**: Contact admin via platform dashboard
- **For Booking Issues**: Go to "My Bookings" → View booking → "Report Issue"
- **For Disputes**: Bookings page → Select booking → "File Dispute"
- **For Professional Applications**: Apply via "Become a Professional" page
- **Technical Support**: Available in-platform messaging

**⚖️ Disputes & Complaints:**
1. Go to your booking
2. Click "File Dispute" (available if payment made)
3. Describe the issue
4. Submit evidence if any
5. Admin will review within 2-3 business days
6. Resolution: Refund or mediation

**💰 For Professionals:**
- **Earnings**: View in "Earnings" dashboard
- **Withdraw**: Minimum ৳1,000, processed in 3-5 days
- **Platform Fee**: Commission deducted automatically
- **Update Availability**: Profile settings → Availability tab

**📱 Video Meetings:**
- Accessible from "My Bookings" → Click "Join Meeting"
- Works on desktop & mobile browsers
- No app download required
- Test connection before meeting time

**DATABASE CONTEXT (Real data from platform)**:
${JSON.stringify(context, null, 2)}

**Response Guidelines**:
✅ If bookings array empty → "You have no bookings. Browse professionals to book your first consultation!"
✅ If found professionals → List with details + "Click their profile to book"
✅ If asking how to book → Give step-by-step process above
✅ If asking about payment → List payment methods above
✅ If asking about disputes → Explain dispute process above
✅ If asking about contact → Provide relevant contact method above
✅ Always end with helpful next step or question

❌ Never say "I don't have that information" if context has the data
❌ Don't mention user role when searching professionals

Now answer helpfully with actionable guidance:`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemInstruction}\n\nUser Query: ${query}` }],
                    },
                ],
            });

            const aiResponse = response.text || "";

            // Log this interaction to chat history (only for authenticated users)
            if (userId) {
                await prisma.aIChatHistory.create({
                    data: {
                        userId,
                        query,
                        response: aiResponse,
                        contextType: Object.keys(context).join(",") || "general",
                    },
                });
            }

            return aiResponse;
        } catch (error: any) {
            console.error("AI query error:", error);
            throw ApiError.internal("Failed to process AI query");
        }
    }

    // Detect context type for logging
    private static detectContextType(context: any): string {
        if (context.bookings) return "booking";
        if (context.professionals) return "search";
        if (context.earnings) return "earnings";
        return "general";
    }

    // Smart natural language search
    static async smartSearch(query: string) {
        if (!ai) {
            throw ApiError.internal("AI service is not configured");
        }

        const extractionPrompt = `Extract search parameters from this query for searching professionals:

Query: "${query}"

Extract and return a JSON object with these fields (set to null if not mentioned):
- category: string or null (Legal, Medical, Financial, etc.)
- specialties: string[] or null
- location: string or null  
- minRate: number or null (in BDT)
- maxRate: number or null (in BDT)
- languages: string[] or null
- minExperience: number or null (in years)`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, nullable: true },
                            specialties: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                            location: { type: Type.STRING, nullable: true },
                            minRate: { type: Type.NUMBER, nullable: true },
                            maxRate: { type: Type.NUMBER, nullable: true },
                            languages: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                            minExperience: { type: Type.NUMBER, nullable: true },
                        },
                    },
                },
            });

            const searchParams = JSON.parse(response.text || "{}");

            // Build Prisma where clause (READ-ONLY query)
            const where: any = {
                status: "APPROVED",
            };

            if (searchParams.category) {
                where.category = searchParams.category;
            }

            if (searchParams.specialties && searchParams.specialties.length > 0) {
                where.specialties = { hasSome: searchParams.specialties };
            }

            if (searchParams.minRate !== null || searchParams.maxRate !== null) {
                where.sessionPrice = {};
                if (searchParams.minRate !== null) {
                    where.sessionPrice.gte = searchParams.minRate;
                }
                if (searchParams.maxRate !== null) {
                    where.sessionPrice.lte = searchParams.maxRate;
                }
            }

            if (searchParams.minExperience !== null) {
                where.experience = { gte: searchParams.minExperience };
            }

            if (searchParams.languages && searchParams.languages.length > 0) {
                where.languages = { hasSome: searchParams.languages };
            }

            if (searchParams.location) {
                where.user = {
                    location: { contains: searchParams.location, mode: "insensitive" },
                };
            }

            // Execute READ-ONLY search
            const professionals = await prisma.professionalProfile.findMany({
                where,
                take: 10,
                include: {
                    user: {
                        select: {
                            name: true,
                            avatar: true,
                            location: true,
                        },
                    },
                },
            });

            return { professionals, searchParams };
        } catch (error: any) {
            console.error("Smart search error:", error);
            throw ApiError.internal("Failed to process smart search");
        }
    }

    // Get AI chat history for user
    static async getChatHistory(userId: string, limit: number = 20) {
        return prisma.aIChatHistory.findMany({
            where: { userId },
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }
}
