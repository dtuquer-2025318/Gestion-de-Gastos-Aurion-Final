// backend/src/modules/users/users.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import * as controller from './users.controller';

const router = Router();

// Lectura (ADMIN y USER)
router.get('/', authMiddleware, controller.listar);
router.get('/kpis', authMiddleware, controller.kpis);

// Modificación (EXCLUSIVO ADMIN)
router.put('/:id', authMiddleware, requireAdmin, controller.actualizar);
router.patch('/:id/toggle', authMiddleware, requireAdmin, controller.toggleEstado);
router.patch('/:id/deshabilitar', authMiddleware, requireAdmin, controller.deshabilitar);

export default router;