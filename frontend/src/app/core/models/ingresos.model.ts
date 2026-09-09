export type TipoComprobante = 'SALARIO' | 'FACTURA';
export type CategoriaIngreso = | 'SERVICIOS' | 'PLANILLA' | 'PRODUCTOS' | 'CONSULTORIA' | 'HONORARIOS'| 'VENTAS'| 'ALQUILERES'| 'INTERESES'| 'REIMBOLSOS'| 'OTROS';
export type EstadoIngreso = 'PAGADO' | 'PENDIENTE' | 'ANULADO';

export interface Ingreso {
  id: string;
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado: EstadoIngreso;
  igss: number;
  ivaIsr: number;
  ingresoNeto: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  noComprobante?: string;
  descripcion?: string;
}

export interface IngresoKPIs {
  totalIngresosBrutos: number;
  previsionImpuestos: number;
  retencionesIgss: number;
  ingresoNetoReal: number;
}

export interface CreateIngresoPayload {
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado?: EstadoIngreso;
  noComprobante?: string;
  descripcion?: string;
}

export interface UpdateIngresoPayload {
  clienteOrigen?: string;
  categoria?: CategoriaIngreso;
  montoBruto?: number;
  fecha?: string;
  tipoComprobante?: TipoComprobante;
  estado?: EstadoIngreso;
  noComprobante?: string;
  descripcion?: string;
}

// Alias para mantener compatibilidad si el service/component usa la nomenclatura DTO
export type CreateIngresoDTO = CreateIngresoPayload;