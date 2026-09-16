export type EstadoMeta = 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
export type TipoMovimientoAhorro = 'APORTE' | 'RETIRO';

export interface ProgresoMeta {
  montoMeta: number;
  ahorrado: number;
  restante: number;
  porcentaje: number;
  estado: EstadoMeta;
}

export interface MetaAhorro {
  id: string;
  nombre: string;
  montoMeta: number;
  estado: EstadoMeta;
  createdAt: string;
  progreso: ProgresoMeta;
}

export interface MovimientoAhorro {
  id: string;
  tipo: TipoMovimientoAhorro;
  monto: number;
  descripcion?: string | null;
  fecha: string;
}

export interface CrearMetaPayload {
  nombre: string;
  montoMeta: number;
}

export interface RegistrarMovimientoPayload {
  tipo: TipoMovimientoAhorro;
  monto: number;
  descripcion?: string;
}