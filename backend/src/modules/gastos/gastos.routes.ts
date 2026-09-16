import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import * as controller from './gastos.controller';

const router = Router();

// Todas las rutas requieren token de autenticación válido
router.use(authMiddleware);

// Rutas de LECTURA (Disponibles para cualquier usuario autenticado)
router.get('/', controller.listar);
router.get('/kpis', controller.kpis);

// Rutas de MUTACIÓN (Protegidas exclusivamente para Administradores)
router.post('/', requireAdmin, controller.crear);
router.put('/:id', requireAdmin, controller.actualizar);
router.delete('/:id', requireAdmin, controller.eliminar);

export default router;