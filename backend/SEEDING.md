# Database Seeding Guide

This guide explains how to seed your development database with comprehensive test data.

## 📦 What's Included

The seed data includes:

- **Users**: Admin, Moderator, Professionals, Regular Users (all roles)
- **Professional Profiles**: All statuses (PENDING, VERIFIED, APPROVED, REJECTED)
- **Bookings**: All statuses (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- **Meetings**: With and without recordings
- **Reviews**: Sample reviews for completed bookings
- **Payments**: All statuses (PENDING, PAID, FAILED, REFUNDED) and methods (BKASH, SSL_COMMERZ, CASH)
- **Payment Logs**: Transaction logs
- **Disputes**: All statuses (OPEN, RESOLVED, CLOSED) and types (BOOKING, GENERAL)
- **Earnings**: Professional earnings tracking
- **Withdraw Requests**: All statuses (PENDING, APPROVED, REJECTED, PROCESSED)
- **Audit Logs**: All action types (VERIFY, APPROVE, REJECT, etc.)

## 🚀 Usage

### Method 1: Using Prisma CLI (Recommended)

```bash
cd backend
npx prisma db seed
```

This will:
1. Clear all existing data
2. Populate the database with comprehensive test data
3. Display a summary of created records

### Method 2: Using npm script

```bash
cd backend
npm run prisma:seed
```

### Method 3: Direct execution

```bash
cd backend
tsx prisma/seed.ts
```

## 🔄 Reset Database

If you need to completely reset your database during development:

```bash
# Reset database (drops all data and re-runs migrations)
npx prisma migrate reset

# This will automatically run the seed after reset
```

Or manually:

```bash
# Reset migrations
npx prisma migrate reset --skip-seed

# Then seed manually
npx prisma db seed
```

## 🔑 Test Credentials

After seeding, you can log in with these accounts:

### Admin
- **Email**: `mahdimoniruzzaman@gmail.com`
- **Password**: `Password123!`
- **Role**: ADMIN

### Moderator
- **Email**: `mahdi.thedreamer@gmail.com`
- **Password**: `Password123!`
- **Role**: MODERATOR

### Professional (Approved)
- **Email**: `farhan@probd.com`
- **Password**: `Password123!`
- **Role**: PROFESSIONAL
- **Status**: APPROVED

### Professional (Approved)
- **Email**: `tania@probd.com`
- **Password**: `Password123!`
- **Role**: PROFESSIONAL
- **Status**: APPROVED

### Professional (Verified - Awaiting Approval)
- **Email**: `sameer@probd.com`
- **Password**: `Password123!`
- **Role**: USER (will be PROFESSIONAL after approval)
- **Profile Status**: VERIFIED

### Professional (Pending)
- **Email**: `rafiq@probd.com`
- **Password**: `Password123!`
- **Role**: USER
- **Profile Status**: PENDING

### Regular User
- **Email**: `zayan@example.com`
- **Password**: `Password123!`
- **Role**: USER

### Regular User
- **Email**: `rahat@example.com`
- **Password**: `Password123!`
- **Role**: USER

### Regular User
- **Email**: `nusrat@example.com`
- **Password**: `Password123!`
- **Role**: USER

## 📊 Data Coverage

### Professional Profiles
- ✅ PENDING: 1 profile
- ✅ VERIFIED: 1 profile
- ✅ APPROVED: 2 profiles
- ✅ REJECTED: 1 profile

### Bookings
- ✅ PENDING: 1 booking
- ✅ CONFIRMED: 1 booking
- ✅ COMPLETED: 1 booking
- ✅ CANCELLED: 1 booking

### Payments
- ✅ PENDING: 1 payment
- ✅ PAID: 1 payment
- ✅ FAILED: 1 payment
- ✅ REFUNDED: 1 payment

### Payment Methods
- ✅ BKASH: Multiple
- ✅ SSL_COMMERZ: Multiple
- ✅ CASH: Multiple

### Disputes
- ✅ OPEN: 1 dispute (Booking)
- ✅ RESOLVED: 1 dispute (Booking)
- ✅ CLOSED: 1 dispute (General)

### Withdraw Requests
- ✅ PENDING: 1 request
- ✅ APPROVED: 1 request
- ✅ REJECTED: 1 request
- ✅ PROCESSED: 1 request

### Audit Actions
- ✅ PRO_VERIFY
- ✅ PRO_APPROVE
- ✅ PRO_REJECT
- ✅ WITHDRAW_APPROVE
- ✅ DISPUTE_RESOLVE
- ✅ REFUND_APPROVE

## ⚠️ Important Notes

1. **Development Only**: This seed is for development/testing purposes only. Never run on production!

2. **Password**: All seed users have the same password: `Password123!`

3. **Destructive Operation**: The seed script **deletes all existing data** before inserting new data.

4. **Foreign Keys**: The seed respects all foreign key relationships and creates data in the correct order.

5. **Idempotent**: You can run the seed multiple times - it will always produce the same result.

## 🛠️ Troubleshooting

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Database connection failed"
Check your `.env` file has correct `DATABASE_URL`

### Want to modify seed data?
Edit `backend/prisma/seed.ts` and re-run the seed command.

## 📝 Adding More Seed Data

To add more test data, edit `backend/prisma/seed.ts`:

1. Add your data creation code in the appropriate section
2. Follow the existing patterns for consistency
3. Ensure foreign key relationships are valid
4. Run `npx prisma db seed` to test your changes

## 🎯 Testing Workflows

With this seed data, you can test:

1. **User Registration & Login**: Use any of the test accounts
2. **Professional Application**: View pending/verified/approved/rejected states
3. **Booking Flow**: Test all booking statuses
4. **Payment Processing**: Test all payment methods and statuses
5. **Reviews**: View existing reviews on completed bookings
6. **Disputes**: Test dispute creation and resolution
7. **Earnings & Withdrawals**: Test professional earnings workflows
8. **Admin Actions**: Use admin account to approve/reject profiles
9. **Moderator Actions**: Use moderator account to verify applications
10. **Audit Trail**: View all admin/moderator actions in audit logs
