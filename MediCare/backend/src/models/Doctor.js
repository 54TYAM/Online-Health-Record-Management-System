import mongoose, { Schema } from 'mongoose';

export const defaultAvailableDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday'
];

export const defaultAvailableTimeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00'
];

const DoctorSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  fees: { type: Number, required: true },
  hospital: { type: String, default: 'Medicare General Hospital' },
  availableDays: {
    type: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    default: defaultAvailableDays
  },
  availableTimeSlots: {
    type: [String],
    default: defaultAvailableTimeSlots
  }
}, { timestamps: true });

export default mongoose.model('Doctor', DoctorSchema);
