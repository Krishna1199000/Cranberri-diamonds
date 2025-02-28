-- CreateTable
CREATE TABLE "diamonds" (
    "id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "certificate_no" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "clarity" TEXT NOT NULL,
    "cut" TEXT,
    "polish" TEXT NOT NULL,
    "sym" TEXT NOT NULL,
    "floro" TEXT NOT NULL,
    "lab" TEXT NOT NULL,
    "rap_price" DOUBLE PRECISION NOT NULL,
    "rap_amount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "price_per_carat" DOUBLE PRECISION NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "measurement" TEXT NOT NULL,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "table" DOUBLE PRECISION,
    "ratio" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "video_url" TEXT,
    "image_url" TEXT,
    "cert_url" TEXT,
    "girdle" TEXT,
    "culet" TEXT,
    "c_angle" DOUBLE PRECISION,
    "c_height" DOUBLE PRECISION,
    "p_angle" DOUBLE PRECISION,
    "p_depth" DOUBLE PRECISION,
    "fancy_intensity" TEXT,
    "fancy_overtone" TEXT,
    "fancy_color" TEXT,
    "location" TEXT,
    "inscription" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diamonds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diamonds_stock_id_key" ON "diamonds"("stock_id");
