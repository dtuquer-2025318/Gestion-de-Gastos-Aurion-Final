import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import * as controller from './ingresos.controller';

const router = Router();

router.get('/', authMiddleware, controller.listar);
router.get('/kpis', authMiddleware, controller.kpis);

router.post('/', authMiddleware, requireAdmin, controller.crear);
router.put('/:id', authMiddleware, requireAdmin, controller.actualizar);
router.patch('/:id/anular', authMiddleware, requireAdmin, controller.anular);

export default router;