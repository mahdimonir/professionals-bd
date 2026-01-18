import { ApplicationStatus } from "@prisma/client";
import prisma from "../../config/client.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";
import { deleteFromCloudinary, getPublicIdFromUrl } from "../../utils/cloudinary.utils.js";

export class ProfessionalService {
  static async submitApplication(
    userId: string,
    data: {
      title: string;
      bio?: string;
      category?: string;
      specialties: string[];
      sessionPrice: number;
      experience: number;
      languages: string[];
      linkedinUrl?: string;
      cvUrl?: string;
      education?: { name: string; doc?: string }[];
      certifications?: { name: string; doc?: string }[];
      availability?: any;
    }
  ) {
    const existing = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (existing?.certifications) {
      // Parse old certs to find URLs to delete
      const oldDocs = existing.certifications.map(c => {
        try { return JSON.parse(c); } catch (e) { return { doc: c } } // Fallback for old string URLs
      });

      const newDocs = data.certifications || [];
      const newUrls = newDocs.map(d => d.doc).filter(Boolean);

      const removedDocs = oldDocs.filter((od: any) => od.doc && !newUrls.includes(od.doc));

      for (const d of removedDocs) {
        const publicId = getPublicIdFromUrl(d.doc);
        if (publicId) await deleteFromCloudinary(publicId);
      }
    }

    const educationStrings = data.education?.map(e => JSON.stringify(e)) || [];
    const certificationStrings = data.certifications?.map(c => JSON.stringify(c)) || [];

    // Prepare data for Prisma (exclude raw arrays, use string arrays)
    const prismaData = {
      ...data,
      education: educationStrings,
      certifications: certificationStrings
    };

    const profile = await prisma.professionalProfile.upsert({
      where: { userId },
      update: {
        ...prismaData,
        status: ApplicationStatus.PENDING,
        rejectionReason: null,
      },
      create: {
        userId,
        ...prismaData,
        status: ApplicationStatus.PENDING,
      },
    });

    // Notify user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await emailService.sendProfessionalApplicationReceived(user.email, user.name || "User");
    }

    return profile;
  }

  static async updateProfile(
    userId: string,
    data: {
      title?: string;
      bio?: string;
      specialties?: string[];
      sessionPrice?: number;
      experience?: number;
      languages?: string[];
      linkedinUrl?: string;
      cvUrl?: string;
      education?: string[];
      certifications?: string[];
      availability?: any;
    }
  ) {
    const existing = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw ApiError.notFound("Professional profile not found. Please submit an application first.");
    }

    const CRITICAL_FIELDS: Array<keyof typeof data> = ['title', 'specialties', 'certifications', 'sessionPrice', 'cvUrl', 'experience', 'education'];
    const NON_CRITICAL_FIELDS: Array<keyof typeof data> = ['languages', 'bio', 'linkedinUrl', 'availability'];

    const criticalChanges: any = {};
    const immediateUpdates: any = {};
    let hasCriticalChanges = false;

    for (const field of CRITICAL_FIELDS) {
      if (data[field] !== undefined) {
        let val = data[field];
        // Serialize document arrays
        if (field === 'education' || field === 'certifications') {
          val = (val as any[]).map(v => JSON.stringify(v));
        }

        if (JSON.stringify(val) !== JSON.stringify(existing[field as keyof typeof existing])) {
          criticalChanges[field] = val;
          hasCriticalChanges = true;
        }
      }
    }

    for (const field of NON_CRITICAL_FIELDS) {
      if (data[field] !== undefined) {
        immediateUpdates[field] = data[field];
      }
    }

    if (criticalChanges.certifications) {
    }

    const updateData: any = { ...immediateUpdates };
    if (hasCriticalChanges && existing.status === ApplicationStatus.APPROVED) {
      const existingPending = (existing.pendingChanges as any) || {};
      updateData.pendingChanges = { ...existingPending, ...criticalChanges };
    } else if (hasCriticalChanges) {
      Object.assign(updateData, criticalChanges);
      if (existing.status !== ApplicationStatus.PENDING) {
        updateData.status = ApplicationStatus.PENDING;
        updateData.rejectionReason = null;
      }
    }

    const profile = await prisma.professionalProfile.update({
      where: { userId },
      data: updateData,
    });

    return {
      profile,
      hasPendingChanges: hasCriticalChanges && existing.status === ApplicationStatus.APPROVED,
      pendingChanges: hasCriticalChanges && existing.status === ApplicationStatus.APPROVED ? criticalChanges : null,
      message: hasCriticalChanges && existing.status === ApplicationStatus.APPROVED
        ? "Update successful. Critical changes (e.g. pricing, title) have been submitted for authority review and will be applied upon approval."
        : "Profile updated successfully.",
    };
  }

  static async getAllProfessionals(
    page: number = 1,
    limit: number = 20,
    search?: string,
    category?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = { status: ApplicationStatus.APPROVED };

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { specialties: { hasSome: [search] } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (category && category.trim()) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [profiles, total] = await Promise.all([
      prisma.professionalProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sessionPrice: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              location: true,
            },
          },
        },
      }),
      prisma.professionalProfile.count({ where }),
    ]);

    return {
      professionals: profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getProfessionalProfile(userId: string) {
    const profile = await prisma.professionalProfile.findFirst({
      where: {
        userId,
        status: ApplicationStatus.APPROVED
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            location: true,
            timezone: true,
            lastLoginAt: true,
            professionalBookings: {
              where: { review: { isNot: null } },
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                review: true,
                user: {
                  select: { name: true, avatar: true }
                }
              }
            }
          },
        },
      },
    });

    if (!profile) throw ApiError.notFound("Professional profile not found or not approved");

    const reviews = profile.user.professionalBookings.map(b => ({
      id: b.review!.id,
      rating: b.review!.rating,
      comment: b.review!.comment,
      createdAt: b.review!.createdAt,
      userName: b.user.name || "Anonymous",
      userAvatar: b.user.avatar
    }));

    const lastActive = profile.user.lastLoginAt;
    const isOnline = lastActive && (new Date().getTime() - new Date(lastActive).getTime() < 15 * 60 * 1000);
    const availabilityStatus = isOnline ? "Available Now" : "Offline";

    // Deserialize documents
    const eduArray = Array.isArray(profile.education) ? profile.education : [];
    const education = eduArray.map((s: string) => { try { return JSON.parse(s); } catch { return { name: s }; } }); // Fallback for old data

    const certArray = Array.isArray(profile.certifications) ? profile.certifications : [];
    const certifications = certArray.map((s: string) => { try { return JSON.parse(s); } catch { return { name: s }; } });

    return { ...profile, education, certifications, reviews, availabilityStatus };
  }
}