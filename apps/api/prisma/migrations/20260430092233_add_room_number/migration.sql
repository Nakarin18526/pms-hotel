-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "roomNumber" TEXT;

-- CreateIndex
CREATE INDEX "Booking_roomNumber_idx" ON "Booking"("roomNumber");
