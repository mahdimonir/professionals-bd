import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";
import { deleteFromCloudinary, getPublicIdFromUrl } from "../../utils/cloudinary.utils.js";
export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        moderatorPermissions: true,
        isVerified: true,
        avatar: true,
        bio: true,
        phone: true,
        location: true,
        timezone: true,
        createdAt: true,
        lastLoginAt: true,
        professionalProfile: {
          select: {
            id: true,
            title: true,
            status: true,
            specialties: true,
            languages: true,
            sessionPrice: true,
            platformCommission: true,
            experience: true,
            rejectionReason: true,
            linkedinUrl: true,
            cvUrl: true,
            certifications: true,
            availability: true,
            verifiedAt: true,
            approvedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    return user;
  }

  static async updateProfile(userId: string, data: {
    name?: string;
    bio?: string | null;
    phone?: string | null;
    location?: string | null;
    timezone?: string;
    avatar?: string | null;
  }) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    // Handle avatar change → delete old from Cloudinary
    if (data.avatar !== undefined && currentUser.avatar && currentUser.avatar !== data.avatar) {
      const oldPublicId = getPublicIdFromUrl(currentUser.avatar);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        location: true,
        timezone: true,
      },
    });

    return updatedUser;
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        location: true,
        createdAt: true,
        professionalProfile: {
          select: {
            id: true,
            title: true,
            status: true,
            specialties: true,
            sessionPrice: true,
            experience: true,
            languages: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    return user;
  }

  static async searchUsers(query: {
    q?: string;
    role?: string;
    page: number;
    limit: number;
  }) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
        { bio: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          location: true,
          professionalProfile: {
            select: {
              specialties: true,
              sessionPrice: true,
              status: true,
              title: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
