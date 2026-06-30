import mongoose from 'mongoose';
import WorkoutLog from '../models/WorkoutLog.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import User from '../models/User.js';
import { estimateCaloriesBurned } from '../services/calorieService.js';

function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const diffToMon = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - diffToMon);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

async function ensureLogCalories(log, plan, user) {
  if (!log || log.caloriesBurned > 0 || !plan || !user?.weight || !user?.height) return log;

  const day = (plan.days || []).find(d => d.dayNumber === log.dayNumber);
  if (!day) return log;

  log.caloriesBurned = await estimateCaloriesBurned({
    weight: user.weight,
    height: user.height,
    day,
    planTitle: plan.title,
  });
  await log.save();
  return log;
}

export const logWorkout = async (req, res) => {
  try {
    const { workoutPlanId, dayNumber } = req.body;
    if (!workoutPlanId || dayNumber == null) {
      return res.status(400).json({ success: false, message: 'workoutPlanId and dayNumber are required', data: null });
    }

    const [plan, user] = await Promise.all([
      WorkoutPlan.findById(workoutPlanId),
      User.findById(req.user.id).select('weight height name'),
    ]);

    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found', data: null });
    if (plan.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    }

    const dayNum = Number(dayNumber);
    const day = (plan.days || []).find(d => d.dayNumber === dayNum);
    if (!day) {
      return res.status(404).json({ success: false, message: 'Day not found in plan', data: null });
    }

    if (!user?.weight || !user?.height) {
      return res.status(400).json({
        success: false,
        message: 'Please add your weight and height in My Profile before logging workouts.',
        data: null,
      });
    }

    const existing = await WorkoutLog.findOne({
      user: req.user.id,
      workoutPlan: workoutPlanId,
      dayNumber: dayNum,
    });
    if (existing) {
      const hadCalories = existing.caloriesBurned > 0;
      const updated = await ensureLogCalories(existing, plan, user);
      if (updated.caloriesBurned > 0 && !hadCalories) {
        return res.json({ success: true, message: 'Calories calculated', data: updated });
      }
      return res.status(409).json({ success: false, message: 'Day already logged', data: updated });
    }

    const caloriesBurned = await estimateCaloriesBurned({
      weight: user.weight,
      height: user.height,
      day,
      planTitle: plan.title,
    });

    const log = await WorkoutLog.create({
      user: req.user.id,
      workoutPlan: workoutPlanId,
      dayNumber: dayNum,
      caloriesBurned,
      completed: true,
    });

    return res.status(201).json({ success: true, message: 'Workout logged', data: log });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const unlogWorkout = async (req, res) => {
  try {
    const { planId, dayNumber } = req.params;
    const dayNum = Number(dayNumber);
    if (!planId || Number.isNaN(dayNum)) {
      return res.status(400).json({ success: false, message: 'planId and dayNumber are required', data: null });
    }

    const plan = await WorkoutPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found', data: null });
    if (plan.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    }

    const log = await WorkoutLog.findOneAndDelete({
      user: req.user.id,
      workoutPlan: planId,
      dayNumber: dayNum,
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found', data: null });
    }

    return res.json({ success: true, message: 'Workout unlogged', data: null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getMyLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await WorkoutLog.countDocuments({ user: req.user.id });
    const logs = await WorkoutLog.find({ user: req.user.id })
      .populate('workoutPlan', 'title')
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return res.json({ success: true, message: 'OK', data: { items: logs, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getLogsByPlan = async (req, res) => {
  try {
    const [logs, plan, user] = await Promise.all([
      WorkoutLog.find({ user: req.user.id, workoutPlan: req.params.planId }).sort({ dayNumber: 1 }),
      WorkoutPlan.findById(req.params.planId),
      User.findById(req.user.id).select('weight height'),
    ]);

    const updated = [];
    for (const log of logs) {
      updated.push(await ensureLogCalories(log, plan, user));
    }

    return res.json({ success: true, message: 'OK', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalWorkoutsCompleted = await WorkoutLog.countDocuments({ user: userId, completed: true });

    const distinctPlans = await WorkoutLog.distinct('workoutPlan', { user: userId });
    const plansStarted = distinctPlans.length;

    const logs = await WorkoutLog.find({ user: userId, completed: true })
      .select('completedAt')
      .sort({ completedAt: -1 });

    let currentStreak = 0;
    if (logs.length) {
      const toDateStr = d => d.toISOString().slice(0, 10);
      const uniqueDays = [...new Set(logs.map(l => toDateStr(new Date(l.completedAt))))].sort().reverse();
      const today = toDateStr(new Date());
      const yesterday = toDateStr(new Date(Date.now() - 86400000));

      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        let expected = uniqueDays[0];
        for (const day of uniqueDays) {
          if (day === expected) {
            currentStreak++;
            const d = new Date(expected);
            d.setDate(d.getDate() - 1);
            expected = toDateStr(d);
          } else {
            break;
          }
        }
      }
    }

    return res.json({ success: true, message: 'OK', data: { totalWorkoutsCompleted, currentStreak, plansStarted } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getWeeklyRanking = async (req, res) => {
  try {
    const { start, end } = getWeekBounds();
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [ranked, totalParticipantsAgg, myAgg] = await Promise.all([
      WorkoutLog.aggregate([
        {
          $match: {
            completed: true,
            completedAt: { $gte: start, $lt: end },
            caloriesBurned: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$user',
            totalCalories: { $sum: '$caloriesBurned' },
            sessions: { $sum: 1 },
          },
        },
        { $sort: { totalCalories: -1 } },
        { $limit: 15 },
      ]),
      WorkoutLog.aggregate([
        {
          $match: {
            completed: true,
            completedAt: { $gte: start, $lt: end },
            caloriesBurned: { $gt: 0 },
          },
        },
        { $group: { _id: '$user' } },
        { $count: 'count' },
      ]),
      WorkoutLog.aggregate([
        {
          $match: {
            user: userId,
            completed: true,
            completedAt: { $gte: start, $lt: end },
            caloriesBurned: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalCalories: { $sum: '$caloriesBurned' },
            sessions: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalParticipants = totalParticipantsAgg[0]?.count || 0;

    const userIds = ranked.map(r => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name profileImage');
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const ranking = ranked.map((row, i) => ({
      rank: i + 1,
      userId: row._id,
      name: userMap[row._id.toString()]?.name || 'GlowHer member',
      profileImage: userMap[row._id.toString()]?.profileImage || '',
      totalCalories: row.totalCalories,
      sessions: row.sessions,
      isCurrentUser: row._id.toString() === req.user.id,
    }));

    const myTotal = myAgg[0]?.totalCalories || 0;
    let myStats = ranking.find(r => r.isCurrentUser) || null;

    if (!myStats && myTotal > 0) {
      const ahead = await WorkoutLog.aggregate([
        {
          $match: {
            completed: true,
            completedAt: { $gte: start, $lt: end },
            caloriesBurned: { $gt: 0 },
          },
        },
        { $group: { _id: '$user', totalCalories: { $sum: '$caloriesBurned' } } },
        { $match: { totalCalories: { $gt: myTotal } } },
        { $count: 'count' },
      ]);
      const me = await User.findById(req.user.id).select('name profileImage');
      myStats = {
        rank: (ahead[0]?.count || 0) + 1,
        userId: req.user.id,
        name: me?.name || 'You',
        profileImage: me?.profileImage || '',
        totalCalories: myTotal,
        sessions: myAgg[0]?.sessions || 0,
        isCurrentUser: true,
      };
    }

    return res.json({
      success: true,
      message: 'OK',
      data: {
        weekStart: start,
        weekEnd: end,
        ranking,
        myStats,
        myWeekTotal: myTotal,
        totalParticipants,
        myRank: myStats?.rank ?? null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};
