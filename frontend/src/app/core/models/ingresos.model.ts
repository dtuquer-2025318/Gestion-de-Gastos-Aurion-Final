export type TipoIngreso =
  | 'SALARIO'
  | 'SERVICIOS_PROFESIONALES'
  | 'VENTA'
  | 'ALQUILER'
  | 'INTERES'
  | 'REEMBOLSO'
  | 'OTRO';

export type TipoComprobante = 'SALARIO' | 'FACTURA';
export type CategoriaIngreso = 'SERVICIOS' | 'PLANILLA' | 'PRODUCTOS' | 'CONSULTORIA' | 'OTROS';
export type EstadoIngreso = 'PAGADO' | 'PENDIENTE' | 'ANULADO';

export interface DesgloseFiscalDTO {
  baseImponible: number;
  iva: number;
  isr: number;
  igss: number;
  ivaPendientePago: number;
  neto: number;
  cuentaComoIngreso: boolean;
}

export interface Ingreso {
  id: string;
  clienteOrigen: string;
  descripcion?: string | null;
  categoria: CategoriaIngreso;
  tipoIngreso: TipoIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado: EstadoIngreso;
  igss: number;
  ivaIsr: number;
  ivaPendientePago: number;
  ingresoNeto: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngresoKPIs {
  totalIngresosBrutos: number;
  retencionIsr: number;
  retencionesIgss: number;
  ivaPendientePago: number;
  ingresoNetoReal: number;
}

export interface CreateIngresoPayload {
  clienteOrigen: string;
  descripcion?: string;
  categoria: CategoriaIngreso;
  tipoIngreso: TipoIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado?: EstadoIngreso;
}

export interface UpdateIngresoPayload extends Partial<CreateIngresoPayload> {}
export type CreateIngresoDTO = CreateIngresoPayload;