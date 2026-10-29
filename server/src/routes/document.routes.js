import { Router } from 'express';
import { DocumentController, documentCreateSchema, documentUpdateSchema } from '../controllers/document.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', DocumentController.list);
router.post(
  '/',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  validate(documentCreateSchema),
  DocumentController.create
);
router.put(
  '/:id',
  authorize(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']),
  validate(documentUpdateSchema),
  DocumentController.update
);
router.delete('/:id', authorize(['ADMIN', 'FLEET_MANAGER']), DocumentController.delete);

export default router;
