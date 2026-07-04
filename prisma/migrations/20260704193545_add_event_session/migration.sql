-- CreateEnum
CREATE TYPE "EventSession" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "session" "EventSession" NOT NULL DEFAULT 'A';
