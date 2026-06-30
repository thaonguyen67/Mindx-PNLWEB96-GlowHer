import { Router } from 'express';
import { getProfile, updateProfile, uploadProfileImage, toggleFavoriteExercise, saveWorkoutPlan, removeSavedWorkoutPlan, upload } from '../controllers/userController.js';
import { authentication } from '../middlewares/auth.js';

const router = Router();

router.use(authentication);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/upload', upload.single('profileImage'), uploadProfileImage);
router.post('/favorites/toggle', toggleFavoriteExercise);
router.post('/saved-plans', saveWorkoutPlan);
router.delete('/saved-plans/:planId', removeSavedWorkoutPlan);

export default router;
