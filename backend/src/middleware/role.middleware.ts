import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware de autorización por rol.
 * Requiere que el usuario autenticado tenga rol ADMIN.
 */
export const requireAdmin: RequestHandler = (req, res, next): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Acceso denegado. Usuario no autenticado.',
    });
    return;
  }

  if (authReq.user.role !== 'ADMIN') {
    res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Acceso denegado. Se requieren privilegios de administrador.',
    });
    return;
  }

  next();
};