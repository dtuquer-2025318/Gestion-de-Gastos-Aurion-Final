import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Clase de error controlado de la aplicación.
 * Permite lanzar errores HTTP con código de estado y mensaje definidos.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Formatea los errores de validación Zod en un mensaje legible.
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return issues.join(' | ');
}

/**
 * Middleware global de manejo de errores.
 * Captura cualquier error lanzado en los controllers o servicios y responde
 * con un JSON estandarizado. NUNCA expone detalles internos en producción.
 */
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Error interno del servidor. Por favor intenta más tarde.';

  // ── Errores controlados de la aplicación ──
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ── Errores de validación Zod ──
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = `Datos inválidos: ${formatZodError(err)}`;
  }

  // ── Errores de Prisma ──
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'campo';
      statusCode = 409;
      message = `El ${field} ya está en uso. Por favor utiliza otro valor.`;
    }
    // P2025: Record not found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'El recurso solicitado no fue encontrado.';
    }
    // P2003: Foreign key constraint failed
    else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'No se puede completar la operación porque el recurso relacionado no existe.';
    }
    else {
      statusCode = 500;
      message = 'Error en la base de datos. Por favor intenta más tarde.';
    }
  }

  // ── Errores de JWT ──
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'La sesión ha expirado. Por favor inicia sesión nuevamente.';
  }
  else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Token de autenticación inválido.';
  }

  // ── Errores de sintaxis JSON ──
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido.';
  }

  // En desarrollo, incluimos el stack trace para facilitar debugging
  const isDev = env.NODE_ENV === 'development';

  const response: Record<string, unknown> = {
    success: false,
    statusCode,
    message,
  };

  if (isDev) {
    response.stack = err.stack;
    response.errorName = err.name;
  }

  res.status(statusCode).json(response);
};
