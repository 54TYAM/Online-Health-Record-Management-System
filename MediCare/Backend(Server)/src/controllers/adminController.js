import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import { recordAudit } from '../services/auditService.js';

export const createDoctor = async (req, res) => {
  const { name, email, password, specialization, experience, fees, hospital } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
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
        specialization: specialization || 'General Physician',
        experience: experience || 0,
        fees: fees || 0,
        hospital: hospital || 'Independent Practice'
      });

      // Security Audit Trail: Record doctor provisioning
      recordAudit({
        action: 'ADMIN_CREATE_DOCTOR',
        actor: { userId: req.user._id, role: 'admin' },
        resource: { type: 'User', id: user._id },
        outcome: 'SUCCESS',
        metadata: {
          doctorName: user.name,
          doctorEmail: user.email,
          specialization: specialization || 'General Physician'
        },
        req
      });

      res.status(201).json({ message: 'Doctor created successfully', data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }});
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      recordAudit({
        action: 'ADMIN_BLOCK_USER_ATTEMPT',
        actor: { userId: req.user?._id, role: req.user?.role || 'admin' },
        resource: { type: 'User', id: user._id },
        outcome: 'DENIED',
        metadata: { reason: 'Attempted to block administrator account' },
        req
      });
      return res.status(400).json({ message: 'Admin accounts cannot be blocked' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Security Audit Trail: Record administrative account status change
    recordAudit({
      action: user.isBlocked ? 'ADMIN_BLOCK_USER' : 'ADMIN_UNBLOCK_USER',
      actor: { userId: req.user?._id, role: req.user?.role || 'admin' },
      resource: { type: 'User', id: user._id },
      outcome: 'SUCCESS',
      metadata: {
        targetRole: user.role,
        isBlocked: user.isBlocked,
        targetEmail: user.email
      },
      req
    });

    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Administrative Audit Trail Query
 * GET /api/admin/audit-logs
 * 
 * Strict administrative access only.
 * Supports filtering by action, outcome, resourceType, and date ranges with pagination.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query?.limit, 10) || 20), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query?.action) {
      filter.action = req.query.action.trim().toUpperCase();
    }
    if (req.query?.outcome) {
      filter.outcome = req.query.outcome.trim().toUpperCase();
    }
    if (req.query?.resourceType) {
      filter['resource.type'] = req.query.resourceType.trim();
    }
    if (req.query?.startDate || req.query?.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        const s = new Date(req.query.startDate);
        if (!isNaN(s.getTime())) filter.timestamp.$gte = s;
      }
      if (req.query.endDate) {
        const e = new Date(req.query.endDate);
        if (!isNaN(e.getTime())) {
          e.setHours(23, 59, 59, 999);
          filter.timestamp.$lte = e;
        }
      }
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      logs,
      pagination: {
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        limit,
        hasMore: skip + logs.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Method Not Allowed Handler for Audit Records
 * Protects against attempts to update, patch, or delete audit events via API.
 */
export const rejectAuditMutation = (req, res) => {
  return res.status(405).json({
    message: 'Method Not Allowed: Security audit records are append-only and cannot be altered or deleted via API'
  });
};
