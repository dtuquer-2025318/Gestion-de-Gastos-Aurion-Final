import { z } from 'zod';

const COMMON_PASSWORDS = [
  '123456', 'password', 'qwerty', '111111', '12345678',
  'abc123', 'password123', '123456789', '1234567890', 'admin', 'aurion'
];

export const registerSchema = z.object({
  username: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, guiones y puntos')
    .trim(),

  firstName: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),

  lastName: z
    .string({ required_error: 'El apellido es obligatorio' })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .trim(),

  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .min(1, 'El correo electrónico es obligatorio')
    .email('El formato del correo electrónico no es válido')
    .max(255, 'El correo electrónico es demasiado largo')
    .trim()
    .toLowerCase(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
    errorMap: () => ({ message: 'Seleccione un género válido' }),
  }),

  birthDate: z
    .string({ required_error: 'La fecha de nacimiento es obligatoria' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' })
    .refine((val) => {
      const birth = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 18;
    }, { message: 'Debe ser mayor de 18 años para registrarse' }),

  phone: z
    .string({ required_error: 'El número de teléfono es obligatorio' })
    .regex(/^[0-9]{8,15}$/, 'Ingrese un número de teléfono válido (mínimo 8 dígitos)'),

  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .refine((val) => !COMMON_PASSWORDS.includes(val.toLowerCase()), {
      message: 'Tu contraseña es muy débil.',
    })
    .refine((val) => !/^\d+$/.test(val), {
      message: 'Tu contraseña es muy débil. Usa una combinación de letras y números.',
    })
    .refine(
      (val) =>
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[^A-Za-z0-9]/.test(val),
      {
        message: 'Usa mayúsculas, minúsculas, números y símbolos especiales.',
      }
    ),
});

export type RegisterDTO = z.infer<typeof registerSchema>;