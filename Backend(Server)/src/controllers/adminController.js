import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import bcrypt from 'bcryptjs';

export const createDoctor = async (req, res) => {
  const { name, email, password, specialization, experience, fees } = req.body;

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
      role: 'doctor',
    });

    if (user) {
      await Doctor.create({
        userId: user._id,
        specialization,
        experience,
        fees,
      });

      res.status(201).json({ message: 'Doctor created successfully', data: user });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();
      res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
