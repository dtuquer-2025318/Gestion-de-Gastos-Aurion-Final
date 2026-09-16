import { Request, Response } from 'express';
import * as userService from './users.service';
import { updateUserSchema } from './dto/users.dto';
import { catchAsync } from '../../utils/catch-async';

// Obtener la lista completa de usuarios
export const listar = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.listarUsuarios();
  res.json({ success: true, data: users });
});

// Obtener las métricas/KPIs de usuarios
export const kpis = catchAsync(async (_req: Request, res: Response) => {
  const data = await userService.obtenerKPIs();
  res.json({ success: true, data });
});

// Actualizar un usuario por ID
export const actualizar = catchAsync(async (req: Request, res: Response) => {
  const parsed = updateUserSchema.parse(req.body);
  const user = await userService.actualizarUsuario(req.params.id, parsed);
  res.json({ success: true, data: user });
});

// Alternar estado activo/inactivo (Toggle)
export const toggleEstado = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.toggleEstadoUsuario(req.params.id);
  res.json({ success: true, data: user });
});

// Soft Delete (Deshabilitar usuario)
export const deshabilitar = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.softDeleteUsuario(req.params.id);
  res.json({ success: true, data: user });
});