import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string({
    required_error: 'El token de Google (idToken) es obligatorio.',
  }),
});

export type GoogleLoginDTO = z.infer<typeof googleLoginSchema>;