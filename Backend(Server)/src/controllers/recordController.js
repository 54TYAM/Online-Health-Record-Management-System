import MedicalRecord from '../models/MedicalRecord.js';

export const addMedicalRecord = async (req, res) => {
  const { patientId, diagnosis, prescription, files } = req.body;
  
  try {
    const record = await MedicalRecord.create({
      patientId,
      doctorId: req.user._id, 
      diagnosis,
      prescription,
      files: files || [],
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientRecords = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user._id;

    if (req.user.role === 'patient' && req.user._id.toString() !== patientId.toString()) {
       return res.status(403).json({ message: 'Not authorized to view these records' });
    }

    const records = await MedicalRecord.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');
      
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
