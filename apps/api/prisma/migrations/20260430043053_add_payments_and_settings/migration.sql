-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'PROMPTPAY');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PROMPTPAY', 'BANK_ACCOUNT');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_VERIFICATION';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "slipUploadedAt" TIMESTAMP(3),
ADD COLUMN     "slipUrl" TEXT,
ADD COLUMN     "slipVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "slipVerifiedBy" TEXT;

-- CreateTable
CREATE TABLE "PaymentSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "transferType" "TransferType" NOT NULL DEFAULT 'PROMPTPAY',
    "promptpayId" TEXT,
    "promptpayName" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("id")
);
