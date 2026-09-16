import { z } from 'zod';

export const TipoIngresoEnum = z.enum([
  'SALARIO',
  'SERVICIOS_PROFESIONALES',
  'VENTA',
  'ALQUILER',
  'INTERES',
  'REEMBOLSO',
  'OTRO',
]);

export const TipoComprobanteEnum = z.enum(['SALARIO', 'FACTURA']);
export const CategoriaIngresoEnum = z.enum(['SERVICIOS', 'PLANILLA', 'PRODUCTOS', 'CONSULTORIA', 'OTROS']);
export const EstadoIngresoEnum = z.enum(['PAGADO', 'PENDIENTE', 'ANULADO']);

const baseIngresoSchema = z.object({
  clienteOrigen: z.string().min(1, 'El cliente/origen es requerido').max(200),
  descripcion: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  categoria: CategoriaIngresoEnum,
  tipoIngreso: TipoIngresoEnum,
  montoBruto: z.coerce.number().positive('El monto bruto debe ser mayor a 0'),
  fecha: z.coerce.date({ message: 'Fecha inválida' }),
  tipoComprobante: TipoComprobanteEnum,
  estado: EstadoIngresoEnum.optional(),
});

export const createIngresoSchema = baseIngresoSchema;
export const updateIngresoSchema = baseIngresoSchema.partial();

export type CreateIngresoDTO = z.infer<typeof createIngresoSchema>;
export type UpdateIngresoDTO = z.infer<typeof updateIngresoSchema>;