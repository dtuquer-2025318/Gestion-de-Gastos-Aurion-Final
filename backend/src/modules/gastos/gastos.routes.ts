import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as controller from './gastos.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listar);
router.get('/kpis', controller.kpis);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

export default router;