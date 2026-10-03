-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USUARIO', 'CONDUCTOR', 'CONTROLADOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('EFECTIVO', 'PAGO_MOVIL');

-- CreateEnum
CREATE TYPE "EstadoViaje" AS ENUM ('SOLICITADO', 'ASIGNADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'USUARIO',
    "fotoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conductor" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "unidad" TEXT,
    "conectado" BOOLEAN NOT NULL DEFAULT false,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,

    CONSTRAINT "Conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "conductorId" INTEGER,
    "latitudOrigen" DOUBLE PRECISION NOT NULL,
    "longitudOrigen" DOUBLE PRECISION NOT NULL,
    "referenciaOrigen" TEXT,
    "pasajeros" INTEGER NOT NULL DEFAULT 1,
    "tipoPago" "TipoPago" NOT NULL,
    "referenciaPago" TEXT,
    "estado" "EstadoViaje" NOT NULL DEFAULT 'SOLICITADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefono_key" ON "Usuario"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Conductor_usuarioId_key" ON "Conductor"("usuarioId");

-- AddForeignKey
ALTER TABLE "Conductor" ADD CONSTRAINT "Conductor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
