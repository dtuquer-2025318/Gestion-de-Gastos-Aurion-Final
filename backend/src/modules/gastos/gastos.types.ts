import { CategoriaGasto, EstadoGasto } from '@prisma/client';

export interface GastoResponse {
  id: string;
  fecha: Date;
  proveedorBeneficiario: string;
  categoria: CategoriaGasto;
  montoTotal: number;
  estado: EstadoGasto;
  comprobanteUrl?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GastosKPIs {
  gastoTotalMes: number;
  presupuestoUtilizadoPorcentaje: number;
  totalRegistrosMes: number;
}