import { Router } from 'express';
import { getAllExercises, getExerciseById, createExercise, seedExercises, syncExerciseVideos } from '../controllers/exerciseController.js';
import { authentication } from '../middlewares/auth.js';

const router = Router();

router.get('/', getAllExercises);
router.get('/:id', getExerciseById);
router.post('/seed', seedExercises);
router.post('/sync-videos', syncExerciseVideos);
router.post('/', authentication, createExercise);

export default router;
