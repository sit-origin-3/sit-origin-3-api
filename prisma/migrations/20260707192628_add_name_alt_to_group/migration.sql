/*
  Warnings:

  - Added the required column `name_alt` to the `user_groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_groups" ADD COLUMN "name_alt" VARCHAR(100) NOT NULL DEFAULT '';
UPDATE "user_groups" SET "name_alt" = "name";
ALTER TABLE "user_groups" ALTER COLUMN "name_alt" DROP DEFAULT;
