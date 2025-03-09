-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'employee', 'customer');

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'default-user-id';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE "admin_emails" (
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_emails_pkey" PRIMARY KEY ("email")
);

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
