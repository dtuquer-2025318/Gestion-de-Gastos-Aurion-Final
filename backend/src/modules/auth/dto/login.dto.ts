import { z } from 'zod';

/**
 * Esquema de validación Zod para el inicio de sesión.
 * Valida que el email tenga formato correcto y que la contraseña no esté vacía.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .min(1, 'El correo electrónico es obligatorio')
    .email('El formato del correo electrónico no es válido'),

  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

/**
 * Tipo inferido del esquema de login.
 * Garantiza que el controller y el service usen el mismo contrato de datos.
 */
export type LoginDTO = z.infer<typeof loginSchema>;