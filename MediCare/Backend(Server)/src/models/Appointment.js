import mongoose, { Schema } from 'mongoose';

const AppointmentSchema = new Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'completed', 'cancelled'], 
    default: 'pending' 
  },
}, { timestamps: true });

export default mongoose.model('Appointment', AppointmentSchema);
