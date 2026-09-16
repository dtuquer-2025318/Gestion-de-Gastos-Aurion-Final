import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as ingresoService from './ingresos.service';
import { createIngresoSchema, updateIngresoSchema } from './dto/ingresos.dto';
import { catchAsync } from '../../utils/catch-async';

export const listar = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const ingresos = await ingresoService.listarIngresos(authReq.user.userId);
  res.json({ success: true, data: ingresos });
});

export const crear = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createIngresoSchema.parse(req.body);
  const ingreso = await ingresoService.crearIngreso(parsed, authReq.user.userId);
  res.status(201).json({ success: true, data: ingreso });
});

export const actualizar = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = updateIngresoSchema.parse(req.body);
  const ingreso = await ingresoService.actualizarIngreso(req.params.id, parsed, authReq.user.userId);
  res.json({ success: true, data: ingreso });
});

export const anular = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const ingreso = await ingresoService.anularIngreso(req.params.id, authReq.user.userId);
  res.json({ success: true, data: ingreso });
});

export const kpis = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await ingresoService.obtenerKPIs(authReq.user.userId);
  res.json({ success: true, data });
});