import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage() });

const profileSelect = '-password -refreshToken';

const fetchProfileUser = (userId) =>
  User.findById(userId)
    .select(profileSelect)
    .populate('favoriteExercises', 'name nameVi bodyPart equipment difficulty video description descriptionVi benefits benefitsVi')
    .populate('savedWorkoutPlans', 'title goal type durationWeeks daysPerWeek targetBodyParts createdAt days');

export const getProfile = async (req, res) => {
  try {
    const user = await fetchProfileUser(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null });
    return res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, weight, height } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, weight, height },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'User not found', data: null });
    const user = await fetchProfileUser(req.user.id);
    return res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided', data: null });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUrl, {
      resource_type: 'auto',
      folder: 'glowher/profiles',
    });
    await User.findByIdAndUpdate(req.user.id, { profileImage: result.secure_url });
    const user = await fetchProfileUser(req.user.id);
    return res.json({ success: true, message: 'Profile image uploaded', data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const toggleFavoriteExercise = async (req, res) => {
  try {
    const { exerciseId } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ success: false, message: 'Exercise ID is required', data: null });
    }

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found', data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null });

    if (!Array.isArray(user.favoriteExercises)) {
      user.favoriteExercises = [];
    }

    const idx = user.favoriteExercises.findIndex(id => id.toString() === exerciseId);
    let favorited;
    if (idx >= 0) {
      user.favoriteExercises.splice(idx, 1);
      favorited = false;
    } else {
      user.favoriteExercises.push(exerciseId);
      favorited = true;
    }
    await user.save();

    const updated = await fetchProfileUser(req.user.id);

    return res.json({
      success: true,
      message: favorited ? 'Exercise added to favorites' : 'Exercise removed from favorites',
      data: { favorited, user: updated },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const saveWorkoutPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required', data: null });
    }

    const plan = await WorkoutPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found', data: null });
    }
    if (plan.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null });

    if (!Array.isArray(user.savedWorkoutPlans)) {
      user.savedWorkoutPlans = [];
    }

    const planIdStr = String(planId);
    const alreadySaved = user.savedWorkoutPlans.some(id => id.toString() === planIdStr);
    if (!alreadySaved) {
      user.savedWorkoutPlans.push(plan._id);
      await user.save();
    }

    const updated = await fetchProfileUser(req.user.id);
    return res.json({
      success: true,
      message: 'Plan saved to profile',
      data: { user: updated },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const removeSavedWorkoutPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required', data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null });

    if (!Array.isArray(user.savedWorkoutPlans)) {
      user.savedWorkoutPlans = [];
    }

    const idx = user.savedWorkoutPlans.findIndex(id => id.toString() === String(planId));
    if (idx < 0) {
      return res.status(404).json({ success: false, message: 'Plan not in saved list', data: null });
    }

    user.savedWorkoutPlans.splice(idx, 1);
    await user.save();

    const updated = await fetchProfileUser(req.user.id);
    return res.json({
      success: true,
      message: 'Plan removed from saved plans',
      data: { user: updated },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};
