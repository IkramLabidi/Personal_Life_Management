import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { dashboard } from '../controllers/dashboardController.js';
import { monthlyReport } from '../controllers/reportController.js';

const router = Router();
router.use(protect);

router.get('/dashboard', dashboard);
router.get('/report/monthly', monthlyReport);

export default router;
