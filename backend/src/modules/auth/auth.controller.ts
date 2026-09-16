import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { loginSchema } from './dto/login.dto';
import { registerSchema } from './dto/register.dto';
import { googleLoginSchema } from './dto/google-login.dto';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.',
      user: result.user,
    });
  });

  static login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: result.user,
      token: result.token,
    });
  });

  static googleLogin = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { idToken } = googleLoginSchema.parse(req.body);
    const result = await AuthService.googleLogin(idToken);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión con Google exitoso',
      user: result.user,
      token: result.token,
    });
  });

  static getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    const user = await AuthService.getMe(userId);

    res.status(200).json({
      success: true,
      user,
    });
  });
}