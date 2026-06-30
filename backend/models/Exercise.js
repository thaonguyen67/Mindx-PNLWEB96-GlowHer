import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameVi: { type: String },
  description: { type: String },
  descriptionVi: { type: String },
  bodyPart: { type: String, required: true },
  benefits: [{ type: String }],
  benefitsVi: [{ type: String }],
  video: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  equipment: { type: String },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Exercise', exerciseSchema);
