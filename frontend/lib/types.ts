export enum Role {
    USER = 'USER',
    PROFESSIONAL = 'PROFESSIONAL',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR'
}

export enum BookingStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export type AvailabilityStatus = 'Available Now' | 'Busy' | 'Offline';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string;
    phone?: string;
    isVerified: boolean;
    isSuspended?: boolean;
    bio?: string;
    location?: string;
    address?: string;
    memberSince?: string;
    professionalProfile?: ProfessionalProfile;
}

export interface Payment {
    id: string;
    bookingId: string;
    amount: number;
    currency: string;
    method: 'bKash' | 'SSLCommerz' | 'Card';
    status: PaymentStatus;
    transactionId: string;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
    userAvatar?: string;
}

export enum ApplicationStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface ProfessionalDocument {
    name: string;
    doc?: string; // URL from Cloudinary
}

export interface ProfessionalProfile {
    id: string;
    userId: string;
    user?: User;

    name?: string;
    avatar?: string;

    title?: string;
    bio?: string;
    category?: string;
    specialties: string[];

    sessionPrice?: number;
    rates?: number;

    experience: number;
    languages: string[];

    availabilityStatus?: AvailabilityStatus;
    status: ApplicationStatus;
    isVerified?: boolean;
    isApproved?: boolean;

    linkedinUrl?: string;
    cvUrl?: string; // Could also be ProfessionalDocument, but keeping simple for now unless requested
    rejectionReason?: string;

    rating: number;
    reviewCount: number;
    availability?: any;
    pendingChanges?: any;
    education?: ProfessionalDocument[];
    certifications?: ProfessionalDocument[];
    location?: string;
    reviews?: Review[];
}

export interface Booking {
    id: string;
    userId: string;
    userName?: string;
    professionalId: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    price: number;
    professionalName: string;
    notes?: string;
    review?: Review;
    paymentId?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
