/*
  Warnings:

  - You are about to drop the column `diamondId` on the `shipments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_diamondId_fkey";

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "diamondId";
