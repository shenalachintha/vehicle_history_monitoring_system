import { Router } from 'express';
import { VehicleController, vehicleCreateSchema } from '../controllers/vehicle.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', VehicleController.list);
router.get('/:id', VehicleController.getById);
router.post(
  '/',
  authorize(['ADMIN', 'FLEET_MANAGER']),
  validate(vehicleCreateSchema),
  VehicleController.create
);
router.put('/:id', authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']), VehicleController.update);
router.delete('/:id', authorize(['ADMIN']), VehicleController.delete);

export default router;

