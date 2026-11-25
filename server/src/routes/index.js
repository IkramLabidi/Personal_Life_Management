import { Router } from 'express';
import authRoutes from './authRoutes.js';
import financeRoutes from './financeRoutes.js';
import plannerRoutes from './plannerRoutes.js';
import healthRoutes from './healthRoutes.js';
import studyRoutes from './studyRoutes.js';
import calendarRoutes from './calendarRoutes.js';
import goalRoutes from './goalRoutes.js';
import journalRoutes from './journalRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/finance', financeRoutes);
router.use('/planner', plannerRoutes);
router.use('/health', healthRoutes);
router.use('/study', studyRoutes);
router.use('/calendar', calendarRoutes);
router.use('/goals', goalRoutes);
router.use('/journal', journalRoutes);
router.use('/', dashboardRoutes);

export default router;
