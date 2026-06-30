import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  weight: { type: Number },
  height: { type: Number },
  profileImage: { type: String, default: '' },
  favoriteExercises: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }], default: [] },
  savedWorkoutPlans: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' }], default: [] },
  refreshToken: { type: String },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
