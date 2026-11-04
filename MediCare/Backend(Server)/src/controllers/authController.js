import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { recordAudit } from '../services/auditService.js';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Enforce patient role strictly: public registration can ONLY create patient accounts
  const role = 'patient';

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user is already registered with this email address' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isBlocked: false,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      recordAudit({
        action: 'AUTH_LOGIN_FAILURE',
        actor: { email },
        resource: { type: 'User' },
        outcome: 'FAILURE',
        metadata: { reason: 'user_not_found' },
        req
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Immediately deny blocked accounts before checking passwords or returning sessions
    if (user.isBlocked) {
      recordAudit({
        action: 'AUTH_BLOCKED_LOGIN_ATTEMPT',
        actor: { userId: user._id, email: user.email, role: user.role },
        resource: { type: 'User', id: user._id },
        outcome: 'DENIED',
        metadata: { reason: 'Account suspended by administrator' },
        req
      });
      return res.status(403).json({ message: 'Your account has been blocked. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordAudit({
        action: 'AUTH_LOGIN_FAILURE',
        actor: { userId: user._id, email: user.email, role: user.role },
        resource: { type: 'User', id: user._id },
        outcome: 'FAILURE',
        metadata: { reason: 'invalid_credentials' },
        req
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    recordAudit({
      action: 'AUTH_LOGIN_SUCCESS',
      actor: { userId: user._id, email: user.email, role: user.role },
      resource: { type: 'User', id: user._id },
      outcome: 'SUCCESS',
      metadata: { role: user.role },
      req
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).populate('userId', 'name email isBlocked');
    // Only return doctors whose user account is verified active and not blocked
    const activeDoctors = doctors.filter(doc => doc.userId && !doc.userId.isBlocked);
    res.json(activeDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (doctor) {
      res.json({
        name: doctor.userId?.name || '',
        specialization: doctor.specialization,
        experience: doctor.experience,
        fees: doctor.fees,
        hospital: doctor.hospital,
        availableDays: doctor.availableDays,
        availableTimeSlots: doctor.availableTimeSlots
      });
    } else {
      const user = await User.findById(req.user._id).select('name');
      res.json({ name: user?.name || '' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  // Never allow modifying role, isBlocked, email, or password here
  const { name, specialization, experience, fees, hospital, availableDays, availableTimeSlots } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) {
      user.name = name;
      await user.save();
    }

    let doctor = null;
    // Doctor-specific properties can only be altered if the user already holds the doctor role
    if (user.role === 'doctor') {
      doctor = await Doctor.findOne({ userId: req.user._id });

      if (doctor) {
        if (specialization !== undefined) doctor.specialization = specialization;
        if (experience !== undefined) doctor.experience = experience;
        if (fees !== undefined) doctor.fees = fees;
        if (hospital !== undefined) doctor.hospital = hospital;
        if (availableDays !== undefined) doctor.availableDays = availableDays;
        if (availableTimeSlots !== undefined) doctor.availableTimeSlots = availableTimeSlots;
        await doctor.save();
      }
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      doctor 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
