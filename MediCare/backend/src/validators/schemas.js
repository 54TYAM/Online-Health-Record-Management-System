import { z } from 'zod';

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid resource ID format')
});

export const patientIdParamSchema = z.object({
  patientId: z.string().regex(objectIdRegex, 'Invalid patient ID format')
});

export const doctorIdParamSchema = z.object({
  doctorId: z.string().regex(objectIdRegex, 'Invalid doctor ID format')
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be under 100 characters'),
  // Public registration creates patient accounts only. Client-supplied privileged roles are rejected.
  role: z.enum(['patient'], {
    errorMap: () => ({ message: 'Public registration creates patient accounts only. Privileged accounts must be created through authorized administrator workflows.' })
  }).optional().default('patient')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const dayOfWeekEnum = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]);

export const timeSlotRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  specialization: z.string().trim().max(100).optional(),
  experience: z.coerce.number().min(0, 'Experience must be 0 or more').max(70, 'Experience must be realistic').optional(),
  fees: z.coerce.number().min(0, 'Fees must be 0 or more').max(100000, 'Fees exceeded maximum limit').optional(),
  hospital: z.string().trim().max(150).optional(),
  availableDays: z.array(dayOfWeekEnum).optional(),
  availableTimeSlots: z.array(z.string().regex(timeSlotRegex, 'Time slots must be in HH:mm 24-hour format')).optional()
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().regex(objectIdRegex, 'Invalid Doctor ID'),
  date: z.string().refine((val) => {
    const timestamp = Date.parse(val);
    if (isNaN(timestamp)) return false;
    // Reject dates strictly in the past (allow today onwards)
    const bookingDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }, {
    message: 'Appointment date must be a valid future or current date'
  }),
  time: z.string().trim().regex(timeSlotRegex, 'Appointment time must be in valid HH:mm format')
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'confirmed', 'completed', 'cancelled'], {
    errorMap: () => ({ message: "Status must be 'pending', 'approved', 'confirmed', 'completed', or 'cancelled'" })
  }),
  cancellationReason: z.string().trim().max(500).optional()
});

export const rescheduleAppointmentSchema = z.object({
  date: z.string().refine((val) => {
    const timestamp = Date.parse(val);
    if (isNaN(timestamp)) return false;
    const bookingDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }, {
    message: 'Reschedule date must be a valid future or current date'
  }),
  time: z.string().trim().regex(timeSlotRegex, 'Reschedule time must be in valid HH:mm format'),
  reason: z.string().trim().max(500).optional()
});

export const doctorAvailabilitySchema = z.object({
  availableDays: z.array(dayOfWeekEnum).min(1, 'Doctor must configure at least one available day'),
  availableTimeSlots: z.array(z.string().regex(timeSlotRegex, 'Time slots must be in HH:mm format')).min(1, 'At least one time slot is required')
});

export const availabilityQuerySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid calendar date format' }).optional()
});

export const addMedicalRecordSchema = z.object({
  patientId: z.string().regex(objectIdRegex, 'Invalid Patient ID'),
  diagnosis: z.string().trim().min(2, 'Diagnosis must be at least 2 characters').max(2000, 'Diagnosis cannot exceed 2000 characters'),
  prescription: z.string().trim().min(2, 'Prescription must be at least 2 characters').max(5000, 'Prescription cannot exceed 5000 characters'),
  // File uploads are currently an external string reference / URL placeholder (see architecture documentation)
  files: z.array(z.string().trim().max(1000)).max(10, 'A maximum of 10 attachments may be referenced').optional().default([])
});

export const createFeedbackSchema = z.object({
  doctorId: z.string().regex(objectIdRegex, 'Invalid Doctor ID'),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(1000, 'Comment cannot exceed 1000 characters').optional().default('')
});

export const createDoctorAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  specialization: z.string().trim().min(2, 'Specialization required').max(100).default('General Physician'),
  experience: z.coerce.number().min(0).max(70).default(0),
  fees: z.coerce.number().min(0).max(100000).default(0),
  hospital: z.string().trim().max(150).default('Independent Practice')
});

export const recordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  doctorId: z.string().regex(objectIdRegex, 'Invalid Doctor ID').optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date format' }).optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
  paginate: z.enum(['true', 'false']).optional()
});

