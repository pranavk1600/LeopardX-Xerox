-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('CREATED', 'PAYMENT_PENDING', 'PAID', 'QUEUED', 'PRINTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ColorMode" AS ENUM ('BW', 'COLOR');

-- CreateEnum
CREATE TYPE "PaperSize" AS ENUM ('A4', 'A3');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('CASHFREE', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "machine_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'ONLINE',
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "total_pages" INTEGER NOT NULL,
    "selected_pages" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "color_mode" "ColorMode" NOT NULL DEFAULT 'BW',
    "paper_size" "PaperSize" NOT NULL DEFAULT 'A4',
    "price" DOUBLE PRECISION NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "print_job_id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL DEFAULT 'CASHFREE',
    "order_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machines_machine_code_key" ON "machines"("machine_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_print_job_id_key" ON "payments"("print_job_id");

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_print_job_id_fkey" FOREIGN KEY ("print_job_id") REFERENCES "print_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
