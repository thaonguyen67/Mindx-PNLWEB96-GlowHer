import mongoose from 'mongoose';

const exerciseEntrySchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  exerciseName: { type: String },
  sets: { type: Number },
  reps: { type: String },
  rest: { type: String },
}, { _id: false });

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number },
  week: { type: Number },
  dayName: { type: String },
  focus: { type: String },
  exercises: [exerciseEntrySchema],
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['ai', 'preset'], required: true },
  goal: { type: String },
  targetBodyParts: [{ type: String }],
  durationWeeks: { type: Number },
  daysPerWeek: { type: Number },
  intro: { type: String },
  tip: { type: String },
  days: [daySchema],
}, { timestamps: true });

export default mongoose.model('WorkoutPlan', workoutPlanSchema);
