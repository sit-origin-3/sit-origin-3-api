/*
  Warnings:

  - You are about to drop the column `group` on the `app_user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id]` on the table `app_user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `group_id` to the `app_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `major` to the `app_user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserMajor" AS ENUM ('IT', 'CS', 'DSI');

-- AlterTable
ALTER TABLE "app_user" DROP COLUMN "group",
ADD COLUMN     "alt_email" VARCHAR(255),
ADD COLUMN     "group_id" INTEGER NOT NULL,
ADD COLUMN     "major" "UserMajor" NOT NULL,
ADD COLUMN     "student_id" VARCHAR(20);

-- DropEnum
DROP TYPE "UserGroup";

-- CreateTable
CREATE TABLE "user_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_key" ON "user_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_student_id_key" ON "app_user"("student_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
