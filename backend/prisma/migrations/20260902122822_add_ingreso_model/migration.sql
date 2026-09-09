-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('SALARIO', 'FACTURA');

-- CreateEnum
CREATE TYPE "CategoriaIngreso" AS ENUM ('SERVICIOS', 'PLANILLA', 'PRODUCTOS', 'CONSULTORIA', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoIngreso" AS ENUM ('PAGADO', 'PENDIENTE', 'ANULADO');

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "clienteOrigen" TEXT NOT NULL,
    "categoria" "CategoriaIngreso" NOT NULL,
    "montoBruto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "estado" "EstadoIngreso" NOT NULL DEFAULT 'PAGADO',
    "igss" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ivaIsr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ingresoNeto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
