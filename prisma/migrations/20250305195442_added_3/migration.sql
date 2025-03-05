/*
  Warnings:

  - Added the required column `business_reg_no` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_type` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_type` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pan_no` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "business_reg_no" TEXT NOT NULL,
ADD COLUMN     "business_type" TEXT NOT NULL,
ADD COLUMN     "cst_tin_no" TEXT,
ADD COLUMN     "organization_type" TEXT NOT NULL,
ADD COLUMN     "pan_no" TEXT NOT NULL,
ADD COLUMN     "seller_permit_no" TEXT,
ADD COLUMN     "trade_body_membership" TEXT[];
