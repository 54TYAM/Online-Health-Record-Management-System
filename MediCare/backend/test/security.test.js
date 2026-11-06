import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  bookAppointmentSchema, 
  updateAppointmentStatusSchema,
  addMedicalRecordSchema,
  idParamSchema,
  patientIdParamSchema,
  recordQuerySchema,
  doctorAvailabilitySchema,
  availabilityQuerySchema,
  rescheduleAppointmentSchema
} from '../src/validators/schemas.js';
import { protect, authorize } from '../src/middlewares/auth.js';
import { rateLimit } from '../src/middlewares/rateLimiter.js';
import { validateEnv } from '../src/config/env.js';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import { 
  updateAppointmentStatus, 
  bookAppointment, 
  getDoctorAvailability, 
  setDoctorAvailability, 
  rescheduleAppointment,
  normalizeCalendarDate,
  getDayOfWeekName
} from '../src/controllers/appointmentController.js';
import { getPatientRecords, addMedicalRecord, getSingleRecord } from '../src/controllers/recordController.js';
import { login, updateProfile, register } from '../src/controllers/authController.js';
import { toggleBlockUser } from '../src/controllers/adminController.js';

// Setup test JWT secret
process.env.JWT_SECRET = 'test_secret_for_automated_security_verification_key_12345';
process.env.NODE_ENV = 'test';

// Helper mock response
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
    }
  };
  return res;
};

describe('🔒 1. Registration & Privilege Escalation Defenses', () => {
  it('should reject client attempts to register with role="admin"', () => {
    const maliciousPayload = {
      name: 'Hacker Admin',
      email: 'hacker@evil.com',
      password: 'password123',
      role: 'admin'
    };
    const result = registerSchema.safeParse(maliciousPayload);
    const issues = result.error.issues || result.error.errors || [];
    assert.match(issues[0]?.message || '', /patient/i);
  });

  it('should reject client attempts to register with role="doctor"', () => {
    const doctorPayload = {
      name: 'Unverified Doctor',
      email: 'doctor@hospital.com',
      password: 'password123',
      role: 'doctor'
    };
    const result = registerSchema.safeParse(doctorPayload);
    assert.equal(result.success, false, 'Doctor role in public registration must be rejected');
  });

  it('should allow valid patient registration and default role to patient', () => {
    const patientPayload = {
      name: 'Alice Patient',
      email: 'alice@example.com',
      password: 'securePassword123'
    };
    const result = registerSchema.safeParse(patientPayload);
    assert.equal(result.success, true);
    assert.equal(result.data.role, 'patient');
  });

  it('should prevent privilege escalation in updateProfile schema (strips role and isBlocked)', () => {
    const maliciousUpdate = {
      name: 'Alice Legit',
      role: 'admin',
      isBlocked: false,
      email: 'changed@evil.com'
    };
    const result = updateProfileSchema.safeParse(maliciousUpdate);
    assert.equal(result.success, true);
    assert.equal(result.data.role, undefined, 'Role property must not be accepted in profile updates');
    assert.equal(result.data.isBlocked, undefined, 'isBlocked property must not be accepted in profile updates');
    assert.equal(result.data.email, undefined, 'email property must not be accepted in profile updates');
  });
});

describe('🔒 2. Blocked User & Authentication Enforcement', () => {
  it('should reject protected route access when user account isBlocked=true', async () => {
    const originalFindById = User.findById;
    try {
      const blockedUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign({ id: blockedUserId }, process.env.JWT_SECRET);

      // Mock User.findById returning a blocked user
      User.findById = () => ({
        select: () => Promise.resolve({
          _id: blockedUserId,
          name: 'Blocked User',
          email: 'blocked@test.com',
          role: 'patient',
          isBlocked: true
        })
      });

      const req = {
        headers: { authorization: `Bearer ${token}` }
      };
      const res = createMockRes();
      let nextCalled = false;

      await protect(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false, 'Blocked user must not proceed to next()');
      assert.equal(res.statusCode, 403, 'Blocked user must receive 403 Forbidden');
      assert.match(res.data.message, /Account is blocked/);
    } finally {
      User.findById = originalFindById;
    }
  });

  it('should reject login attempt when user is blocked in database', async () => {
    const originalFindOne = User.findOne;
    try {
      User.findOne = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439011',
        name: 'Blocked Patient',
        email: 'blocked@example.com',
        role: 'patient',
        isBlocked: true,
        password: '$2a$10$abcdefghijklmnopqrstuv'
      });

      const req = { body: { email: 'blocked@example.com', password: 'password123' } };
      const res = createMockRes();

      await login(req, res);

      assert.equal(res.statusCode, 403, 'Login of blocked user must return 403');
      assert.match(res.data.message, /account has been blocked/);
    } finally {
      User.findOne = originalFindOne;
    }
  });

  it('should reject requests with invalid or forged JWT signatures', async () => {
    const fakeToken = jwt.sign({ id: '123' }, 'wrong_untrusted_secret');
    const req = { headers: { authorization: `Bearer ${fakeToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.data.message, /Not authorized, token invalid/);
  });

  it('should reject requests with missing authorization header', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.data.message, /no authorization header/);
  });
});

describe('🔒 3. Medical Record Confidentiality', () => {
  it('should forbid patient from viewing another patient medical records', async () => {
    const req = {
      user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
      params: { patientId: '507f1f77bcf86cd799439022' } // Different patient ID
    };
    const res = createMockRes();

    await getPatientRecords(req, res);

    assert.equal(res.statusCode, 403, 'Cross-patient access must be rejected with 403');
    assert.match(res.data.message, /Patients can only access their own medical records/);
  });

  it('should forbid a doctor from accessing records of a patient without verified consultation', async () => {
    const originalDoctorFindOne = Doctor.findOne;
    const originalApptExists = Appointment.exists;
    const originalRecordExists = MedicalRecord.exists;

    try {
      Doctor.findOne = () => Promise.resolve({ _id: '507f1f77bcf86cd799439033', userId: '507f1f77bcf86cd799439044' });
      Appointment.exists = () => Promise.resolve(null); // No appointment exists
      MedicalRecord.exists = () => Promise.resolve(null); // No authored record exists

      const req = {
        user: { _id: '507f1f77bcf86cd799439044', role: 'doctor' },
        params: { patientId: '507f1f77bcf86cd799439011' }
      };
      const res = createMockRes();

      await getPatientRecords(req, res);

      assert.equal(res.statusCode, 403, 'Doctor without active relationship must be denied access');
      assert.match(res.data.message, /do not have verified medical authorization/);
    } finally {
      Doctor.findOne = originalDoctorFindOne;
      Appointment.exists = originalApptExists;
      MedicalRecord.exists = originalRecordExists;
    }
  });

  it('should forbid doctor from creating record if no approved consultation exists', async () => {
    const originalDoctorFindOne = Doctor.findOne;
    const originalUserFindById = User.findById;
    const originalApptExists = Appointment.exists;

    try {
      Doctor.findOne = () => Promise.resolve({ _id: '507f1f77bcf86cd799439033', userId: '507f1f77bcf86cd799439044' });
      User.findById = () => ({
        select: () => Promise.resolve({ _id: '507f1f77bcf86cd799439011', role: 'patient' })
      });
      Appointment.exists = () => Promise.resolve(null); // No approved appointment

      const req = {
        user: { _id: '507f1f77bcf86cd799439044', role: 'doctor' },
        body: {
          patientId: '507f1f77bcf86cd799439011',
          diagnosis: 'Hypertension Stage 1',
          prescription: 'Lisinopril 10mg daily',
          files: []
        }
      };
      const res = createMockRes();

      await addMedicalRecord(req, res);

      assert.equal(res.statusCode, 403, 'Must reject record creation without approved appointment');
      assert.match(res.data.message, /only author medical records for patients with an approved or completed appointment/);
    } finally {
      Doctor.findOne = originalDoctorFindOne;
      User.findById = originalUserFindById;
      Appointment.exists = originalApptExists;
    }
  });

  it('should return paginated timeline for authenticated patient without trusting client param', async () => {
    const originalFind = MedicalRecord.find;
    const originalCount = MedicalRecord.countDocuments;
    const originalDoctorFind = Doctor.find;

    try {
      const patientId = '507f1f77bcf86cd799439011';
      const mockRecords = [
        {
          _id: '607f1f77bcf86cd799439001',
          patientId: { _id: patientId, name: 'Alice Patient' },
          doctorId: { _id: '507f1f77bcf86cd799439033', name: 'Dr. Jane Smith', email: 'jane@clinic.org' },
          diagnosis: 'Acute Rhinitis',
          prescription: 'Cetirizine 10mg daily',
          files: [],
          createdAt: new Date('2026-10-15T10:00:00Z')
        }
      ];

      MedicalRecord.countDocuments = () => Promise.resolve(1);
      MedicalRecord.find = () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({
                  lean: () => Promise.resolve(mockRecords)
                })
              })
            })
          })
        })
      });

      Doctor.find = () => Promise.resolve([
        { userId: '507f1f77bcf86cd799439033', specialization: 'Pulmonology', hospital: 'General Hospital' }
      ]);

      // Patient requests via /me with pagination params
      const req = {
        user: { _id: patientId, role: 'patient' },
        params: { patientId: 'me' },
        query: { page: 1, limit: 10 }
      };
      const res = createMockRes();

      await getPatientRecords(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(res.data.pagination, 'Must return pagination envelope when page/limit requested');
      assert.equal(res.data.pagination.total, 1);
      assert.equal(res.data.pagination.page, 1);
      assert.equal(res.data.records.length, 1);
      assert.equal(res.data.records[0].diagnosis, 'Acute Rhinitis');
      assert.equal(res.data.records[0].doctorId.specialization, 'Pulmonology');
    } finally {
      MedicalRecord.find = originalFind;
      MedicalRecord.countDocuments = originalCount;
      Doctor.find = originalDoctorFind;
    }
  });

  it('should forbid patient from viewing another patient detailed record item', async () => {
    const originalFindById = MedicalRecord.findById;

    try {
      MedicalRecord.findById = () => ({
        populate: () => ({
          populate: () => ({
            lean: () => Promise.resolve({
              _id: '607f1f77bcf86cd799439001',
              patientId: { _id: '507f1f77bcf86cd799439099', name: 'Victim Patient' }, // Belongs to different patient
              doctorId: { _id: '507f1f77bcf86cd799439033', name: 'Dr. Smith' },
              diagnosis: 'Confidential Diagnosis',
              prescription: 'Confidential Medication'
            })
          })
        })
      });

      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' }, // Attacking patient
        params: { id: '607f1f77bcf86cd799439001' }
      };
      const res = createMockRes();

      await getSingleRecord(req, res);

      assert.equal(res.statusCode, 403, 'Cross-patient detailed view must return 403');
      assert.match(res.data.message, /do not have permission to view this medical record/);
    } finally {
      MedicalRecord.findById = originalFindById;
    }
  });

  it('should forbid doctor without approved consultation from viewing record item', async () => {
    const originalFindById = MedicalRecord.findById;
    const originalDoctorFindOne = Doctor.findOne;
    const originalApptExists = Appointment.exists;

    try {
      MedicalRecord.findById = () => ({
        populate: () => ({
          populate: () => ({
            lean: () => Promise.resolve({
              _id: '607f1f77bcf86cd799439001',
              patientId: { _id: '507f1f77bcf86cd799439011', name: 'Patient' },
              doctorId: { _id: '507f1f77bcf86cd799439088', name: 'Dr. Author' }, // Different doctor
              diagnosis: 'Cardiomyopathy',
              prescription: 'Metoprolol'
            })
          })
        })
      });

      Doctor.findOne = () => Promise.resolve({ _id: '507f1f77bcf86cd799439033', userId: '507f1f77bcf86cd799439077' });
      Appointment.exists = () => Promise.resolve(null); // No consultation

      const req = {
        user: { _id: '507f1f77bcf86cd799439077', role: 'doctor' },
        params: { id: '607f1f77bcf86cd799439001' }
      };
      const res = createMockRes();

      await getSingleRecord(req, res);

      assert.equal(res.statusCode, 403, 'Unauthorized doctor must be rejected with 403');
      assert.match(res.data.message, /do not have verified authorization/);
    } finally {
      MedicalRecord.findById = originalFindById;
      Doctor.findOne = originalDoctorFindOne;
      Appointment.exists = originalApptExists;
    }
  });

  it('should allow authorized patient to view their own detailed record item without exposing other patients', async () => {
    const originalFindById = MedicalRecord.findById;
    const originalDoctorFindOne = Doctor.findOne;

    try {
      const patientId = '507f1f77bcf86cd799439011';
      MedicalRecord.findById = () => ({
        populate: () => ({
          populate: () => ({
            lean: () => Promise.resolve({
              _id: '607f1f77bcf86cd799439001',
              patientId: { _id: patientId, name: 'Alice Patient' },
              doctorId: { _id: '507f1f77bcf86cd799439033', name: 'Dr. Jane Smith', email: 'jane@clinic.org' },
              diagnosis: 'Hypertension Stage 1',
              prescription: 'Lisinopril 10mg daily',
              files: ['https://example.com/report1.pdf'],
              createdAt: new Date('2026-10-10T12:00:00Z')
            })
          })
        })
      });

      Doctor.findOne = () => Promise.resolve({
        userId: '507f1f77bcf86cd799439033',
        specialization: 'Cardiology',
        hospital: 'MediCare Central Hospital'
      });

      const req = {
        user: { _id: patientId, role: 'patient' },
        params: { id: '607f1f77bcf86cd799439001' }
      };
      const res = createMockRes();

      await getSingleRecord(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.diagnosis, 'Hypertension Stage 1');
      assert.equal(res.data.doctorId.specialization, 'Cardiology');
      assert.equal(res.data.doctorId.hospital, 'MediCare Central Hospital');
      assert.equal(res.data.patientId.name, 'Alice Patient');
    } finally {
      MedicalRecord.findById = originalFindById;
      Doctor.findOne = originalDoctorFindOne;
    }
  });

  it('should validate and parse record query pagination parameters correctly', () => {
    const parsedValid = recordQuerySchema.safeParse({ page: '2', limit: '15', search: 'fever' });
    assert.equal(parsedValid.success, true);
    assert.equal(parsedValid.data.page, 2);
    assert.equal(parsedValid.data.limit, 15);
    assert.equal(parsedValid.data.search, 'fever');

    const parsedInvalid = recordQuerySchema.safeParse({ page: '-1' });
    assert.equal(parsedInvalid.success, false);
  });
});

describe('🔒 4. Appointment Integrity & State Transitions', () => {
  it('should reject appointment booking with a date in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pastBooking = {
      doctorId: '507f1f77bcf86cd799439033',
      date: yesterday.toISOString(),
      time: '10:00'
    };

    const result = bookAppointmentSchema.safeParse(pastBooking);
    assert.equal(result.success, false, 'Past booking date must fail validation');
    const issues = result.error.issues || result.error.errors || [];
    assert.match(issues[0]?.message || '', /valid future or current date/);
  });

  it('should reject malformed ObjectIds in route parameters', () => {
    const invalidId = { id: 'invalid-non-hex-id' };
    const result = idParamSchema.safeParse(invalidId);
    assert.equal(result.success, false, 'Malformed ObjectId must fail validation');
  });

  it('should forbid doctor A from modifying an appointment assigned to doctor B', async () => {
    const originalApptFindById = Appointment.findById;
    const originalDoctorFindOne = Doctor.findOne;

    try {
      Appointment.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439099',
        doctorId: '507f1f77bcf86cd799439033', // Belongs to Doctor B
        patientId: '507f1f77bcf86cd799439011',
        status: 'pending'
      });

      // Doctor A is authenticated
      Doctor.findOne = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439088', // Doctor A's doctor ID
        userId: '507f1f77bcf86cd799439077'
      });

      const req = {
        user: { _id: '507f1f77bcf86cd799439077', role: 'doctor' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: { status: 'approved' }
      };
      const res = createMockRes();

      await updateAppointmentStatus(req, res);

      assert.equal(res.statusCode, 403, 'Cross-doctor modification must be forbidden');
      assert.match(res.data.message, /cannot modify appointments assigned to another doctor/);
    } finally {
      Appointment.findById = originalApptFindById;
      Doctor.findOne = originalDoctorFindOne;
    }
  });

  it('should forbid patient from changing appointment status to approved', async () => {
    const originalApptFindById = Appointment.findById;

    try {
      Appointment.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439099',
        doctorId: '507f1f77bcf86cd799439033',
        patientId: '507f1f77bcf86cd799439011',
        status: 'pending'
      });

      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: { status: 'approved' } // Patient trying to self-approve
      };
      const res = createMockRes();

      await updateAppointmentStatus(req, res);

      assert.equal(res.statusCode, 403, 'Patient cannot approve their own appointment');
      assert.match(res.data.message, /Patients are only permitted to cancel/);
    } finally {
      Appointment.findById = originalApptFindById;
    }
  });

  it('should reject altering an appointment that is already in terminal "completed" state', async () => {
    const originalApptFindById = Appointment.findById;

    try {
      Appointment.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439099',
        doctorId: '507f1f77bcf86cd799439033',
        patientId: '507f1f77bcf86cd799439011',
        status: 'completed' // Terminal state
      });

      const req = {
        user: { _id: '507f1f77bcf86cd799439077', role: 'doctor' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: { status: 'pending' }
      };
      const res = createMockRes();

      await updateAppointmentStatus(req, res);

      assert.equal(res.statusCode, 400, 'Terminal state modification must be rejected with 400');
      assert.match(res.data.message, /already completed and cannot be altered/);
    } finally {
      Appointment.findById = originalApptFindById;
    }
  });
});

describe('🔒 5. Rate Limiting Middleware', () => {
  it('should return 429 when request rate exceeds configured maximum', () => {
    // Temporarily enable test rate limiting
    process.env.NODE_ENV = 'production';
    try {
      const limiter = rateLimit({ windowMs: 1000, max: 2 });
      const req = { ip: '192.168.1.100', headers: {} };
      let lastRes = null;

      for (let i = 0; i < 3; i++) {
        const res = createMockRes();
        limiter(req, res, () => {});
        lastRes = res;
      }

      assert.equal(lastRes.statusCode, 429, 'Excessive requests must return 429 Too Many Requests');
      assert.ok(lastRes.headers['Retry-After']);
    } finally {
      process.env.NODE_ENV = 'test';
    }
  });
});

describe('🔒 6. Double-Booking & Admin Safety Controls', () => {
  it('should reject appointment booking if doctor slot is already occupied', async () => {
    const originalDoctorFindById = Doctor.findById;
    const originalApptExists = Appointment.exists;

    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false }
        })
      });

      // Mock slotTaken = true
      Appointment.exists = () => Promise.resolve({ _id: 'existing_appt_id' });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        body: {
          doctorId: '507f1f77bcf86cd799439033',
          date: futureDate.toISOString(),
          time: '14:00'
        }
      };
      const res = createMockRes();

      await bookAppointment(req, res);

      assert.equal(res.statusCode, 400, 'Conflicting slot booking must be rejected with 400');
      assert.match(res.data.message, /already has a confirmed or pending booking at this time slot/);
    } finally {
      Doctor.findById = originalDoctorFindById;
      Appointment.exists = originalApptExists;
    }
  });

  it('should forbid blocking an admin account via toggleBlockUser', async () => {
    const originalUserFindById = User.findById;

    try {
      User.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439001',
        name: 'Chief Admin',
        role: 'admin',
        isBlocked: false,
        save: () => Promise.resolve()
      });

      const req = { params: { id: '507f1f77bcf86cd799439001' } };
      const res = createMockRes();

      await toggleBlockUser(req, res);

      assert.equal(res.statusCode, 400, 'Blocking admin account must be rejected with 400');
      assert.match(res.data.message, /Admin accounts cannot be blocked/);
    } finally {
      User.findById = originalUserFindById;
    }
  });
});

describe('🔒 7. Server Startup Environment Guard', () => {
  it('should validate and succeed when valid JWT_SECRET is configured', () => {
    const originalSecret = process.env.JWT_SECRET;
    try {
      process.env.JWT_SECRET = 'valid_production_grade_jwt_secret_with_adequate_entropy_32char';
      const config = validateEnv();
      assert.equal(config.JWT_SECRET, process.env.JWT_SECRET);
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });
});

describe('🔒 8. Scheduling Workflow, Concurrency & Calendar Availability', () => {
  it('should normalize calendar dates and weekdays deterministically without timezone shift', () => {
    assert.equal(normalizeCalendarDate('2026-10-25'), '2026-10-25');
    assert.equal(getDayOfWeekName('2026-10-25'), 'Sunday');
    assert.equal(getDayOfWeekName('2026-10-26'), 'Monday');
    assert.equal(getDayOfWeekName('2026-10-27'), 'Tuesday');
  });

  it('should validate doctor availability schema and reject invalid days or slot formats', () => {
    const valid = doctorAvailabilitySchema.safeParse({
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      availableTimeSlots: ['09:00', '10:30', '14:00']
    });
    assert.equal(valid.success, true);

    const invalidDay = doctorAvailabilitySchema.safeParse({
      availableDays: ['Funday']
    });
    assert.equal(invalidDay.success, false);

    const invalidSlot = doctorAvailabilitySchema.safeParse({
      availableTimeSlots: ['9am', '25:00']
    });
    assert.equal(invalidSlot.success, false);
  });

  it('should validate reschedule appointment schema and require valid future date and HH:mm slot', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const valid = rescheduleAppointmentSchema.safeParse({
      date: `${dateStr}T10:00:00.000Z`,
      time: '10:00',
      reason: 'Work conflict'
    });
    assert.equal(valid.success, true);

    const invalidSlot = rescheduleAppointmentSchema.safeParse({
      date: `${dateStr}T10:00:00.000Z`,
      time: '10 o clock'
    });
    assert.equal(invalidSlot.success, false);
  });

  it('should allow authenticated doctor to configure working days and time slots', async () => {
    const originalDoctorFindOne = Doctor.findOne;
    try {
      const mockDoctorDoc = {
        _id: '507f1f77bcf86cd799439033',
        userId: '507f1f77bcf86cd799439044',
        availableDays: ['Monday', 'Tuesday'],
        availableTimeSlots: ['09:00', '10:00'],
        save: async function() { return this; }
      };

      Doctor.findOne = () => Promise.resolve(mockDoctorDoc);

      const req = {
        user: { _id: '507f1f77bcf86cd799439044', role: 'doctor' },
        body: {
          availableDays: ['Monday', 'Wednesday', 'Friday'],
          availableTimeSlots: ['09:00', '11:00', '14:00']
        }
      };
      const res = createMockRes();

      await setDoctorAvailability(req, res);

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.data.availableDays, ['Monday', 'Wednesday', 'Friday']);
      assert.deepEqual(res.data.availableTimeSlots, ['09:00', '11:00', '14:00']);
    } finally {
      Doctor.findOne = originalDoctorFindOne;
    }
  });

  // Dynamic future weekday generator to ensure test stability regardless of execution date
  const getNextWeekdayDate = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetIdx = days.indexOf(dayName);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getUTCDay() !== targetIdx) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  it('should return empty slots when patient queries availability on a day the doctor does not practice', async () => {
    const originalDoctorFindById = Doctor.findById;
    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday', 'Wednesday'], // Sunday not included
          availableTimeSlots: ['09:00', '10:00']
        })
      });

      const nextSunday = getNextWeekdayDate('Sunday');
      const req = {
        params: { doctorId: '507f1f77bcf86cd799439033' },
        query: { date: nextSunday } // Sunday
      };
      const res = createMockRes();

      await getDoctorAvailability(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.available, false);
      assert.deepEqual(res.data.availableSlots, []);
      assert.match(res.data.reason, /does not hold clinical hours on Sundays/);
    } finally {
      Doctor.findById = originalDoctorFindById;
    }
  });

  it('should return bookable slots filtered of already booked slots on working day', async () => {
    const originalDoctorFindById = Doctor.findById;
    const originalApptFind = Appointment.find;
    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday', 'Wednesday'],
          availableTimeSlots: ['09:00', '09:30', '10:00', '10:30']
        })
      });

      const nextMonday = getNextWeekdayDate('Monday');
      // Mock slot 09:30 is already booked (pending/confirmed)
      Appointment.find = () => ({
        select: () => ({
          lean: () => Promise.resolve([
            { time: '09:30', status: 'confirmed' }
          ])
        })
      });

      const req = {
        params: { doctorId: '507f1f77bcf86cd799439033' },
        query: { date: nextMonday } // Monday
      };
      const res = createMockRes();

      await getDoctorAvailability(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.available, true);
      assert.deepEqual(res.data.bookedSlots, ['09:30']);
      assert.deepEqual(res.data.availableSlots, ['09:00', '10:00', '10:30']);
    } finally {
      Doctor.findById = originalDoctorFindById;
      Appointment.find = originalApptFind;
    }
  });

  it('should reject booking on a day the doctor does not practice', async () => {
    const originalDoctorFindById = Doctor.findById;
    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday'], // Sunday not included
          availableTimeSlots: ['09:00', '10:00']
        })
      });

      const nextSunday = getNextWeekdayDate('Sunday');
      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        body: {
          doctorId: '507f1f77bcf86cd799439033',
          date: `${nextSunday}T10:00:00.000Z`, // Sunday
          time: '10:00'
        }
      };
      const res = createMockRes();

      await bookAppointment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.data.message, /does not accept appointments on Sundays/);
    } finally {
      Doctor.findById = originalDoctorFindById;
    }
  });

  it('should reject booking when requested slot is not offered by the doctor', async () => {
    const originalDoctorFindById = Doctor.findById;
    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday'],
          availableTimeSlots: ['09:00', '10:00'] // 02:00 not offered
        })
      });

      const nextMonday = getNextWeekdayDate('Monday');
      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        body: {
          doctorId: '507f1f77bcf86cd799439033',
          date: `${nextMonday}T02:00:00.000Z`, // Monday
          time: '02:00'
        }
      };
      const res = createMockRes();

      await bookAppointment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.data.message, /outside.*configured consultation hours/);
    } finally {
      Doctor.findById = originalDoctorFindById;
    }
  });

  it('should handle simultaneous double submission and return 409 Conflict when unique index rejects race condition', async () => {
    const originalDoctorFindById = Doctor.findById;
    const originalApptExists = Appointment.exists;
    const originalApptCreate = Appointment.create;

    try {
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { _id: '507f1f77bcf86cd799439044', name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday', 'Wednesday'],
          availableTimeSlots: ['10:00']
        })
      });

      // Pretend exists check just barely passed concurrently
      Appointment.exists = () => Promise.resolve(null);

      // Simulate Mongo E11000 duplicate key error on concurrent insertion
      Appointment.create = () => {
        const err = new Error('E11000 duplicate key error collection: appointments index: doctorId_1_dateString_1_time_1');
        err.code = 11000;
        return Promise.reject(err);
      };

      const nextMonday = getNextWeekdayDate('Monday');
      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        body: {
          doctorId: '507f1f77bcf86cd799439033',
          date: `${nextMonday}T10:00:00.000Z`,
          time: '10:00'
        }
      };
      const res = createMockRes();

      await bookAppointment(req, res);

      assert.equal(res.statusCode, 409, 'Concurrent race condition must return 409 Conflict');
      assert.match(res.data.message, /Simultaneous booking conflict/);
    } finally {
      Doctor.findById = originalDoctorFindById;
      Appointment.exists = originalApptExists;
      Appointment.create = originalApptCreate;
    }
  });

  it('should forbid patient from rescheduling another patient appointment', async () => {
    const originalApptFindById = Appointment.findById;
    try {
      Appointment.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439099',
        patientId: '507f1f77bcf86cd799439011', // Belongs to Patient A
        doctorId: '507f1f77bcf86cd799439033',
        status: 'confirmed'
      });

      // Request sent by Patient B
      const req = {
        user: { _id: '507f1f77bcf86cd799439099', role: 'patient' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: {
          date: '2026-10-26T14:00:00.000Z',
          time: '14:00',
          reason: 'Schedule conflict'
        }
      };
      const res = createMockRes();

      await rescheduleAppointment(req, res);

      assert.equal(res.statusCode, 403);
      assert.match(res.data.message, /only reschedule your own appointments/);
    } finally {
      Appointment.findById = originalApptFindById;
    }
  });

  it('should reject rescheduling an appointment in terminal completed or cancelled state', async () => {
    const originalApptFindById = Appointment.findById;
    try {
      Appointment.findById = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439099',
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439033',
        status: 'completed'
      });

      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: {
          date: '2026-10-26T14:00:00.000Z',
          time: '14:00'
        }
      };
      const res = createMockRes();

      await rescheduleAppointment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.data.message, /Cannot reschedule appointment that is already completed/);
    } finally {
      Appointment.findById = originalApptFindById;
    }
  });

  it('should successfully reschedule active appointment and return it to pending for doctor review', async () => {
    const originalApptFindById = Appointment.findById;
    const originalDoctorFindById = Doctor.findById;
    const originalApptExists = Appointment.exists;

    try {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439099',
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439033',
        status: 'confirmed',
        date: new Date('2026-10-20T10:00:00.000Z'),
        time: '10:00',
        dateString: '2026-10-20',
        save: async function() { return this; },
        populate: async function() { return this; }
      };

      Appointment.findById = () => Promise.resolve(mockAppointment);
      Doctor.findById = () => ({
        populate: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439033',
          userId: { name: 'Dr. House', isBlocked: false },
          availableDays: ['Monday', 'Tuesday'],
          availableTimeSlots: ['14:00']
        })
      });
      Appointment.exists = () => Promise.resolve(null); // Slot free

      const nextMonday = getNextWeekdayDate('Monday');
      const req = {
        user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: {
          date: `${nextMonday}T14:00:00.000Z`,
          time: '14:00',
          reason: 'Need afternoon slot'
        }
      };
      const res = createMockRes();

      await rescheduleAppointment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(mockAppointment.status, 'pending', 'Rescheduled appointment must revert to pending for doctor confirmation');
      assert.equal(mockAppointment.time, '14:00');
      assert.equal(mockAppointment.dateString, nextMonday);
      assert.equal(mockAppointment.cancellationReason, 'Rescheduled: Need afternoon slot');
      assert.ok(mockAppointment.rescheduledFrom);
    } finally {
      Appointment.findById = originalApptFindById;
      Doctor.findById = originalDoctorFindById;
      Appointment.exists = originalApptExists;
    }
  });

  it('should allow assigned doctor to confirm, decline, or complete appointments', async () => {
    const originalApptFindById = Appointment.findById;
    const originalDoctorFindOne = Doctor.findOne;

    try {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439099',
        doctorId: '507f1f77bcf86cd799439033',
        patientId: '507f1f77bcf86cd799439011',
        status: 'pending',
        save: async function() { return this; },
        populate: async function() { return this; }
      };

      Appointment.findById = () => Promise.resolve(mockAppointment);
      Doctor.findOne = () => Promise.resolve({
        _id: '507f1f77bcf86cd799439033',
        userId: '507f1f77bcf86cd799439044'
      });

      // 1. Doctor confirms appointment
      const confirmReq = {
        user: { _id: '507f1f77bcf86cd799439044', role: 'doctor' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: { status: 'confirmed' }
      };
      const confirmRes = createMockRes();
      await updateAppointmentStatus(confirmReq, confirmRes);

      assert.equal(confirmRes.statusCode, 200);
      assert.equal(mockAppointment.status, 'confirmed');

      // 2. Doctor completes confirmed appointment
      const completeReq = {
        user: { _id: '507f1f77bcf86cd799439044', role: 'doctor' },
        params: { id: '507f1f77bcf86cd799439099' },
        body: { status: 'completed' }
      };
      const completeRes = createMockRes();
      await updateAppointmentStatus(completeReq, completeRes);

      assert.equal(completeRes.statusCode, 200);
      assert.equal(mockAppointment.status, 'completed');
    } finally {
      Appointment.findById = originalApptFindById;
      Doctor.findOne = originalDoctorFindOne;
    }
  });
});



