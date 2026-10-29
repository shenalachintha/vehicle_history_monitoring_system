import { Router } from 'express';
import {
  MileageController,
  singleMileageSchema,
  bulkMileageSchema,
} from '../controllers/mileage.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', MileageController.list);
router.get('/missing-weekly', MileageController.getMissingWeekly);
router.post(
  '/record',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER', 'MILEAGE_RECORDER']),
  validate(singleMileageSchema),
  MileageController.recordSingle
);
router.post(
  '/bulk',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER', 'MILEAGE_RECORDER']),
  validate(bulkMileageSchema),
  MileageController.recordBulk
);

export default router;

