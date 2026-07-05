/*
  Warnings:

  - You are about to alter the column `group_id` on the `app_user` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.
  - You are about to alter the column `station_id` on the `point_transactions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.
  - The primary key for the `user_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_groups` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.

*/
-- DropForeignKey
ALTER TABLE "app_user" DROP CONSTRAINT "app_user_group_id_fkey";

-- DropForeignKey
ALTER TABLE "point_transactions" DROP CONSTRAINT "point_transactions_station_id_fkey";

-- AlterTable
ALTER TABLE "app_user" ALTER COLUMN "group_id" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "point_transactions" ALTER COLUMN "station_id" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "user_groups" DROP CONSTRAINT "user_groups_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_groups_id_seq";

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
