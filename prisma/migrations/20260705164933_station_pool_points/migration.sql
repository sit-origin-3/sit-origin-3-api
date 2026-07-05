/*
  Warnings:

  - Added the required column `station_id` to the `point_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "point_transactions" ADD COLUMN     "station_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user_groups" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
