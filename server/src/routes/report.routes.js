import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-summary', ReportController.getDashboardSummary);
router.get('/export-vehicles', ReportController.exportVehiclesCSV);
router.get('/export-expenditure', ReportController.exportExpenditureCSV);

export default router;

