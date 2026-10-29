import { Router } from 'express';
import { MaintenanceController, ruleSchema } from '../controllers/maintenance.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', MaintenanceController.list);
router.post(
  '/',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  validate(ruleSchema),
  MaintenanceController.create
);
router.put(
  '/:id',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  MaintenanceController.update
);
router.delete('/:id', authorize(['ADMIN', 'FLEET_MANAGER']), MaintenanceController.delete);

export default router;

