import mongoose from 'mongoose';

const workoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
  dayNumber: { type: Number, required: true },
  caloriesBurned: { type: Number, default: 0 },
  completed: { type: Boolean, default: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('WorkoutLog', workoutLogSchema);
