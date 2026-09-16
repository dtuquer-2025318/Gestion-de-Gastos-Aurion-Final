import { z } from 'zod';
import { Role, Gender } from '@prisma/client';

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthDate: z.coerce.date().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;