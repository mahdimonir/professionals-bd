-- AlterTable
ALTER TABLE "ProfessionalProfile" ADD COLUMN     "platformCommission" DECIMAL(65,30) NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "moderatorPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
