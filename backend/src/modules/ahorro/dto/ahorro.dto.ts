import { z } from 'zod';
import { TipoMovimientoAhorro } from '@prisma/client';

export const AHORRO_ERROR_MESSAGES = {
  NOMBRE_REQUERIDO: 'El nombre de la meta es requerido.',
  MONTO_INVALIDO: 'El monto debe ser un número válido mayor a 0.',
  DESCRIPCION_REPETIDA: 'La descripción es requerida para retiros de emergencia.',
} as const;

export const createMetaSchema = z.object({
  nombre: z.string().trim().min(1, AHORRO_ERROR_MESSAGES.NOMBRE_REQUERIDO),
  montoMeta: z
    .number({ invalid_type_error: AHORRO_ERROR_MESSAGES.MONTO_INVALIDO })
    .positive(AHORRO_ERROR_MESSAGES.MONTO_INVALIDO),
});

export const createMovimientoSchema = z
  .object({
    tipo: z.nativeEnum(TipoMovimientoAhorro),
    monto: z
      .number({ invalid_type_error: AHORRO_ERROR_MESSAGES.MONTO_INVALIDO })
      .positive(AHORRO_ERROR_MESSAGES.MONTO_INVALIDO),
    descripcion: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'RETIRO' && (!data.descripcion || !data.descripcion.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['descripcion'],
        message: AHORRO_ERROR_MESSAGES.DESCRIPCION_REPETIDA,
      });
    }
  });

export type CreateMetaDTO = z.infer<typeof createMetaSchema>;
export type CreateMovimientoDTO = z.infer<typeof createMovimientoSchema>;