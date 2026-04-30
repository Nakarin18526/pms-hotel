-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN';
