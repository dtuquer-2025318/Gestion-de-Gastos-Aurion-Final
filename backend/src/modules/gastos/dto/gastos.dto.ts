import { z } from 'zod';
import { CategoriaGasto, EstadoGasto } from '@prisma/client';

// Mensajes de error centralizados como constantes
export const GASTO_ERROR_MESSAGES = {
  FECHA_FUTURA: 'La fecha no puede ser posterior al día de hoy.',
  FECHA_INVALIDA: 'Ingrese una fecha válida.',
  MONTO_INVALIDO: 'No se permiten valores negativos.',
  MONTO_REQUERIDO: 'El monto debe ser un número válido mayor a 0.',
  PROVEEDOR_REQUERIDO: 'El proveedor o beneficiario es requerido.',
  CATEGORIA_INVALIDA: 'Seleccione una categoría de gasto válida.',
} as const;

export const createGastoSchema = z.object({
  // Regla 2: Validación de fecha no futura
  fecha: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date({ invalid_type_error: GASTO_ERROR_MESSAGES.FECHA_INVALIDA }).refine((val) => {
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      return val <= hoy;
    }, { message: GASTO_ERROR_MESSAGES.FECHA_FUTURA })
  ),

  proveedorBeneficiario: z
    .string({ required_error: GASTO_ERROR_MESSAGES.PROVEEDOR_REQUERIDO })
    .trim()
    .min(1, GASTO_ERROR_MESSAGES.PROVEEDOR_REQUERIDO),

  // Regla 1: Categorías personales de gasto
  categoria: z.nativeEnum(CategoriaGasto, {
    errorMap: () => ({ message: GASTO_ERROR_MESSAGES.CATEGORIA_INVALIDA }),
  }),

  // Regla 3: Validación de monto (No negativos, debe ser mayor a 0)
  montoTotal: z
    .number({ invalid_type_error: GASTO_ERROR_MESSAGES.MONTO_REQUERIDO })
    .refine((val) => val >= 0, { message: GASTO_ERROR_MESSAGES.MONTO_INVALIDO })
    .refine((val) => val > 0, { message: GASTO_ERROR_MESSAGES.MONTO_REQUERIDO }),

  estado: z.nativeEnum(EstadoGasto).default(EstadoGasto.PAGADO),
  comprobanteUrl: z.string().url().optional().nullable(),
});

export const updateGastoSchema = createGastoSchema.partial();

export type CreateGastoDTO = z.infer<typeof createGastoSchema>;
export type UpdateGastoDTO = z.infer<typeof updateGastoSchema>;