import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AlertController.list);
router.post(
  '/:id/acknowledge',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  AlertController.acknowledge
);
router.post(
  '/:id/resolve',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  AlertController.resolve
);
router.post(
  '/evaluate',
  authorize(['ADMIN', 'FLEET_MANAGER']),
  AlertController.triggerEvaluation
);

export default router;

