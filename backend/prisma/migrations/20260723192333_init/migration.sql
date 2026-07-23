-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('BOOKING', 'BLOCK');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('MANUAL', 'CHANNEL');

-- CreateEnum
CREATE TYPE "PriceOverrideSource" AS ENUM ('MANUAL', 'DYNAMIC');

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "baseRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitPriceOverride" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "price" INTEGER NOT NULL,
    "source" "PriceOverrideSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitPriceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitReservation" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "externalId" TEXT,
    "guestName" TEXT NOT NULL,
    "type" "ReservationType" NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "source" "ReservationSource" NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE INDEX "UnitPriceOverride_unitId_date_idx" ON "UnitPriceOverride"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UnitPriceOverride_unitId_date_key" ON "UnitPriceOverride"("unitId", "date");

-- CreateIndex
CREATE INDEX "UnitReservation_unitId_checkIn_checkOut_idx" ON "UnitReservation"("unitId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "UnitReservation_externalId_idx" ON "UnitReservation"("externalId");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitPriceOverride" ADD CONSTRAINT "UnitPriceOverride_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitReservation" ADD CONSTRAINT "UnitReservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
