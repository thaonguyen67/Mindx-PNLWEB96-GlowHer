import { Router } from 'express';
import { logWorkout, unlogWorkout, getMyLogs, getLogsByPlan, getProgress, getWeeklyRanking } from '../controllers/workoutLogController.js';
import { authentication } from '../middlewares/auth.js';

const router = Router();

router.use(authentication);

router.post('/', logWorkout);
router.get('/', getMyLogs);
router.get('/progress', getProgress);
router.get('/weekly-ranking', getWeeklyRanking);
router.delete('/plan/:planId/day/:dayNumber', unlogWorkout);
router.get('/plan/:planId', getLogsByPlan);

export default router;
