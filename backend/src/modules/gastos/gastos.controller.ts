import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as gastosService from './gastos.service';
import { createGastoSchema, updateGastoSchema } from './dto/gastos.dto';
import { catchAsync } from '../../utils/catch-async';

export const listar = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await gastosService.listarGastos(authReq.user.userId);
  res.json({ success: true, data });
});

export const kpis = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await gastosService.obtenerKPIs(authReq.user.userId);
  res.json({ success: true, data });
});

export const crear = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createGastoSchema.parse(req.body);
  const data = await gastosService.crearGasto(parsed, authReq.user.userId);
  res.status(201).json({ success: true, data });
});

export const actualizar = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = updateGastoSchema.parse(req.body);
  const data = await gastosService.actualizarGasto(req.params.id, parsed, authReq.user.userId);
  res.json({ success: true, data });
});

export const eliminar = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await gastosService.eliminarGasto(req.params.id, authReq.user.userId);
  res.json({ success: true, message: 'Gasto eliminado exitosamente' });
});