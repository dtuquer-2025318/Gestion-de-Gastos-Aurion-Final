import { TipoIngreso, CategoriaIngreso, TipoComprobante, EstadoIngreso } from '@prisma/client';

export interface DesgloseFiscal {
  baseImponible: number;
  iva: number;
  isr: number;
  igss: number;
  ivaPendientePago: number;
  neto: number;
  cuentaComoIngreso: boolean;
}

export interface IngresoResponse {
  id: string;
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  tipoIngreso: TipoIngreso;
  montoBruto: number;
  fecha: Date;
  tipoComprobante: TipoComprobante;
  estado: EstadoIngreso;
  igss: number;
  ivaIsr: number;
  ivaPendientePago: number;
  ingresoNeto: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngresoKPIs {
  totalIngresosBrutos: number;
  retencionIsr: number;
  retencionesIgss: number;
  ivaPendientePago: number;
  ingresoNetoReal: number;
}