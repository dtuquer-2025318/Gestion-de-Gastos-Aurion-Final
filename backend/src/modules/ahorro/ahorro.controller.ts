import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as ahorroService from './ahorro.service';
import { createMetaSchema, createMovimientoSchema } from './dto/ahorro.dto';
import { catchAsync } from '../../utils/catch-async';

export const listarMetas = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await ahorroService.listarMetas(authReq.user.userId);
  res.json({ success: true, data });
});

export const crearMeta = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createMetaSchema.parse(req.body);
  const data = await ahorroService.crearMeta(parsed, authReq.user.userId);
  res.status(201).json({ success: true, data });
});

export const registrarMovimiento = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createMovimientoSchema.parse(req.body);
  const data = await ahorroService.registrarMovimiento(req.params.id, parsed, authReq.user.userId);
  res.status(201).json({ success: true, data });
});

export const obtenerHistorial = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await ahorroService.obtenerHistorial(req.params.id, authReq.user.userId);
  res.json({ success: true, data });
});