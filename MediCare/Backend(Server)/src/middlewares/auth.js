import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { recordAudit } from '../services/auditService.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (user.isBlocked) {
        recordAudit({
          action: 'AUTH_BLOCKED_ACCESS_ATTEMPT',
          actor: { userId: user._id, role: user.role, email: user.email },
          resource: { type: 'Route', id: req.originalUrl || req.baseUrl },
          outcome: 'DENIED',
          metadata: { reason: 'Blocked account presented valid session token' },
          req
        });
        return res.status(403).json({ message: 'Account is blocked. Please contact the administrator.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no authorization header' });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      if (req.user) {
        recordAudit({
          action: 'AUTH_PRIVILEGED_ACCESS_DENIED',
          actor: { userId: req.user._id, role: req.user.role, email: req.user.email },
          resource: { type: 'Route', id: req.originalUrl || req.baseUrl },
          outcome: 'DENIED',
          metadata: {
            requiredRoles: roles,
            callerRole: req.user.role
          },
          req
        });
      }
      return res.status(403).json({ 
        message: `Forbidden: role '${req.user?.role || 'unknown'}' is not authorized to access this resource` 
      });
    }
    next();
  };
};
