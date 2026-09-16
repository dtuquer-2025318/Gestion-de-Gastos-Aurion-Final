import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as controller from './ahorro.controller';

const router = Router();

router.use(authMiddleware);

router.get('/metas', controller.listarMetas);
router.post('/metas', controller.crearMeta);
router.post('/metas/:id/movimientos', controller.registrarMovimiento);
router.get('/metas/:id/movimientos', controller.obtenerHistorial);

export default router;