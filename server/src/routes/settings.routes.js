import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', SettingsController.get);
router.put('/', authenticate, authorize(['ADMIN', 'FLEET_MANAGER']), SettingsController.update);

export default router;

