import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'patient',
    });

    if (user) {
      // If user is a doctor, create a Doctor profile
      if (user.role === 'doctor') {
        await Doctor.create({
          userId: user._id,
          specialization: 'General Physician', // Default
          experience: 0,
          fees: 0,
          hospital: 'Independent Practice'
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
        refreshToken: generateRefreshToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
        refreshToken: generateRefreshToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const getDoctors = async (req, res) => {
  try {
    // Populate the userId to get the name from User model
    const doctors = await Doctor.find({}).populate('userId', 'name email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email');
        if (doctor) {
            res.json({
                name: doctor.userId.name,
                specialization: doctor.specialization,
                experience: doctor.experience,
                fees: doctor.fees,
                hospital: doctor.hospital
            });
        } else {
            // Return basic user info if doctor profile doesn't exist yet
            const user = await User.findById(req.user._id);
            res.json({ name: user.name });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updateProfile = async (req, res) => {
    const { name, specialization, experience, fees, hospital } = req.body;
    
    try {
        // 1. Update User Name
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = name || user.name;
            await user.save();
        }

        // 2. Update/Create Doctor Profile
        let doctor = await Doctor.findOne({ userId: req.user._id });

        if (doctor) {
            doctor.specialization = specialization || doctor.specialization;
            doctor.experience = experience || doctor.experience;
            doctor.fees = fees || doctor.fees;
            doctor.hospital = hospital || doctor.hospital;
            await doctor.save();
        } else if (req.user.role === 'doctor') {
            // Create if doesn't exist (Onboarding)
            doctor = await Doctor.create({
                userId: req.user._id,
                specialization: specialization || 'General Physician',
                experience: experience || 0,
                fees: fees || 0,
                hospital: hospital || 'Independant Practice'
            });
        }

        res.json({ 
            message: 'Profile updated successfully',
            user: { name: user.name },
            doctor 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
