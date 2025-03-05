/*
  Warnings:

  - Added the required column `account_manager` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorized_by` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lead_source` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `party_group` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference_type` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sales_executive` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "account_manager" TEXT NOT NULL,
ADD COLUMN     "authorized_by" TEXT NOT NULL,
ADD COLUMN     "broker_name" TEXT,
ADD COLUMN     "lead_source" TEXT NOT NULL,
ADD COLUMN     "limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "party_group" TEXT NOT NULL,
ADD COLUMN     "reference_notes" TEXT,
ADD COLUMN     "reference_type" TEXT NOT NULL,
ADD COLUMN     "references" JSONB[],
ADD COLUMN     "sales_executive" TEXT NOT NULL;
