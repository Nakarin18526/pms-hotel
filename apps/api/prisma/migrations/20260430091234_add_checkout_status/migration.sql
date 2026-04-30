-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_OUT';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutBy" TEXT;
