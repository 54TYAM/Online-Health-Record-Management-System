import mongoose, { Schema } from 'mongoose';

const AppointmentSchema = new Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  dateString: { type: String, required: true }, // Normalized YYYY-MM-DD calendar date
  time: { type: String, default: '' }, // Slot time in HH:mm 24h format
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  cancellationReason: { type: String, default: '' },
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
}, { timestamps: true });

// Normalize dateString from date if omitted
AppointmentSchema.pre('validate', function() {
  if (!this.dateString && this.date) {
    try {
      this.dateString = new Date(this.date).toISOString().split('T')[0];
    } catch {
      // Ignored here, caught by schema validation
    }
  }
});

// Enforce atomic server-side protection against simultaneous bookings of the same doctor slot
AppointmentSchema.index(
  { doctorId: 1, dateString: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved', 'confirmed'] },
      time: { $exists: true, $ne: '' }
    }
  }
);

// Secondary indexes for fast role-specific schedule queries
AppointmentSchema.index({ patientId: 1, date: -1 });
AppointmentSchema.index({ doctorId: 1, date: -1 });

export default mongoose.model('Appointment', AppointmentSchema);
