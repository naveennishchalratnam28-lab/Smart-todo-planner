import express from 'express';
import { getSchedule, logProgress, seedDemoData } from '../controllers/planner.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = express.Router();

router.use(authMiddleware);

router.get('/schedule', getSchedule);
router.post('/progress', logProgress);
router.post('/seed', seedDemoData);

export default router;
