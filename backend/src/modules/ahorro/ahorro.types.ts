import { EstadoMeta, TipoMovimientoAhorro } from '@prisma/client';

export interface ProgresoMeta {
  montoMeta: number;
  ahorrado: number;
  restante: number;
  porcentaje: number;
  estado: EstadoMeta;
}

export interface MetaAhorroResponse {
  id: string;
  nombre: string;
  montoMeta: number;
  estado: EstadoMeta;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  progreso: ProgresoMeta;
}

export interface MovimientoAhorroResponse {
  id: string;
  tipo: TipoMovimientoAhorro;
  monto: number;
  descripcion?: string | null;
  fecha: Date;
}