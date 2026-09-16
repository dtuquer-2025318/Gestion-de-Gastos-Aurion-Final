import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Tipo para funciones controller async.
 */
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wrapper que captura errores de funciones async y los pasa al middleware de errores de Express.
 * Elimina la necesidad de escribir try/catch en cada método del controller.
 */
export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
