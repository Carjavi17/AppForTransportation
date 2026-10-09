-- CreateEnum
CREATE TYPE "TipoPasajero" AS ENUM ('CIVIL', 'ESTUDIANTE');

-- AlterTable
ALTER TABLE "Viaje" ADD COLUMN     "tipoPasajero" "TipoPasajero" NOT NULL DEFAULT 'CIVIL';
