import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

export const addMedicalRecord = async (req, res) => {
  const { patientId, diagnosis, prescription, files } = req.body;
  
  try {
    // 1. Verify author doctor profile exists
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'A verified doctor profile is required to author medical records' });
    }

    // 2. Verify target patient exists and holds the patient role
    const patient = await User.findById(patientId).select('name role isBlocked');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found or invalid patient ID' });
    }

    // 3. Authorization policy: Doctor must have an approved or completed appointment with this patient
    const hasApprovedConsultation = await Appointment.exists({
      doctorId: doctor._id,
      patientId: patient._id,
      status: { $in: ['approved', 'confirmed', 'completed'] }
    });

    if (!hasApprovedConsultation) {
      return res.status(403).json({ 
        message: 'Forbidden: You can only author medical records for patients with an approved or completed appointment' 
      });
    }

    // 4. Record author is immutably set to the authenticated doctor's user ID
    const record = await MedicalRecord.create({
      patientId: patient._id,
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
    const rawParamId = req.params?.patientId;
    const isMeRoute = !rawParamId || rawParamId === 'me';
    const patientId = isMeRoute ? req.user._id : rawParamId;

    // 1. Patient caller: May strictly access ONLY their own records
    // Do not trust patient IDs supplied by the frontend as proof of authorization
    if (req.user.role === 'patient') {
      if (!isMeRoute && req.user._id.toString() !== patientId.toString()) {
        return res.status(403).json({ message: 'Forbidden: Patients can only access their own medical records' });
      }
    } else if (req.user.role === 'doctor') {
      // 2. Doctor caller: May access records only if they have an active or completed consultation
      // or authored existing records for this patient
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found' });
      }

      const hasAuthorization = (await Appointment.exists({
        doctorId: doctor._id,
        patientId,
        status: { $in: ['approved', 'confirmed', 'completed'] }
      })) || (await MedicalRecord.exists({
        doctorId: req.user._id,
        patientId
      }));

      if (!hasAuthorization) {
        return res.status(403).json({ 
          message: 'Forbidden: You do not have verified medical authorization to view this patient’s records' 
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
    }

    // 3. Build filter query
    const targetPatientId = req.user.role === 'patient' ? req.user._id : patientId;
    const filter = { patientId: targetPatientId };

    // Search filter across diagnosis and prescription (sanitized)
    if (req.query?.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { diagnosis: { $regex: escaped, $options: 'i' } },
        { prescription: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Clinician filter
    if (req.query?.doctorId) {
      filter.doctorId = req.query.doctorId;
    }

    // Date range filter
    if (req.query?.startDate || req.query?.endDate) {
      const dateFilter = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!isNaN(start.getTime())) dateFilter.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }
    }

    // 4. Chronological ordering (newest first by default)
    const sortDirection = req.query?.sort === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query?.limit, 10) || 20), 50);
    const skip = (page - 1) * limit;

    const total = await MedicalRecord.countDocuments(filter);

    const records = await MedicalRecord.find(filter)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name')
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    // 5. Enrich with doctor specialization and hospital details
    const doctorUserIds = records.map(r => r.doctorId?._id).filter(Boolean);
    const doctorProfiles = await Doctor.find({ userId: { $in: doctorUserIds } });
    const docMap = new Map(doctorProfiles.map(d => [d.userId.toString(), d]));

    const sanitizedRecords = records.map(record => {
      if (record.doctorId) {
        const doc = docMap.get(record.doctorId._id.toString());
        return {
          ...record,
          doctorId: {
            _id: record.doctorId._id,
            name: record.doctorId.name,
            email: record.doctorId.email,
            specialization: doc?.specialization || 'General Physician',
            hospital: doc?.hospital || 'Independent Practice'
          }
        };
      }
      return record;
    });

    // 6. Return paginated envelope if query params requested pagination, or array for standard backward compatibility
    if (req.query?.page || req.query?.limit || req.query?.paginate === 'true') {
      return res.json({
        records: sanitizedRecords,
        pagination: {
          total,
          page,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          limit,
          hasMore: skip + records.length < total
        }
      });
    }

    res.json(sanitizedRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleRecord = async (req, res) => {
  try {
    const recordId = req.params.id;

    const record = await MedicalRecord.findById(recordId)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email')
      .lean();

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Authorization check
    if (req.user.role === 'patient') {
      // Patients may strictly access only their own records
      if (record.patientId?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this medical record' });
      }
    } else if (req.user.role === 'doctor') {
      // Authoring doctor or doctor with approved consultation with the patient
      const isAuthor = record.doctorId?._id?.toString() === req.user._id.toString();
      if (!isAuthor) {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const hasConsultation = doctor && (await Appointment.exists({
          doctorId: doctor._id,
          patientId: record.patientId?._id,
          status: { $in: ['approved', 'confirmed', 'completed'] }
        }));
        if (!hasConsultation) {
          return res.status(403).json({ message: 'Forbidden: You do not have verified authorization for this record' });
        }
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
    }

    // Enrich clinician details
    let doctorInfo = record.doctorId;
    if (record.doctorId?._id) {
      const doc = await Doctor.findOne({ userId: record.doctorId._id });
      doctorInfo = {
        _id: record.doctorId._id,
        name: record.doctorId.name,
        email: record.doctorId.email,
        specialization: doc?.specialization || 'General Physician',
        hospital: doc?.hospital || 'Independent Practice'
      };
    }

    // Protect patient privacy: Only expose patient name and ID
    const sanitizedPatient = {
      _id: record.patientId?._id,
      name: record.patientId?.name
    };

    res.json({
      ...record,
      patientId: sanitizedPatient,
      doctorId: doctorInfo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
