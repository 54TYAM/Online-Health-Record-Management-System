import mongoose, { Schema } from 'mongoose';

const MedicalRecordSchema = new Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String, required: true },
  prescription: { type: String, required: true },
  files: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('MedicalRecord', MedicalRecordSchema);
