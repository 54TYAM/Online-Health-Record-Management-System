import mongoose, { Schema } from 'mongoose';

const DoctorSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  fees: { type: Number, required: true },
  hospital: { type: String, default: 'Medicare General Hospital' },
}, { timestamps: true });

export default mongoose.model('Doctor', DoctorSchema);
