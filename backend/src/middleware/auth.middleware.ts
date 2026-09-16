import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 * Si es válido, adjunta req.user con { userId, email, role }.
 * Si es inválido o expirado, responde 401.
 */
export const authMiddleware: RequestHandler = (req, res, next): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Acceso denegado. Token no proporcionado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    // Asignamos directamente porque AuthenticatedRequest extiende Request
    (req as AuthenticatedRequest).user = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'La sesión ha expirado. Por favor inicia sesión nuevamente.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token inválido. Acceso denegado.',
    });
  }
};