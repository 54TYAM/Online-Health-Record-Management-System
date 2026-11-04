import Feedback from '../models/Feedback.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

export const createFeedback = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    // Ensure doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Verify patient has an appointment or consultation with this doctor
    const hasConsultation = await Appointment.exists({
      patientId: req.user._id,
      doctorId: doctor._id,
      status: { $ne: 'cancelled' }
    });

    if (!hasConsultation) {
      return res.status(403).json({
        message: 'Forbidden: You can only submit feedback for doctors you have checked with'
      });
    }

    const feedback = await Feedback.create({
      patientId: req.user._id,
      doctorId,
      rating,
      comment: comment || ''
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      // For patients: Return feedback they gave, populated with doctor info
      const feedbacks = await Feedback.find({ patientId: req.user._id })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' }
        })
        .sort({ createdAt: -1 });

      return res.json(feedbacks);
    } else if (req.user.role === 'doctor') {
      // For doctors: Return feedback they received
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      const feedbacks = await Feedback.find({ doctorId: doctor._id })
        .populate('patientId', 'name email')
        .sort({ createdAt: -1 });

      return res.json(feedbacks);
    } else {
      // For admin: Return all feedback
      const feedbacks = await Feedback.find({})
        .populate('patientId', 'name email')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' }
        })
        .sort({ createdAt: -1 });

      return res.json(feedbacks);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
