import { Decimal } from '@prisma/client/runtime/library';
import { TipoComprobante, CategoriaIngreso, EstadoIngreso } from '@prisma/client';

export interface IngresoCreateInput {
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado?: EstadoIngreso;
}

export interface IngresoUpdateInput {
  clienteOrigen?: string;
  categoria?: CategoriaIngreso;
  montoBruto?: number;
  fecha?: string;
  tipoComprobante?: TipoComprobante;
  estado?: EstadoIngreso;
}

export interface IngresoResponse {
  id: string;
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: Decimal;
  fecha: Date;
  tipoComprobante: TipoComprobante;
  estado: EstadoIngreso;
  igss: Decimal;
  ivaIsr: Decimal;
  ingresoNeto: Decimal;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngresoKPIs {
  totalIngresosBrutos: number;
  previsionImpuestos: number;
  retencionesIgss: number;
  ingresoNetoReal: number;
}