/*
  Warnings:

  - You are about to drop the column `duration` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `trackingId` on the `shipments` table. All the data in the column will be lost.
  - Added the required column `addressLine1` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentTerms` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNo` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "duration",
DROP COLUMN "trackingId",
ADD COLUMN     "addressLine1" TEXT NOT NULL,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "faxNo" TEXT,
ADD COLUMN     "paymentTerms" TEXT NOT NULL,
ADD COLUMN     "phoneNo" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "website" TEXT;
