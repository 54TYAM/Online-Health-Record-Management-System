import mongoose from 'mongoose';

/**
 * AuditLog Model
 * 
 * Minimal, reliable security audit trail recording security and clinical events.
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * This model is designed to be append-only at the application layer.
 * While application-level hooks reject updates and deletions, application-level guards
 * are NOT tamper-proof against direct database manipulation (e.g., DBA access, direct
 * connection strings). Production deployments should complement this with database-level
 * user privileges (e.g., write-only / no drop privileges) and centralized log streaming.
 */

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      immutable: true
    },
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
      maxlength: 100
    },
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      email: {
        type: String,
        trim: true,
        maxlength: 120,
        default: null
      },
      role: {
        type: String,
        enum: ['patient', 'doctor', 'admin', 'system', 'anonymous'],
        default: 'anonymous'
      },
      ip: {
        type: String,
        trim: true,
        maxlength: 64,
        default: 'unknown'
      },
      userAgent: {
        type: String,
        trim: true,
        maxlength: 255,
        default: 'unknown'
      }
    },
    resource: {
      type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 64
      },
      id: {
        type: String,
        trim: true,
        maxlength: 64,
        default: null
      }
    },
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'DENIED'],
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false, // We use immutable timestamp field
    versionKey: false
  }
);

// Compound index for administrative querying and timeline filtering
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });

// Application-layer append-only enforcement:
// Intercept and reject any attempts to update, replace, or delete audit records.
const rejectMutation = function (next) {
  const err = new Error('AuditLog is append-only: modifications and deletions are forbidden at the application layer');
  err.name = 'SecurityAuditMutationError';
  if (typeof next === 'function') {
    return next(err);
  }
  return Promise.reject(err);
};

auditLogSchema.pre('updateOne', rejectMutation);
auditLogSchema.pre('updateMany', rejectMutation);
auditLogSchema.pre('findOneAndUpdate', rejectMutation);
auditLogSchema.pre('findOneAndReplace', rejectMutation);
auditLogSchema.pre('replaceOne', rejectMutation);
auditLogSchema.pre('deleteOne', rejectMutation);
auditLogSchema.pre('deleteMany', rejectMutation);
auditLogSchema.pre('findOneAndDelete', rejectMutation);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
