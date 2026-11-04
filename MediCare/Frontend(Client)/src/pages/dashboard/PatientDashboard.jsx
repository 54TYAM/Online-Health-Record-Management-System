import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  FileText,
  Search,
  Activity,
  MessageSquare,
  HeartPulse,
  Bone,
  Sparkles,
  Brain,
  Baby,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDoctorName } from '../../utils/formatters';

const appointmentSchema = z.object({
  doctorId: z.string().min(1, 'Please select a medical practitioner'),
  date: z.string().min(1, 'Consultation date is required'),
  time: z.string().min(1, 'Consultation time is required'),
});

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [records, setRecords] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Feedback State
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    doctorId: null,
    doctorName: '',
    rating: 5,
    comment: ''
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(appointmentSchema),
  });

  const watchedDoctorId = watch('doctorId');
  const watchedDate = watch('date');
  const watchedTime = watch('time');

  // Real-time Practitioner Availability State
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!watchedDoctorId || !watchedDate) {
      setDoctorAvailability(null);
      return;
    }
    let isMounted = true;
    const loadSlots = async () => {
      try {
        setCheckingAvailability(true);
        const res = await api.get(`/appointments/availability/${watchedDoctorId}?date=${watchedDate}`);
        if (isMounted) {
          setDoctorAvailability(res.data);
        }
      } catch (e) {
        if (isMounted) {
          setDoctorAvailability({
            available: false,
            availableSlots: [],
            reason: e.response?.data?.message || 'Could not verify practitioner availability'
          });
        }
      } finally {
        if (isMounted) setCheckingAvailability(false);
      }
    };
    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [watchedDoctorId, watchedDate]);

  // Reschedule Modal State
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    appointmentId: null,
    doctorId: null,
    doctorName: '',
    currentDate: '',
    currentTime: '',
    newDate: '',
    newTime: '',
    reason: ''
  });
  const [rescheduleAvailability, setRescheduleAvailability] = useState(null);
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const openRescheduleModal = (apt) => {
    const doctorName = apt.doctorId?.userId?.name || apt.doctorId?.name || 'Practitioner';
    const docId = apt.doctorId?._id || apt.doctorId;
    setRescheduleError('');
    setRescheduleModal({
      isOpen: true,
      appointmentId: apt._id,
      doctorId: docId,
      doctorName: formatDoctorName(doctorName),
      currentDate: apt.dateString || new Date(apt.date).toISOString().split('T')[0],
      currentTime: apt.time || '',
      newDate: '',
      newTime: '',
      reason: ''
    });
    setRescheduleAvailability(null);
  };

  useEffect(() => {
    if (!rescheduleModal.isOpen || !rescheduleModal.doctorId || !rescheduleModal.newDate) {
      setRescheduleAvailability(null);
      return;
    }
    let isMounted = true;
    const loadRescheduleSlots = async () => {
      try {
        setRescheduleLoadingSlots(true);
        const res = await api.get(`/appointments/availability/${rescheduleModal.doctorId}?date=${rescheduleModal.newDate}`);
        if (isMounted) setRescheduleAvailability(res.data);
      } catch (e) {
        if (isMounted) {
          setRescheduleAvailability({
            available: false,
            availableSlots: [],
            reason: e.response?.data?.message || 'Could not verify slot availability'
          });
        }
      } finally {
        if (isMounted) setRescheduleLoadingSlots(false);
      }
    };
    loadRescheduleSlots();
    return () => {
      isMounted = false;
    };
  }, [rescheduleModal.isOpen, rescheduleModal.doctorId, rescheduleModal.newDate]);

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModal.newDate || !rescheduleModal.newTime) {
      setRescheduleError('Please select both a new consultation date and time slot.');
      return;
    }
    try {
      setIsSubmittingReschedule(true);
      setRescheduleError('');
      await api.post(`/appointments/${rescheduleModal.appointmentId}/reschedule`, {
        date: `${rescheduleModal.newDate}T00:00:00.000Z`,
        time: rescheduleModal.newTime,
        reason: rescheduleModal.reason.trim()
      });
      setRescheduleModal({
        isOpen: false,
        appointmentId: null,
        doctorId: null,
        doctorName: '',
        currentDate: '',
        currentTime: '',
        newDate: '',
        newTime: '',
        reason: ''
      });
      await fetchAppointments();
      setBookingSuccess('Reschedule request submitted for physician review.');
      setTimeout(() => setBookingSuccess(''), 5000);
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    appointmentId: null,
    doctorName: '',
    date: '',
    reason: ''
  });
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const openCancelModal = (apt) => {
    const doctorName = apt.doctorId?.userId?.name || apt.doctorId?.name || 'Practitioner';
    setCancelError('');
    setCancelModal({
      isOpen: true,
      appointmentId: apt._id,
      doctorName: formatDoctorName(doctorName),
      date: apt.dateString || new Date(apt.date).toLocaleDateString(),
      reason: ''
    });
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingCancel(true);
      setCancelError('');
      await api.put(`/appointments/${cancelModal.appointmentId}/status`, {
        status: 'cancelled',
        cancellationReason: cancelModal.reason.trim() || 'Cancelled by patient'
      });
      setCancelModal({ isOpen: false, appointmentId: null, doctorName: '', date: '', reason: '' });
      await fetchAppointments();
      setBookingSuccess('Appointment cancelled successfully.');
      setTimeout(() => setBookingSuccess(''), 5000);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments/me');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching appointments:', e);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/auth/doctors');
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching doctors:', e);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await api.get('/records/me');
      const data = res.data;
      setRecords(Array.isArray(data) ? data : (data.records || []));
    } catch (e) {
      console.error('Error fetching records:', e);
    }
  }, []);

  const fetchMyFeedback = useCallback(async () => {
    try {
      const res = await api.get('/feedback/me');
      setMyFeedback(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching feedback:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchDoctors(),
        fetchMyFeedback(),
        fetchRecords()
      ]);
      if (isMounted) setLoading(false);
    };
    loadAll();
    return () => {
      isMounted = false;
    };
  }, [user, fetchAppointments, fetchDoctors, fetchMyFeedback, fetchRecords]);

  const onBook = async (data) => {
    try {
      setBookingError('');
      setBookingSuccess('');
      const combinedDate = `${data.date}T00:00:00.000Z`;

      await api.post('/appointments', {
        doctorId: data.doctorId,
        date: combinedDate,
        time: data.time
      });

      setBookingSuccess('Consultation request submitted for physician review.');
      await fetchAppointments();
      reset();
      setDoctorAvailability(null);
      setTimeout(() => setBookingSuccess(''), 5000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Consultation booking failed. Please try again.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackModal.doctorId) {
      setFeedbackError('Please select a doctor to review.');
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      setFeedbackError('');
      await api.post('/feedback', {
        doctorId: feedbackModal.doctorId,
        rating: feedbackModal.rating,
        comment: feedbackModal.comment
      });
      setFeedbackSuccess('Feedback submitted to clinical record successfully.');
      setFeedbackModal({ isOpen: false, doctorId: null, doctorName: '', rating: 5, comment: '' });
      await fetchMyFeedback();
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Doctors the patient has checked with (from completed, confirmed, approved, or active appointments)
  const checkedDoctors = useMemo(() => {
    const seenIds = new Set();
    const list = [];

    // Prioritize consultations that have taken place or are confirmed
    let targetApts = appointments.filter((apt) =>
      ['completed', 'confirmed', 'approved'].includes(apt.status)
    );

    // Fallback: any active (non-cancelled) appointment
    if (targetApts.length === 0) {
      targetApts = appointments.filter((apt) => apt.status !== 'cancelled');
    }

    targetApts.forEach((apt) => {
      const doc = apt.doctorId;
      if (!doc) return;
      const docId = typeof doc === 'object' ? doc._id?.toString() : doc.toString();
      if (docId && !seenIds.has(docId)) {
        seenIds.add(docId);
        const fullDoc = doctors.find((d) => d._id?.toString() === docId) || (typeof doc === 'object' ? doc : null);
        if (fullDoc) {
          list.push(fullDoc);
        }
      }
    });

    return list;
  }, [appointments, doctors]);

  const openFeedbackModal = (doctorId = null, doctorName = '') => {
    setFeedbackError('');
    const defaultDoctorId = doctorId || (checkedDoctors.length === 1 ? checkedDoctors[0]._id : '');
    setFeedbackModal({ isOpen: true, doctorId: defaultDoctorId, doctorName, rating: 5, comment: '' });
  };

  const categories = [
    { name: 'Cardiologist', icon: <HeartPulse size={16} />, label: 'Cardiology' },
    { name: 'Orthopedic', icon: <Bone size={16} />, label: 'Orthopedics' },
    { name: 'Dermatologist', icon: <Sparkles size={16} />, label: 'Dermatology' },
    { name: 'Neurologist', icon: <Brain size={16} />, label: 'Neurology' },
    { name: 'Pediatrician', icon: <Baby size={16} />, label: 'Pediatrics' },
    { name: 'General Physician', icon: <Stethoscope size={16} />, label: 'General Medicine' },
  ];

  const filteredDoctors = selectedCategory
    ? doctors.filter((d) => d.specialization === selectedCategory)
    : doctors;

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter =
      appointmentFilter === 'all'
        ? true
        : appointmentFilter === 'upcoming'
        ? apt.status === 'approved' || apt.status === 'pending'
        : apt.status === appointmentFilter;

    const doctorName = (apt.doctorId?.userId?.name || '').toLowerCase();
    const specialty = (apt.doctorId?.specialization || '').toLowerCase();
    const search = appointmentSearch.toLowerCase();
    const matchesSearch = !search || doctorName.includes(search) || specialty.includes(search);

    return matchesFilter && matchesSearch;
  });

  // Next scheduled consultation (earliest approved or pending)
  const nextAppointment = appointments
    .filter((a) => a.status === 'approved' || a.status === 'pending')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (loading) {
    return (
      <div className="py-16 text-center text-charcoal-600">
        <div className="inline-flex items-center gap-3 p-4 bg-ivory-50 border border-sand-300 rounded-lg shadow-2xs">
          <Loader2 className="animate-spin text-forest-700" size={20} />
          <span className="text-sm font-medium">Loading clinical profile & appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification */}
      {feedbackSuccess && (
        <div className="fixed top-5 right-5 bg-forest-800 text-ivory-50 px-5 py-3 rounded-md shadow-md z-50 flex items-center gap-3 border border-forest-900">
          <CheckCircle2 size={18} className="text-sage-400" />
          <span className="text-sm font-medium">{feedbackSuccess}</span>
        </div>
      )}

      {/* Header Greeting & Patient Context */}
      <section className="bg-ivory-50 border border-sand-300 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-forest-800 tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-forest-700" />
              Patient Health Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-charcoal-900 font-normal">
              Good day, {user?.name || 'Patient'}
            </h1>
            <p className="text-charcoal-600 text-sm mt-1">
              Patient Reference #{user?._id?.slice(-8)?.toUpperCase()} • Coordinated Health Management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/records"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-900 bg-sage-100 hover:bg-sage-200 border border-sage-300 rounded-md transition"
            >
              <FileText size={16} />
              Full Medical Records
            </Link>
            <button
              onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs"
            >
              <Plus size={16} />
              Schedule Visit
            </button>
          </div>
        </div>

        {/* Priority Banner: Next Action */}
        <div className="mt-6 pt-6 border-t border-sand-200">
          {nextAppointment ? (
            <div className="bg-ivory-100 border border-sand-300 rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-forest-800 text-ivory-50 rounded-md mt-0.5">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                      Next Scheduled Consultation
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        nextAppointment.status === 'approved'
                          ? 'bg-sage-200 text-forest-900 border border-sage-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {nextAppointment.status === 'approved' ? 'Confirmed Visit' : 'Awaiting Physician Confirmation'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-normal text-charcoal-900">
                    {formatDoctorName(nextAppointment.doctorId?.userId?.name || 'Assigned Specialist')}
                  </h3>
                  <p className="text-xs text-charcoal-600">
                    {nextAppointment.doctorId?.specialization || 'Clinical Specialist'} •{' '}
                    {nextAppointment.doctorId?.hospital || 'Hospital Affiliation On File'}
                  </p>
                </div>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-sand-200">
                <div className="text-sm font-semibold text-charcoal-900 flex items-center sm:justify-end gap-1.5">
                  <Clock size={15} className="text-forest-700" />
                  {new Date(nextAppointment.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs text-charcoal-600 font-mono mt-0.5">
                  Time: {new Date(nextAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-ivory-100 border border-sand-300 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 text-charcoal-700">
                <Calendar size={18} className="text-forest-700 shrink-0" />
                <span>No consultations currently scheduled. Keep your medical history synchronized with your care team.</span>
              </div>
              <button
                onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs font-semibold text-forest-800 hover:text-forest-900 flex items-center gap-1 shrink-0"
              >
                Schedule now <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Total Consultations
            </span>
            <Activity size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {appointments.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            {appointments.filter((a) => a.status === 'completed').length} completed •{' '}
            {appointments.filter((a) => a.status === 'approved').length} confirmed
          </p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Medical Records
            </span>
            <FileText size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {records.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Authorized diagnostic summaries on file
          </p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Care Reviews Given
            </span>
            <MessageSquare size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {myFeedback.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Reflections shared on physician consultations
          </p>
        </div>
      </section>

      {/* Main Grid: Appointments & Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Appointments List (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sand-200">
              <div>
                <h2 className="text-2xl font-serif font-normal text-charcoal-900">
                  Appointment History & Schedule
                </h2>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Verified appointments with attending physicians
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-ivory-100 p-1 border border-sand-200 rounded-md text-xs">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setAppointmentFilter(tab.key)}
                    className={`px-2.5 py-1 rounded transition font-medium ${
                      appointmentFilter === tab.key
                        ? 'bg-forest-800 text-ivory-50 shadow-2xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search within appointments */}
            <div className="mt-4 relative">
              <Search size={16} className="absolute left-3 top-3 text-charcoal-400" />
              <input
                type="text"
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                placeholder="Search by physician or clinical specialty..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
              />
            </div>

            {/* List */}
            <div className="mt-5 space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-sand-300 rounded-md bg-ivory-100/50">
                  <Calendar size={32} className="mx-auto text-charcoal-400 mb-2" />
                  <p className="text-sm font-medium text-charcoal-800">No appointments found</p>
                  <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
                    {appointmentSearch
                      ? 'No appointments match your search criteria.'
                      : 'You currently have no consultations in this status category.'}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt) => {
                  const doctorName = apt.doctorId?.userId?.name || apt.doctorId?.name || 'Clinical Practitioner';
                  const spec = apt.doctorId?.specialization || 'General Practice';
                  const hospital = apt.doctorId?.hospital || 'Affiliated Medical Center';
                  const isCompleted = apt.status === 'completed';
                  const isApproved = apt.status === 'approved' || apt.status === 'confirmed';
                  const isPending = apt.status === 'pending';
                  const isCancelled = apt.status === 'cancelled';

                  return (
                    <div
                      key={apt._id}
                      className="p-4 bg-ivory-100/60 border border-sand-300 rounded-md hover:border-sand-400 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-sage-200 border border-sage-300 text-forest-900 font-semibold flex items-center justify-center text-sm shrink-0">
                            {doctorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-base text-charcoal-900 font-normal">
                                {formatDoctorName(doctorName)}
                              </h3>
                              <span
                                className={`text-2xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-sage-200 text-forest-900 border border-sage-300'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : isCompleted
                                    ? 'bg-sand-200 text-charcoal-700 border border-sand-300'
                                    : isCancelled
                                    ? 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200'
                                    : 'bg-sand-100 text-charcoal-600 border border-sand-200'
                                }`}
                              >
                                {isApproved ? 'Confirmed' : apt.status}
                              </span>
                            </div>
                            <p className="text-xs text-charcoal-600 mt-0.5">
                              {spec} • <span className="text-charcoal-500">{hospital}</span>
                            </p>
                            {apt.rescheduledFrom && (
                              <div className="mt-1.5 inline-block text-2xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                                Rescheduled (Pending confirmation)
                              </div>
                            )}
                            {apt.cancellationReason && (
                              <div className="mt-2 p-2 bg-sand-200/50 border border-sand-300 rounded text-2xs text-charcoal-700">
                                <span className="font-semibold text-charcoal-900">Notes / Reason:</span> {apt.cancellationReason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right text-xs text-charcoal-600 border-t sm:border-t-0 pt-2 sm:pt-0 border-sand-200">
                          <div className="font-medium text-charcoal-900 flex items-center sm:justify-end gap-1.5">
                            <Clock size={13} className="text-forest-700" />
                            {new Date(apt.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="font-mono text-2xs text-charcoal-500 mt-0.5">
                            {apt.time || new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-3 pt-3 border-t border-sand-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-2xs font-mono text-charcoal-400">
                          ID: #{apt._id?.slice(-8)?.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          {(isPending || isApproved) && (
                            <>
                              <button
                                onClick={() => openRescheduleModal(apt)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-sand-300 rounded transition font-medium cursor-pointer"
                              >
                                <Calendar size={12} />
                                Reschedule
                              </button>
                              <button
                                onClick={() => openCancelModal(apt)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-ivory-100 hover:bg-terracotta-50 text-terracotta-800 border border-terracotta-200 rounded transition font-medium cursor-pointer"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </>
                          )}
                          {(isCompleted || isApproved) && (
                            <button
                              onClick={() => openFeedbackModal(apt.doctorId?._id, doctorName)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-800 hover:text-forest-900 cursor-pointer"
                            >
                              <MessageSquare size={13} />
                              Feedback
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Longitudinal Records Summary */}
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <h2 className="text-xl font-serif font-normal text-charcoal-900">
                  Recent Medical Records
                </h2>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Verified diagnosis and prescription summaries
                </p>
              </div>
              <Link
                to="/records"
                className="text-xs font-semibold text-forest-800 hover:text-forest-900 flex items-center gap-1"
              >
                All records ({records.length}) <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {records.length === 0 ? (
                <div className="text-center py-8 text-xs text-charcoal-500">
                  No records created yet. Notes entered by your physician will appear here.
                </div>
              ) : (
                records.slice(0, 3).map((rec) => (
                  <div key={rec._id} className="p-3.5 bg-ivory-100/60 border border-sand-300 rounded-md">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-charcoal-900">{rec.diagnosis}</h4>
                      <span className="text-2xs font-mono text-charcoal-500">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 mt-1">
                      Attending: {formatDoctorName(rec.doctorId?.name || 'Physician')} ({rec.doctorId?.specialization || 'Clinical'})
                    </p>
                    {rec.prescription && (
                      <div className="mt-2 text-2xs p-2 bg-ivory-50 border border-sand-200 rounded font-mono text-charcoal-700 truncate">
                        Rx: {rec.prescription}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Booking Form & Feedback Reviews (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          {/* Booking Consultation Card */}
          <div id="booking-section" className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="pb-4 border-b border-sand-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 uppercase tracking-wider mb-1">
                <Plus size={14} /> Schedule Consultation
              </div>
              <h2 className="text-xl font-serif font-normal text-charcoal-900">
                Book with a Specialist
              </h2>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Select your clinical discipline, preferred practitioner and date
              </p>
            </div>

            {/* Discipline Filter */}
            <div className="mt-4">
              <label className="block text-2xs font-semibold uppercase tracking-wider text-charcoal-500 mb-2">
                Filter by Discipline
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-2.5 py-1 text-xs rounded transition cursor-pointer ${
                    !selectedCategory
                      ? 'bg-forest-800 text-ivory-50 font-medium'
                      : 'bg-ivory-100 text-charcoal-700 border border-sand-300 hover:bg-ivory-200'
                  }`}
                >
                  All Specialists
                </button>
                {categories.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedCategory(c.name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition cursor-pointer ${
                      selectedCategory === c.name
                        ? 'bg-forest-800 text-ivory-50 font-medium'
                        : 'bg-ivory-100 text-charcoal-700 border border-sand-300 hover:bg-ivory-200'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Feedback Alerts */}
            {bookingError && (
              <div className="mt-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded text-xs text-terracotta-800 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-terracotta-700" />
                <span>{bookingError}</span>
              </div>
            )}
            {bookingSuccess && (
              <div className="mt-4 p-3 bg-sage-100 border border-sage-300 rounded text-xs text-forest-900 flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-forest-700" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onBook)} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Medical Practitioner <span className="text-terracotta-700">*</span>
                </label>
                <select
                  {...register('doctorId')}
                  className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
                >
                  <option value="">Choose an attending doctor...</option>
                  {filteredDoctors.map((doc) => {
                    const name = doc.userId?.name || doc.name || 'Practitioner';
                    const spec = doc.specialization || 'General';
                    const fee = doc.fees ? `$${doc.fees}` : 'Standard Fee';
                    return (
                      <option key={doc._id} value={doc._id}>
                        {formatDoctorName(name)} — {spec} ({fee})
                      </option>
                    );
                  })}
                </select>
                {errors.doctorId && (
                  <p className="text-2xs text-terracotta-700 mt-1">{errors.doctorId.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Consultation Date <span className="text-terracotta-700">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                  {errors.date && (
                    <p className="text-2xs text-terracotta-700 mt-1">{errors.date.message}</p>
                  )}
                </div>

                {/* Real-time Available Consultation Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-charcoal-700">
                      Open Time Slots <span className="text-terracotta-700">*</span>
                    </label>
                    {checkingAvailability && (
                      <span className="text-2xs text-forest-700 flex items-center gap-1 font-sans">
                        <Loader2 size={11} className="animate-spin" /> Verifying practitioner availability...
                      </span>
                    )}
                  </div>

                  <input type="hidden" {...register('time')} />

                  {!watchedDoctorId || !watchedDate ? (
                    <div className="p-3 bg-ivory-100/60 border border-sand-200 rounded text-2xs text-charcoal-500 italic">
                      Please select both a medical practitioner and date to view bookable consultation slots.
                    </div>
                  ) : doctorAvailability && !doctorAvailability.available ? (
                    <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded text-xs text-terracotta-800">
                      {doctorAvailability.reason || 'No appointment slots available for this physician on the selected date.'}
                    </div>
                  ) : doctorAvailability && doctorAvailability.availableSlots ? (
                    <div>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-ivory-100/70 border border-sand-300 rounded-md max-h-36 overflow-y-auto">
                        {doctorAvailability.availableSlots.length === 0 ? (
                          <span className="text-2xs text-charcoal-500 italic">All appointment slots for this date are currently booked.</span>
                        ) : (
                          doctorAvailability.availableSlots.map((slot) => {
                            const isSelected = watchedTime === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setValue('time', slot, { shouldValidate: true })}
                                className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-forest-800 text-ivory-50 font-semibold shadow-2xs'
                                    : 'bg-ivory-50 text-charcoal-800 border border-sand-300 hover:bg-sage-100 hover:border-sage-300'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })
                        )}
                      </div>
                      {watchedTime && (
                        <p className="text-2xs text-forest-800 font-medium mt-1.5 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-forest-700" /> Selected slot: <span className="font-mono">{watchedTime}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-ivory-100/60 border border-sand-200 rounded text-2xs text-charcoal-500 italic">
                      Select a date to retrieve open appointment slots.
                    </div>
                  )}

                  {errors.time && (
                    <p className="text-2xs text-terracotta-700 mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded-md transition shadow-2xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Transmitting Consultation Request...</span>
                  </>
                ) : (
                  'Confirm Consultation Booking'
                )}
              </button>
            </form>
          </div>

          {/* Feedback & Care Reviews */}
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div>
                <h3 className="text-lg font-serif font-normal text-charcoal-900">
                  My Clinical Reviews
                </h3>
                <p className="text-xs text-charcoal-600">
                  Shared patient feedback on consultation quality
                </p>
              </div>
              <button
                onClick={() => openFeedbackModal()}
                className="text-xs px-2.5 py-1 bg-sage-100 border border-sage-300 text-forest-900 font-medium rounded hover:bg-sage-200 transition cursor-pointer"
              >
                Write Review
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {myFeedback.length === 0 ? (
                <div className="text-center py-6 text-xs text-charcoal-500">
                  No feedback records filed yet. Reviews help enhance ongoing clinical care quality.
                </div>
              ) : (
                myFeedback.slice(0, 4).map((fb) => (
                  <div key={fb._id} className="p-3 bg-ivory-100/60 border border-sand-300 rounded-md">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-charcoal-900">
                        {formatDoctorName(fb.doctorId?.userId?.name || 'Practitioner')}
                      </span>
                      <div className="flex items-center text-amber-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < fb.rating ? 'currentColor' : 'none'}
                            className={i < fb.rating ? 'text-amber-500' : 'text-sand-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-charcoal-600 mt-1 italic">
                      "{fb.comment}"
                    </p>
                    <span className="text-2xs font-mono text-charcoal-500 block mt-1.5">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Clinical Care Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
                Care Reflection
              </span>
              <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
                Physician Consultation Feedback
              </h3>
              <p className="text-xs text-charcoal-600 mt-1">
                {feedbackModal.doctorName
                  ? `Share your structured evaluation of ${formatDoctorName(feedbackModal.doctorName)}.`
                  : 'Select an attending practitioner and provide your clinical experience review.'}
              </p>
            </div>

            {feedbackError && (
              <div className="mb-3 p-2.5 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded">
                {feedbackError}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {!feedbackModal.doctorName && (
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Select Practitioner
                  </label>
                  {checkedDoctors.length === 0 ? (
                    <div className="p-3 bg-sand-100 border border-sand-300 rounded text-xs text-charcoal-600">
                      No consulted physicians available. You can submit feedback after booking or completing a consultation with a doctor.
                    </div>
                  ) : (
                    <select
                      required
                      value={feedbackModal.doctorId || ''}
                      onChange={(e) => setFeedbackModal({ ...feedbackModal, doctorId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
                    >
                      <option value="">Choose attending physician...</option>
                      {checkedDoctors.map((d) => (
                        <option key={d._id} value={d._id}>
                          {formatDoctorName(d.userId?.name || d.name)} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1.5">
                  Clinical Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackModal({ ...feedbackModal, rating: star })}
                      className="p-1 text-charcoal-400 hover:text-amber-500 transition cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={22}
                        fill={star <= feedbackModal.rating ? 'currentColor' : 'none'}
                        className={star <= feedbackModal.rating ? 'text-amber-500' : 'text-sand-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-charcoal-500 self-center ml-2">
                    {feedbackModal.rating} of 5 stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Comments & Observations
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackModal.comment}
                  onChange={(e) => setFeedbackModal({ ...feedbackModal, comment: e.target.value })}
                  placeholder="Share details regarding consultation timeliness, clarity of diagnosis, and treatment guidance..."
                  className="w-full p-3 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || (!feedbackModal.doctorName && checkedDoctors.length === 0)}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Consultation Modal */}
      {rescheduleModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Consultation Management
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Request Appointment Reschedule
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-4">
              Attending: <span className="font-semibold text-charcoal-900">{rescheduleModal.doctorName}</span> • Current: {rescheduleModal.currentDate} ({rescheduleModal.currentTime})
            </p>

            {rescheduleError && (
              <div className="mb-4 p-2.5 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-terracotta-700" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Select New Date <span className="text-terracotta-700">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleModal.newDate}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value, newTime: '' })}
                  className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-charcoal-700">
                    Select New Consultation Slot <span className="text-terracotta-700">*</span>
                  </label>
                  {rescheduleLoadingSlots && (
                    <span className="text-2xs text-forest-700 flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> Fetching slots...
                    </span>
                  )}
                </div>

                {!rescheduleModal.newDate ? (
                  <div className="p-3 bg-ivory-100/60 border border-sand-200 rounded text-2xs text-charcoal-500 italic">
                    Choose a date above to display currently available time slots.
                  </div>
                ) : rescheduleAvailability && !rescheduleAvailability.available ? (
                  <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded text-xs text-terracotta-800">
                    {rescheduleAvailability.reason || 'Doctor does not hold office hours on this date.'}
                  </div>
                ) : rescheduleAvailability && rescheduleAvailability.availableSlots ? (
                  <div>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-ivory-100/70 border border-sand-300 rounded-md max-h-36 overflow-y-auto">
                      {rescheduleAvailability.availableSlots.length === 0 ? (
                        <span className="text-2xs text-charcoal-500 italic">No remaining open slots for this date.</span>
                      ) : (
                        rescheduleAvailability.availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setRescheduleModal({ ...rescheduleModal, newTime: slot })}
                            className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                              rescheduleModal.newTime === slot
                                ? 'bg-forest-800 text-ivory-50 font-semibold shadow-2xs'
                                : 'bg-ivory-50 text-charcoal-800 border border-sand-300 hover:bg-sage-100'
                            }`}
                          >
                            {slot}
                          </button>
                        ))
                      )}
                    </div>
                    {rescheduleModal.newTime && (
                      <p className="text-2xs text-forest-800 font-medium mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-forest-700" /> Selected slot: <span className="font-mono">{rescheduleModal.newTime}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-ivory-100/60 border border-sand-200 rounded text-2xs text-charcoal-500 italic">
                    Retrieving open schedule...
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Reason for Rescheduling (Optional)
                </label>
                <textarea
                  rows={2}
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, reason: e.target.value })}
                  placeholder="e.g. Schedule conflict with work; need afternoon consultation..."
                  className="w-full p-2.5 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none font-sans"
                />
              </div>

              <div className="p-2.5 bg-ivory-100 border border-sand-200 rounded text-2xs text-charcoal-600">
                Rescheduling resets the status to pending for clinical review. Your previous reservation will be released only upon confirmation.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule || !rescheduleModal.newDate || !rescheduleModal.newTime}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingReschedule ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Reschedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              Appointment Cancellation
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Cancel Consultation
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-4">
              With: <span className="font-semibold text-charcoal-900">{cancelModal.doctorName}</span> on {cancelModal.date}
            </p>

            {cancelError && (
              <div className="mb-4 p-2.5 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-terracotta-700" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  placeholder="Share a brief reason for cancellation (e.g. feeling better, schedule conflict)..."
                  className="w-full p-2.5 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-terracotta-700 hover:bg-terracotta-800 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingCancel ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
