import { z } from 'zod';

export const TipoComprobanteEnum = z.enum(['SALARIO', 'FACTURA']);
export const CategoriaIngresoEnum = z.enum(['SERVICIOS', 'PLANILLA', 'PRODUCTOS', 'CONSULTORIA', 'OTROS']);
export const EstadoIngresoEnum = z.enum(['PAGADO', 'PENDIENTE', 'ANULADO']);

const baseIngresoSchema = z.object({
  clienteOrigen: z.string().min(1, 'El cliente/origen es requerido').max(200),
  categoria: CategoriaIngresoEnum,
  montoBruto: z.coerce.number().positive('El monto bruto debe ser mayor a 0'),
  fecha: z.coerce.date({ message: 'Fecha inválida' }),
  tipoComprobante: TipoComprobanteEnum,
  estado: EstadoIngresoEnum.optional(),
});

const validarRelacionCategoriaComprobante = (data: { categoria?: string; tipoComprobante?: string }) => {
  if (data.categoria && data.tipoComprobante) {
    if (data.categoria === 'PLANILLA' && data.tipoComprobante !== 'SALARIO') {
      return false;
    }
    if (
      ['SERVICIOS', 'PRODUCTOS', 'CONSULTORIA'].includes(data.categoria) &&
      data.tipoComprobante !== 'FACTURA'
    ) {
      return false;
    }
  }
  return true;
};

export const createIngresoSchema = baseIngresoSchema.refine(validarRelacionCategoriaComprobante, {
  message: 'Relación inválida: PLANILLA exige comprobante SALARIO, mientras que SERVICIOS, PRODUCTOS y CONSULTORIA exigen FACTURA.',
  path: ['tipoComprobante'],
});

export const updateIngresoSchema = baseIngresoSchema.partial().refine(validarRelacionCategoriaComprobante, {
  message: 'Relación inválida entre la categoría y el comprobante.',
  path: ['tipoComprobante'],
});

export type CreateIngresoDTO = z.infer<typeof createIngresoSchema>;
export type UpdateIngresoDTO = z.infer<typeof updateIngresoSchema>;