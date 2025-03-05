-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "diamondId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_diamondId_fkey" FOREIGN KEY ("diamondId") REFERENCES "diamonds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
