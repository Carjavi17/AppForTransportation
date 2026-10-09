/*
  Warnings:

  - You are about to drop the column `tipoPasajero` on the `Viaje` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Viaje" DROP COLUMN "tipoPasajero",
ADD COLUMN     "estudiantes" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "TipoPasajero";
