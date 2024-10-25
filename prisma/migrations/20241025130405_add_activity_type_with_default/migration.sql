/*
  Warnings:

  - You are about to drop the column `action` on the `Activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "action",
ALTER COLUMN "type" DROP DEFAULT;
