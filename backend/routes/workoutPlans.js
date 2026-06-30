import { Router } from 'express';
import { generatePlan, getMyPlans, getPlanById, deletePlan } from '../controllers/workoutPlanController.js';
import { authentication, optionalAuthentication } from '../middlewares/auth.js';

const router = Router();

router.post('/generate', optionalAuthentication, generatePlan);
router.use(authentication);
router.get('/', getMyPlans);
router.get('/:id', getPlanById);
router.delete('/:id', deletePlan);

export default router;
