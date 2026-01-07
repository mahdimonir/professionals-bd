import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";
import { deleteFromCloudinary, getPublicIdFromUrl } from "../../utils/cloudinary.utils.js";

export class ProfessionalService {
  static async getProfile(userId: string) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            location: true,
            timezone: true,
          },
        },
      },
    });

    if (!profile) throw ApiError.notFound("Professional profile not found");

    return profile;
  }

  static async createOrUpdateProfile(
    userId: string,
    data: {
      specialties: string[];
      rates: number;
      experience?: number;
      languages: string[];
      certifications?: string[];
    }
  ) {
    const existing = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    // Handle certifications change → delete removed ones
    if (existing?.certifications) {
      const oldUrls = existing.certifications;
      const newUrls = data.certifications || [];

      const removedUrls = oldUrls.filter((url) => !newUrls.includes(url));

      for (const url of removedUrls) {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) await deleteFromCloudinary(publicId);
      }
    }

    const profile = await prisma.professionalProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return profile;
  }

  static async getAllProfessionals(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      prisma.professionalProfile.findMany({
        skip,
        take: limit,
        orderBy: { rates: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              bio: true,
              location: true,
            },
          },
        },
      }),
      prisma.professionalProfile.count(),
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

  static async verifyProfessional(userId: string, isVerified: boolean) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw ApiError.notFound("Professional profile not found");

    return prisma.professionalProfile.update({
      where: { userId },
      data: { isVerified },
    });
  }
}