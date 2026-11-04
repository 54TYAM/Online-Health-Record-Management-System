import AuditLog from '../models/AuditLog.js';

/**
 * Audit Logging Service
 * 
 * Provides centralized, safe, rate-limited, and sanitized security audit recording.
 * 
 * CONSISTENCY & FAULT TOLERANCE STRATEGY:
 * Asynchronous, non-disruptive consistency: Audit logging failures are caught and logged
 * to server diagnostics (stderr) without aborting the calling business operation.
 * A database blip during audit write must never fail an active patient consultation,
 * medical record commitment, or authentication verification.
 */

// Keys strictly forbidden from audit log metadata (PHI, credentials, secrets)
const SENSITIVE_KEY_REGEX = /^(password|token|jwt|secret|authorization|auth|prescription|diagnosis|cookie|session|credit|ssn)/i;

/**
 * Deep-clean metadata to ensure no passwords, tokens, full prescriptions,
 * or detailed diagnostic texts are stored in the audit trail.
 */
export const sanitizeMetadata = (data, depth = 0) => {
  if (!data || typeof data !== 'object' || depth > 4) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item) => sanitizeMetadata(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      // Omit completely
      continue;
    }

    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeMetadata(value, depth + 1);
    } else if (typeof value === 'string') {
      // Truncate long strings to prevent log inflation attacks
      sanitized[key] = value.length > 200 ? `${value.substring(0, 197)}...` : value;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// In-memory rate limiter for repetitive security events (e.g. brute-force login attempts)
// Format: Map<string, { count: number, windowStart: number }>
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxEventsPerWindow = 10;
const failureLogTracker = new Map();

/**
 * Periodically purge stale rate limit records to prevent memory growth
 */
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of failureLogTracker.entries()) {
      if (now - data.windowStart > rateLimitWindowMs) {
        failureLogTracker.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
}

/**
 * Checks if a repetitive event (like login failure) should be throttled
 */
const shouldThrottleEvent = (action, ip) => {
  // Only throttle failure / denial events to mitigate log flood DoS
  if (!action.includes('FAILURE') && !action.includes('DENIED')) {
    return false;
  }

  const key = `${action}:${ip || 'unknown'}`;
  const now = Date.now();
  const entry = failureLogTracker.get(key);

  if (!entry || now - entry.windowStart > rateLimitWindowMs) {
    failureLogTracker.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > maxEventsPerWindow) {
    return true; // Throttle
  }

  return false;
};

/**
 * Main audit dispatch function.
 * 
 * @param {Object} params
 * @param {string} params.action - Canonical event name (e.g. RECORD_CREATE, APPOINTMENT_BOOK)
 * @param {Object} [params.actor] - Identity of caller { userId, email, role, ip, userAgent }
 * @param {Object} params.resource - Target resource { type, id }
 * @param {'SUCCESS'|'FAILURE'|'DENIED'} params.outcome - Outcome of the action
 * @param {Object} [params.metadata] - Concise, safe context (sanitized automatically)
 * @param {Object} [params.req] - Express request object (used to derive IP/UA/actor fallback)
 */
export const recordAudit = async ({
  action,
  actor = {},
  resource = { type: 'System', id: null },
  outcome = 'SUCCESS',
  metadata = {},
  req = null
}) => {
  try {
    const ip =
      actor.ip ||
      (req && (req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress)) ||
      'unknown';

    // Apply rate-limiting for failure / denial actions to prevent DoS log stuffing
    if (shouldThrottleEvent(action, ip)) {
      return null;
    }

    const userAgent =
      actor.userAgent ||
      (req && req.headers?.['user-agent']) ||
      'unknown';

    const userId =
      actor.userId ||
      (req?.user?._id) ||
      null;

    const role =
      actor.role ||
      (req?.user?.role) ||
      'anonymous';

    const email =
      actor.email ||
      (req?.user?.email) ||
      null;

    const sanitizedMeta = sanitizeMetadata(metadata);

    const logEntry = await AuditLog.create({
      action: action.toUpperCase(),
      actor: {
        userId,
        email,
        role,
        ip: ip.substring(0, 64),
        userAgent: userAgent.substring(0, 255)
      },
      resource: {
        type: resource.type,
        id: resource.id ? String(resource.id).substring(0, 64) : null
      },
      outcome,
      metadata: sanitizedMeta
    });

    return logEntry;
  } catch (err) {
    // Non-disruptive consistency: Log to stderr without throwing or disrupting calling transaction
    console.error(`[AUDIT_LOGGING_FAILURE] Failed to persist audit entry for action ${action}:`, err.message);
    return null;
  }
};

/**
 * Clear in-memory rate limiter (useful for unit tests)
 */
export const _resetRateLimiter = () => {
  failureLogTracker.clear();
};
