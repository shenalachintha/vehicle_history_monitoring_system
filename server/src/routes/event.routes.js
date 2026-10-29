import { Router } from 'express';
import { EventController, eventCreateSchema } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', EventController.list);
router.get('/:id', EventController.getById);
router.post(
  '/',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  validate(eventCreateSchema),
  EventController.create
);

export default router;

