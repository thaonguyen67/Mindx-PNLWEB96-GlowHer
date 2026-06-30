import { Router } from 'express';
import authRouter from './auth.js';
import exerciseRouter from './exercises.js';
import workoutPlanRouter from './workoutPlans.js';
import workoutLogRouter from './workoutLogs.js';
import userRouter from './users.js';

const rootRouter = Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/exercises', exerciseRouter);
rootRouter.use('/workout-plans', workoutPlanRouter);
rootRouter.use('/workout-logs', workoutLogRouter);
rootRouter.use('/users', userRouter);

export default rootRouter;
