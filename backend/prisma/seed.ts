import { PrismaPg } from '@prisma/adapter-pg';
import { ApplicationStatus, AuditAction, BookingStatus, PaymentMethod, PaymentStatus, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.paymentLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.meeting.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.withdrawRequest.deleteMany();
    await prisma.earnings.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.professionalProfile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.account.deleteMany();
    await prisma.oTP.deleteMany();
    await prisma.user.deleteMany();

    const defaultPassword = await bcrypt.hash('12345678', 12);

    // ==================== USERS ====================
    console.log('👥 Creating users...');

    const admin1 = await prisma.user.create({
        data: {
            id: 'admin1',
            name: 'Moniruzzaman Mahdi',
            email: 'mahdimoniruzzaman@gmail.com',
            passwordHash: defaultPassword,
            role: Role.ADMIN,
            isVerified: true,
            avatar: 'https://res.cloudinary.com/devmahdi/image/upload/v1767279179/WBTravels/avatars/tuz3onhuyzjcvecup0p0.png',
            phone: '+8801876689921',
            bio: 'Platform Administrator',
            location: 'Dhaka, Bangladesh',
        }
    });

    const moderator1 = await prisma.user.create({
        data: {
            id: 'mod1',
            name: 'Mahdi The Dreamer',
            email: 'mahdi.thedreamer@gmail.com',
            passwordHash: defaultPassword,
            role: Role.MODERATOR,
            isVerified: true,
            bio: 'Application Moderator',
            location: 'Dhaka, Bangladesh',
        }
    });

    // Professional Users (with different profile statuses)
    const pro1 = await prisma.user.create({
        data: {
            id: 'pro1',
            name: 'Adv. Farhan Ahmed',
            email: 'farhan@probd.com',
            passwordHash: defaultPassword,
            role: Role.PROFESSIONAL,
            isVerified: true,
            avatar: 'https://picsum.photos/400/400?random=11',
            phone: '+8801712345001',
            bio: 'Senior Legal Consultant specializing in Corporate Law',
            location: 'Gulshan, Dhaka',
        }
    });

    const pro2 = await prisma.user.create({
        data: {
            id: 'pro2',
            name: 'Tania Kabir, FCA',
            email: 'tania@probd.com',
            passwordHash: defaultPassword,
            role: Role.PROFESSIONAL,
            isVerified: true,
            avatar: 'https://picsum.photos/400/400?random=22',
            phone: '+8801712345002',
            bio: 'Chartered Accountant & Tax Expert',
            location: 'Banani, Dhaka',
        }
    });

    const pro3 = await prisma.user.create({
        data: {
            id: 'pro3',
            name: 'Dr. Sameer Rahman',
            email: 'sameer@probd.com',
            passwordHash: defaultPassword,
            role: Role.USER, // Will be upgraded after approval
            isVerified: true,
            avatar: 'https://picsum.photos/400/400?random=33',
            phone: '+8801712345003',
            bio: 'Clinical Psychologist',
            location: 'Dhanmondi, Dhaka',
        }
    });

    const pro4 = await prisma.user.create({
        data: {
            id: 'pro4',
            name: 'Ar. Rafiq Azam',
            email: 'rafiq@probd.com',
            passwordHash: defaultPassword,
            role: Role.USER, // Pending approval
            isVerified: true,
            avatar: 'https://picsum.photos/400/400?random=44',
            phone: '+8801712345004',
            bio: 'Sustainable Architecture Specialist',
            location: 'Baridhara, Dhaka',
        }
    });

    // Regular Users
    const user1 = await prisma.user.create({
        data: {
            id: 'user1',
            name: 'Zayan Mallick',
            email: 'zayan@example.com',
            passwordHash: defaultPassword,
            role: Role.USER,
            isVerified: true,
            avatar: 'https://i.pravatar.cc/150?u=u1',
            phone: '+8801712345101',
            location: 'Dhaka, Bangladesh',
        }
    });

    const user2 = await prisma.user.create({
        data: {
            id: 'user2',
            name: 'Rahat Chowdhury',
            email: 'rahat@example.com',
            passwordHash: defaultPassword,
            role: Role.USER,
            isVerified: true,
            avatar: 'https://i.pravatar.cc/150?u=rahat',
            phone: '+8801712345102',
            location: 'Dhaka, Bangladesh',
        }
    });

    const user3 = await prisma.user.create({
        data: {
            id: 'user3',
            name: 'Nusrat Jahan',
            email: 'nusrat@example.com',
            passwordHash: defaultPassword,
            role: Role.USER,
            isVerified: true,
            avatar: 'https://i.pravatar.cc/150?u=nusrat',
            phone: '+8801712345103',
            location: 'Chittagong, Bangladesh',
        }
    });

    // ==================== PROFESSIONAL PROFILES ====================
    console.log('💼 Creating professional profiles...');

    // APPROVED - Active professional
    const profile1 = await prisma.professionalProfile.create({
        data: {
            userId: pro1.id,
            title: 'Senior Legal Consultant',
            category: 'Legal',
            specialties: ['Corporate Law', 'IP Rights', 'Dispute Resolution', 'Contract Law'],
            languages: ['Bengali', 'English', 'Hindi'],
            experience: 12,
            sessionPrice: 5000,
            linkedinUrl: 'https://linkedin.com/in/farhan-ahmed',
            cvUrl: 'https://example.com/cv/farhan.pdf',
            certifications: ['High Court Bar Membership', 'IP Rights Council'],
            status: ApplicationStatus.APPROVED,
            verifiedBy: moderator1.id,
            verifiedAt: new Date('2024-01-15'),
            approvedBy: admin1.id,
            approvedAt: new Date('2024-01-16'),
            availability: { timezone: 'Asia/Dhaka', slots: ['09:00-17:00'] },
        }
    });

    // APPROVED - Active professional
    const profile2 = await prisma.professionalProfile.create({
        data: {
            userId: pro2.id,
            title: 'Chartered Accountant & Tax Consultant',
            specialties: ['Tax Planning', 'Audit', 'Financial Advisory', 'VAT Compliance'],
            languages: ['Bengali', 'English'],
            experience: 8,
            sessionPrice: 3500,
            linkedinUrl: 'https://linkedin.com/in/tania-kabir',
            cvUrl: 'https://example.com/cv/tania.pdf',
            certifications: ['FCA - ICAB', 'CPA'],
            status: ApplicationStatus.APPROVED,
            verifiedBy: moderator1.id,
            verifiedAt: new Date('2024-02-10'),
            approvedBy: admin1.id,
            approvedAt: new Date('2024-02-11'),
            availability: { timezone: 'Asia/Dhaka', slots: ['10:00-18:00'] },
        }
    });

    // VERIFIED - Waiting for admin approval
    const profile3 = await prisma.professionalProfile.create({
        data: {
            userId: pro3.id,
            title: 'Clinical Psychologist',
            category: 'Medical',
            specialties: ['Mental Health', 'Clinical Psychology', 'Family Counseling'],
            languages: ['Bengali', 'English'],
            experience: 15,
            sessionPrice: 2500,
            linkedinUrl: 'https://linkedin.com/in/sameer-rahman',
            cvUrl: 'https://example.com/cv/sameer.pdf',
            certifications: ['PhD Clinical Psychology - BSMMU', 'Licensed Therapist'],
            status: ApplicationStatus.VERIFIED,
            verifiedBy: moderator1.id,
            verifiedAt: new Date('2024-03-01'),
            availability: { timezone: 'Asia/Dhaka', slots: ['14:00-20:00'] },
        }
    });

    // PENDING - Awaiting moderator review
    const profile4 = await prisma.professionalProfile.create({
        data: {
            userId: pro4.id,
            title: 'Sustainable Architecture Consultant',
            category: 'Engineering',
            specialties: ['Sustainable Design', 'Urban Planning', 'Green Architecture'],
            languages: ['Bengali', 'English'],
            experience: 20,
            sessionPrice: 6000,
            linkedinUrl: 'https://linkedin.com/in/rafiq-azam',
            cvUrl: 'https://example.com/cv/rafiq.pdf',
            certifications: ['M.Arch', 'LEED Certified'],
            status: ApplicationStatus.PENDING,
        }
    });

    // REJECTED - Application was rejected
    const pro5 = await prisma.user.create({
        data: {
            id: 'pro5',
            name: 'John Doe',
            email: 'john@example.com',
            passwordHash: defaultPassword,
            role: Role.USER,
            isVerified: true,
        }
    });

    const profile5 = await prisma.professionalProfile.create({
        data: {
            userId: pro5.id,
            title: 'General Consultant',
            specialties: ['Consulting'],
            languages: ['English'],
            experience: 2,
            sessionPrice: 1000,
            status: ApplicationStatus.REJECTED,
            verifiedBy: moderator1.id,
            verifiedAt: new Date('2024-03-10'),
            rejectionReason: 'Insufficient credentials and experience for platform standards',
        }
    });

    // ==================== BOOKINGS ====================
    console.log('📅 Creating bookings...');

    // COMPLETED Booking
    const booking1 = await prisma.booking.create({
        data: {
            id: 'booking1',
            userId: user1.id,
            professionalId: pro1.id,
            startTime: new Date('2024-03-01T10:00:00Z'),
            endTime: new Date('2024-03-01T11:00:00Z'),
            status: BookingStatus.COMPLETED,
            notes: 'Need legal consultation for startup incorporation',
            price: 5000,
            createdAt: new Date('2024-02-25'),
        }
    });

    // CONFIRMED Booking (upcoming)
    const booking2 = await prisma.booking.create({
        data: {
            id: 'booking2',
            userId: user2.id,
            professionalId: pro2.id,
            startTime: new Date('2026-01-15T14:00:00Z'),
            endTime: new Date('2026-01-15T15:00:00Z'),
            status: BookingStatus.CONFIRMED,
            notes: 'Tax planning for fiscal year 2026',
            price: 3500,
            createdAt: new Date('2026-01-10'),
        }
    });

    // PENDING Booking
    const booking3 = await prisma.booking.create({
        data: {
            id: 'booking3',
            userId: user3.id,
            professionalId: pro1.id,
            startTime: new Date('2026-01-20T16:00:00Z'),
            endTime: new Date('2026-01-20T17:00:00Z'),
            status: BookingStatus.PENDING,
            notes: 'Contract review needed',
            price: 5000,
            createdAt: new Date('2026-01-12'),
        }
    });

    // CANCELLED Booking
    const booking4 = await prisma.booking.create({
        data: {
            id: 'booking4',
            userId: user1.id,
            professionalId: pro2.id,
            startTime: new Date('2024-02-15T11:00:00Z'),
            endTime: new Date('2024-02-15T12:00:00Z'),
            status: BookingStatus.CANCELLED,
            notes: 'Financial consultation',
            price: 3500,
            cancellationReason: 'Client scheduling conflict',
            cancelledBy: user1.id,
            createdAt: new Date('2024-02-10'),
        }
    });

    const booking5 = await prisma.booking.create({
        data: {
            id: 'booking5',
            userId: user2.id,
            professionalId: pro1.id,
            startTime: new Date('2024-04-05T09:00:00Z'),
            endTime: new Date('2024-04-05T10:00:00Z'),
            status: BookingStatus.COMPLETED,
            notes: 'Legal opinion for company restructuring',
            price: 5000,
            createdAt: new Date('2024-04-01'),
        }
    });

    const booking6 = await prisma.booking.create({
        data: {
            id: 'booking6',
            userId: user3.id,
            professionalId: pro2.id,
            startTime: new Date('2024-04-10T15:00:00Z'),
            endTime: new Date('2024-04-10T16:00:00Z'),
            status: BookingStatus.COMPLETED,
            notes: 'VAT registration guidance',
            price: 3500,
            createdAt: new Date('2024-04-08'),
        }
    });

    const booking7 = await prisma.booking.create({
        data: {
            id: 'booking7',
            userId: user1.id,
            professionalId: pro3.id,
            startTime: new Date('2026-02-01T18:00:00Z'),
            endTime: new Date('2026-02-01T19:00:00Z'),
            status: BookingStatus.CONFIRMED,
            notes: 'Initial mental health assessment',
            price: 2500,
            createdAt: new Date('2026-01-25'),
        }
    });

    // ==================== MEETINGS ====================
    console.log('🎥 Creating meetings...');

    await prisma.meeting.create({
        data: {
            bookingId: booking1.id,
            streamCallId: 'call_' + booking1.id,
            recorded: true,
            recordingUrl: 'https://stream.io/recordings/call_booking1.mp4',
            transcript: 'Meeting transcript for legal consultation...',
        }
    });

    await prisma.meeting.create({
        data: {
            bookingId: booking2.id,
            streamCallId: 'call_' + booking2.id,
            recorded: false,
        }
    });

    await prisma.meeting.create({
        data: {
            bookingId: booking5.id,
            streamCallId: 'call_' + booking5.id,
            recorded: true,
            recordingUrl: 'https://stream.io/recordings/call_booking5.mp4',
            transcript: 'Company restructuring discussion...',
        }
    });

    await prisma.meeting.create({
        data: {
            bookingId: booking6.id,
            streamCallId: 'call_' + booking6.id,
            recorded: false,
        }
    });

    // ==================== REVIEWS ====================
    console.log('⭐ Creating reviews...');

    await prisma.review.create({
        data: {
            bookingId: booking1.id,
            rating: 5,
            comment: 'Incredible legal insights. Adv. Farhan helped me navigate complex corporate regulations smoothly.',
            createdAt: new Date('2024-03-02'),
        }
    });

    await prisma.review.create({
        data: {
            bookingId: booking5.id,
            rating: 4,
            comment: 'Very professional and clear legal advice.',
            createdAt: new Date('2024-04-06'),
        }
    });

    await prisma.review.create({
        data: {
            bookingId: booking6.id,
            rating: 5,
            comment: 'Excellent tax consultation. Highly recommended!',
            createdAt: new Date('2024-04-11'),
        }
    });

    // ==================== PAYMENTS ====================
    console.log('💳 Creating payments...');

    // PAID payment
    const payment1 = await prisma.payment.create({
        data: {
            id: 'payment1',
            bookingId: booking1.id,
            amount: 5000,
            currency: 'BDT',
            method: PaymentMethod.BKASH,
            transactionId: 'BKH20240301123456',
            status: PaymentStatus.PAID,
            payerNumber: '+8801712345101',
            createdAt: new Date('2024-03-01T09:00:00Z'),
        }
    });

    // PENDING payment
    const payment2 = await prisma.payment.create({
        data: {
            id: 'payment2',
            bookingId: booking2.id,
            amount: 3500,
            currency: 'BDT',
            method: PaymentMethod.SSL_COMMERZ,
            status: PaymentStatus.PENDING,
            paymentUrl: 'https://sandbox.sslcommerz.com/payment/12345',
            createdAt: new Date('2026-01-10'),
        }
    });

    // FAILED payment
    const payment3 = await prisma.payment.create({
        data: {
            id: 'payment3',
            bookingId: booking3.id,
            amount: 5000,
            currency: 'BDT',
            method: PaymentMethod.BKASH,
            status: PaymentStatus.FAILED,
            createdAt: new Date('2026-01-12'),
        }
    });

    // REFUNDED payment
    const payment4 = await prisma.payment.create({
        data: {
            id: 'payment4',
            bookingId: booking4.id,
            amount: 3500,
            currency: 'BDT',
            method: PaymentMethod.CASH,
            transactionId: 'CASH20240215',
            status: PaymentStatus.REFUNDED,
            refundAmount: 3500,
            refundTrxId: 'REF20240216001',
            createdAt: new Date('2024-02-15'),
        }
    });

    const payment5 = await prisma.payment.create({
        data: {
            id: 'payment5',
            bookingId: booking5.id,
            amount: 5000,
            currency: 'BDT',
            method: PaymentMethod.BKASH,
            transactionId: 'BKH20240405111111',
            status: PaymentStatus.PAID,
            payerNumber: user2.phone!,
            createdAt: new Date('2024-04-05'),
        }
    });

    const payment6 = await prisma.payment.create({
        data: {
            id: 'payment6',
            bookingId: booking7.id,
            amount: 2500,
            currency: 'BDT',
            method: PaymentMethod.SSL_COMMERZ,
            status: PaymentStatus.PENDING,
            paymentUrl: 'https://sandbox.sslcommerz.com/payment/67890',
            createdAt: new Date('2026-01-25'),
        }
    });

    // ==================== PAYMENT LOGS ====================
    console.log('📝 Creating payment logs...');

    await prisma.paymentLog.create({
        data: {
            paymentId: payment1.id,
            action: 'CREATE',
            request: { amount: 5000, method: 'BKASH' },
            response: { status: 'success', txnId: 'BKH20240301123456' },
            createdAt: new Date('2024-03-01T09:00:00Z'),
        }
    });

    await prisma.paymentLog.create({
        data: {
            paymentId: payment1.id,
            action: 'EXECUTE',
            request: { txnId: 'BKH20240301123456' },
            response: { status: 'completed' },
            createdAt: new Date('2024-03-01T09:05:00Z'),
        }
    });

    await prisma.paymentLog.create({
        data: {
            paymentId: payment3.id,
            action: 'CREATE',
            request: { amount: 5000, method: 'BKASH' },
            response: { status: 'failed', error: 'Insufficient balance' },
            createdAt: new Date('2026-01-12'),
        }
    });

    // ==================== DISPUTES ====================
    console.log('⚖️ Creating disputes...');

    // OPEN dispute - Booking related
    await prisma.dispute.create({
        data: {
            bookingId: booking3.id,
            userId: user3.id,
            description: 'Professional did not join the scheduled meeting on time.',
            status: 'OPEN',
            type: 'BOOKING',
        }
    });

    // RESOLVED dispute
    await prisma.dispute.create({
        data: {
            bookingId: booking4.id,
            userId: user1.id,
            description: 'Refund not processed after cancellation.',
            status: 'RESOLVED',
            type: 'BOOKING',
            resolvedBy: moderator1.id,
            resolvedAt: new Date('2024-02-20'),
        }
    });

    // GENERAL dispute
    await prisma.dispute.create({
        data: {
            userId: user2.id,
            description: 'Unable to upload profile picture, getting server error.',
            status: 'CLOSED',
            type: 'GENERAL',
            resolvedBy: moderator1.id,
            resolvedAt: new Date('2024-03-05'),
        }
    });

    const dispute4 = await prisma.dispute.create({
        data: {
            bookingId: booking7.id,
            userId: user1.id,
            description: 'Professional joined late and session was shortened.',
            status: 'OPEN',
            type: 'BOOKING',
        }
    });

    const dispute5 = await prisma.dispute.create({
        data: {
            bookingId: booking6.id,
            userId: user3.id,
            description: 'Requested invoice copy but did not receive.',
            status: 'RESOLVED',
            type: 'GENERAL',
            resolvedBy: moderator1.id,
            resolvedAt: new Date('2024-04-12'),
        }
    });

    // ==================== EARNINGS ====================
    console.log('💰 Creating earnings...');

    await prisma.earnings.create({
        data: {
            professionalId: pro1.id,
            totalEarnings: 15000,
            pendingEarnings: 5000,
            withdrawn: 10000,
        }
    });

    await prisma.earnings.create({
        data: {
            professionalId: pro2.id,
            totalEarnings: 10500,
            pendingEarnings: 7000,
            withdrawn: 3500,
        }
    });

    // ==================== WITHDRAW REQUESTS ====================
    console.log('🏦 Creating withdraw requests...');

    // PROCESSED
    await prisma.withdrawRequest.create({
        data: {
            professionalId: pro1.id,
            amount: 10000,
            method: PaymentMethod.BKASH,
            status: 'PROCESSED',
            requestedAt: new Date('2024-02-01'),
            processedAt: new Date('2024-02-05'),
            processedBy: admin1.id,
        }
    });

    // PENDING
    await prisma.withdrawRequest.create({
        data: {
            professionalId: pro2.id,
            amount: 3500,
            method: PaymentMethod.BKASH,
            status: 'PENDING',
            requestedAt: new Date('2026-01-10'),
        }
    });

    // APPROVED (but not yet processed)
    await prisma.withdrawRequest.create({
        data: {
            professionalId: pro1.id,
            amount: 5000,
            method: PaymentMethod.SSL_COMMERZ,
            status: 'APPROVED',
            requestedAt: new Date('2026-01-11'),
            processedBy: admin1.id,
        }
    });

    // REJECTED
    await prisma.withdrawRequest.create({
        data: {
            professionalId: pro2.id,
            amount: 50000,
            method: PaymentMethod.BKASH,
            status: 'REJECTED',
            requestedAt: new Date('2024-03-01'),
            processedBy: admin1.id,
        }
    });

    // ==================== AUDIT LOGS ====================
    console.log('📋 Creating audit logs...');

    await prisma.auditLog.create({
        data: {
            action: AuditAction.PRO_VERIFY,
            performedBy: moderator1.id,
            targetId: profile1.id,
            details: { profileId: profile1.id, username: pro1.name },
            createdAt: new Date('2024-01-15'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.PRO_APPROVE,
            performedBy: admin1.id,
            targetId: profile1.id,
            details: { profileId: profile1.id, username: pro1.name },
            createdAt: new Date('2024-01-16'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.PRO_REJECT,
            performedBy: moderator1.id,
            targetId: profile5.id,
            details: { profileId: profile5.id, reason: 'Insufficient credentials' },
            createdAt: new Date('2024-03-10'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.WITHDRAW_APPROVE,
            performedBy: admin1.id,
            targetId: pro1.id,
            details: { amount: 10000, method: 'BKASH' },
            createdAt: new Date('2024-02-05'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.DISPUTE_RESOLVE,
            performedBy: moderator1.id,
            targetId: booking4.id,
            details: { disputeType: 'BOOKING', resolution: 'Refund issued' },
            createdAt: new Date('2024-02-20'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.REFUND_APPROVE,
            performedBy: admin1.id,
            targetId: payment4.id,
            details: { amount: 3500, bookingId: booking4.id },
            createdAt: new Date('2024-02-16'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.DISPUTE_RESOLVE,
            performedBy: moderator1.id,
            targetId: dispute5.id,
            details: {
                disputeId: dispute5.id,
                resolution: 'Invoice sent to user via email',
            },
            createdAt: new Date('2024-04-12'),
        }
    });

    await prisma.auditLog.create({
        data: {
            action: AuditAction.BOOKING_CANCEL,
            performedBy: admin1.id,
            targetId: booking7.id,
            details: {
                bookingId: booking7.id,
                reason: 'System maintenance window',
            },
            createdAt: new Date('2026-01-30'),
        }
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Professional Profiles: ${await prisma.professionalProfile.count()}`);
    console.log(`   Bookings: ${await prisma.booking.count()}`);
    console.log(`   Meetings: ${await prisma.meeting.count()}`);
    console.log(`   Reviews: ${await prisma.review.count()}`);
    console.log(`   Payments: ${await prisma.payment.count()}`);
    console.log(`   Payment Logs: ${await prisma.paymentLog.count()}`);
    console.log(`   Disputes: ${await prisma.dispute.count()}`);
    console.log(`   Earnings: ${await prisma.earnings.count()}`);
    console.log(`   Withdraw Requests: ${await prisma.withdrawRequest.count()}`);
    console.log(`   Audit Logs: ${await prisma.auditLog.count()}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: mahdimoniruzzaman@gmail.com / 12345678');
    console.log('   Moderator: mahdi.thedreamer@gmail.com / 12345678');
    console.log('   Professional: farhan@probd.com / 12345678');
    console.log('   User: zayan@example.com / 12345678');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
