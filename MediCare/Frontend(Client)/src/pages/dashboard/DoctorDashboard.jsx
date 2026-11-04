import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Check,
  X,
  Clock,
  Users,
  MessageSquare,
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Star,
  Stethoscope
} from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // appointmentId currently updating

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments/me');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching appointments:', e);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await api.get('/feedback/me');
      setFeedback(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching feedback:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchFeedback()]);
      if (isMounted) setLoading(false);
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchAppointments, fetchFeedback]);

  // Appointment Status Updates
  const updateStatus = async (id, status) => {
    try {
      setActionLoading(id);
      await api.put(`/appointments/${id}/status`, { status });
      await fetchAppointments();
      showToast(`Appointment status updated to ${status}.`);
    } catch (e) {
      console.error('Failed to update status:', e);
      showError(e.response?.data?.message || 'Failed to update consultation status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Schedule & Availability Modal State
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availableDays, setAvailableDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]);
  const [newCustomSlot, setNewCustomSlot] = useState('');

  const openAvailability = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.availableDays && res.data.availableDays.length) {
        setAvailableDays(res.data.availableDays);
      }
      if (res.data.availableTimeSlots && res.data.availableTimeSlots.length) {
        setAvailableTimeSlots(res.data.availableTimeSlots);
      }
      setIsAvailabilityOpen(true);
    } catch (e) {
      console.error('Failed to retrieve availability:', e);
      showError('Could not load consultation schedule.');
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (!availableDays.length) {
      showError('Doctor must configure at least one active working day.');
      return;
    }
    if (!availableTimeSlots.length) {
      showError('Doctor must configure at least one consultation time slot.');
      return;
    }
    try {
      setAvailabilitySaving(true);
      await api.put('/appointments/availability', {
        availableDays,
        availableTimeSlots
      });
      setIsAvailabilityOpen(false);
      showToast('Consultation schedule and clinical hours saved.');
    } catch (e) {
      console.error(e);
      showError(e.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) {
        showError('At least one consultation day is required');
        return;
      }
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleSlot = (slot) => {
    if (availableTimeSlots.includes(slot)) {
      if (availableTimeSlots.length === 1) {
        showError('At least one consultation slot is required');
        return;
      }
      setAvailableTimeSlots(availableTimeSlots.filter((s) => s !== slot));
    } else {
      setAvailableTimeSlots([...availableTimeSlots, slot].sort());
    }
  };

  const addCustomSlot = () => {
    const slot = newCustomSlot.trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot)) {
      showError('Time slot must be formatted as 24h HH:mm (e.g. 08:30 or 17:00)');
      return;
    }
    if (availableTimeSlots.includes(slot)) {
      showError('Slot already included in schedule');
      return;
    }
    setAvailableTimeSlots([...availableTimeSlots, slot].sort());
    setNewCustomSlot('');
  };

  // Decline Modal State
  const [declineModal, setDeclineModal] = useState({
    isOpen: false,
    appointmentId: null,
    patientName: '',
    reason: ''
  });

  const openDeclineModal = (aptId, patientName) => {
    setDeclineModal({
      isOpen: true,
      appointmentId: aptId,
      patientName,
      reason: ''
    });
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(declineModal.appointmentId);
      await api.put(`/appointments/${declineModal.appointmentId}/status`, {
        status: 'cancelled',
        cancellationReason: declineModal.reason.trim() || 'Declined by attending physician'
      });
      setDeclineModal({ isOpen: false, appointmentId: null, patientName: '', reason: '' });
      await fetchAppointments();
      showToast('Consultation request declined.');
    } catch (e) {
      console.error(e);
      showError(e.response?.data?.message || 'Failed to decline consultation.');
    } finally {
      setActionLoading(null);
    }
  };

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    specialization: '',
    experience: '',
    fees: '',
    hospital: ''
  });

  const openProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfileData({
        name: res.data.name || '',
        specialization: res.data.specialization || '',
        experience: res.data.experience || '',
        fees: res.data.fees || '',
        hospital: res.data.hospital || ''
      });
      setIsProfileOpen(true);
    } catch (e) {
      console.error('Failed to retrieve profile:', e);
      showError('Could not load practitioner profile.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await api.put('/auth/profile', profileData);
      setIsProfileOpen(false);
      showToast('Practitioner profile credentials saved successfully.');
    } catch (e) {
      console.error(e);
      showError(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Record Creation Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [recordData, setRecordData] = useState({
    patientId: '',
    patientName: '',
    diagnosis: '',
    prescription: ''
  });

  const openRecordModal = (patientId, patientName) => {
    setRecordError('');
    setRecordData({
      patientId,
      patientName,
      diagnosis: '',
      prescription: ''
    });
    setIsRecordOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordData.diagnosis.trim() || !recordData.prescription.trim()) {
      setRecordError('Both diagnosis and prescription regimen are required.');
      return;
    }

    try {
      setRecordSaving(true);
      setRecordError('');
      await api.post('/records', {
        patientId: recordData.patientId,
        diagnosis: recordData.diagnosis,
        prescription: recordData.prescription,
        files: []
      });
      setIsRecordOpen(false);
      showToast(`Prescription & diagnosis securely added to patient record.`);
    } catch (e) {
      console.error(e);
      setRecordError(e.response?.data?.message || 'Failed to add medical record.');
    } finally {
      setRecordSaving(false);
    }
  };

  // Computed Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const today = appointments.filter(
      (a) => new Date(a.date).toDateString() === new Date().toDateString()
    ).length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const avgRating =
      feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + (f.rating || 5), 0) / feedback.length).toFixed(1)
        : null;

    return { total, today, pending, completed, avgRating };
  }, [appointments, feedback]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const isApprovedOrConfirmed = apt.status === 'approved' || apt.status === 'confirmed';
      const matchesFilter =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? apt.status === 'pending' || isApprovedOrConfirmed
          : statusFilter === 'approved'
          ? isApprovedOrConfirmed
          : apt.status === statusFilter;

      const pName = (apt.patientId?.name || '').toLowerCase();
      const pEmail = (apt.patientId?.email || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || pName.includes(q) || pEmail.includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [appointments, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="py-20 text-center text-charcoal-600">
        <div className="inline-flex items-center gap-3 p-4 bg-ivory-50 border border-sand-300 rounded-lg shadow-xs">
          <Loader2 className="animate-spin text-forest-700" size={20} />
          <span className="text-sm font-medium">Loading clinical schedule & patient queues...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-forest-800 text-ivory-50 px-5 py-3 rounded-md shadow-md z-50 flex items-center gap-3 border border-forest-900 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-sage-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="fixed top-5 right-5 bg-terracotta-800 text-ivory-50 px-5 py-3 rounded-md shadow-md z-50 flex items-center gap-3 border border-terracotta-900 animate-in fade-in duration-200">
          <AlertCircle size={18} className="text-terracotta-300 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Clinical Console Header */}
      <section className="bg-ivory-50 border border-sand-300 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-forest-800 tracking-wider uppercase mb-2">
              <Stethoscope size={15} />
              Attending Physician Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-charcoal-900 font-normal">
              {formatDoctorName(user?.name)}
            </h1>
            <p className="text-charcoal-600 text-sm mt-1">
              Clinical Practice Console • Authorized Diagnostic Record Authoring
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAvailability}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-900 bg-sage-100 hover:bg-sage-200 border border-sage-300 rounded-md transition cursor-pointer"
            >
              <Clock size={16} />
              Consultation Schedule
            </button>
            <button
              onClick={openProfile}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
            >
              <Briefcase size={16} />
              Practitioner Profile
            </button>
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-6 pt-6 border-t border-sand-200 flex flex-wrap items-center justify-between gap-4 text-xs text-charcoal-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest-700" />
            <span>Consultation queue synchronized with central EHR scheduling</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>Server Session: Active</span>
            <span>•</span>
            <span>Access Tier: Clinical Practitioner</span>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Total Consultations
            </span>
            <Users size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {stats.total}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            {stats.completed} visits marked completed
          </p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Today's Schedule
            </span>
            <Clock size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {stats.today}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Consultations booked for today
          </p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Pending Action
            </span>
            <AlertCircle size={18} className="text-amber-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {stats.pending}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Awaiting physician approval
          </p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Patient Rating
            </span>
            <Star size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal flex items-baseline gap-1">
            {stats.avgRating ? `${stats.avgRating}` : 'N/A'}
            {stats.avgRating && <span className="text-xs text-charcoal-500 font-sans">/ 5.0</span>}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Based on {feedback.length} verified review{feedback.length === 1 ? '' : 's'}
          </p>
        </div>
      </section>

      {/* Main Grid: Queue on Left (8 cols), Feedback/Activity on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Appointment Queue (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sand-200">
              <div>
                <h2 className="text-2xl font-serif font-normal text-charcoal-900">
                  Appointment Queue & Care Schedule
                </h2>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Manage patient consultation requests and author medical records
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-ivory-100 p-1 border border-sand-200 rounded-md text-xs">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: `Pending (${stats.pending})` },
                  { key: 'approved', label: 'Confirmed' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-2.5 py-1 rounded transition font-medium cursor-pointer ${
                      statusFilter === tab.key
                        ? 'bg-forest-800 text-ivory-50 shadow-2xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <Search size={16} className="absolute left-3 top-3 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name or email address..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
              />
            </div>

            {/* Appointments Table / List */}
            <div className="mt-5 space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-sand-300 rounded-md bg-ivory-100/50">
                  <Users size={32} className="mx-auto text-charcoal-400 mb-2" />
                  <p className="text-sm font-medium text-charcoal-800">No appointments found</p>
                  <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No appointments match the given patient query.'
                      : 'You currently have no patient appointments under this filter.'}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt) => {
                  const patientName = apt.patientId?.name || 'Patient';
                  const patientEmail = apt.patientId?.email || 'No email registered';
                  const isPending = apt.status === 'pending';
                  const isApproved = apt.status === 'approved' || apt.status === 'confirmed';
                  const isCompleted = apt.status === 'completed';
                  const isCancelled = apt.status === 'cancelled';
                  const isUpdating = actionLoading === apt._id;

                  return (
                    <div
                      key={apt._id}
                      className="p-4 bg-ivory-100/60 border border-sand-300 rounded-md hover:border-sand-400 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Patient Info */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-sage-200 border border-sage-300 text-forest-900 font-semibold flex items-center justify-center text-sm shrink-0">
                            {patientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-base text-charcoal-900 font-normal">
                                {patientName}
                              </h3>
                              <span
                                className={`text-2xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-sage-200 text-forest-900 border border-sage-300'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : isCompleted
                                    ? 'bg-sand-200 text-charcoal-700 border border-sand-300'
                                    : 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </div>
                            <p className="text-xs text-charcoal-600 mt-0.5 font-mono">
                              {patientEmail}
                            </p>
                            {apt.rescheduledFrom && (
                              <div className="mt-1.5 inline-block text-2xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                                Rescheduled consultation request
                              </div>
                            )}
                            {apt.cancellationReason && (
                              <div className="mt-2 p-2 bg-sand-200/50 border border-sand-300 rounded text-2xs text-charcoal-700">
                                <span className="font-semibold text-charcoal-900">Notes / Reason:</span> {apt.cancellationReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Scheduled Date */}
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

                      {/* Action Bar */}
                      <div className="mt-3 pt-3 border-t border-sand-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-2xs font-mono text-charcoal-500">
                          ID: #{apt._id?.slice(-8)?.toUpperCase()}
                        </span>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <>
                              <button
                                disabled={isUpdating}
                                onClick={() => updateStatus(apt._id, 'confirmed')}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded transition shadow-2xs disabled:opacity-60 cursor-pointer"
                              >
                                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Confirm Consultation
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => openDeclineModal(apt._id, patientName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-ivory-100 hover:bg-terracotta-50 text-terracotta-800 border border-terracotta-200 text-xs font-medium rounded transition disabled:opacity-60 cursor-pointer"
                              >
                                <X size={12} />
                                Decline
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <button
                                onClick={() => openRecordModal(apt.patientId?._id || apt.patientId, patientName)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-sage-200 hover:bg-sage-300 text-forest-900 border border-sage-300 text-xs font-medium rounded transition cursor-pointer"
                              >
                                <FileText size={12} />
                                Author Rx / Record
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => updateStatus(apt._id, 'completed')}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded transition shadow-2xs disabled:opacity-60 cursor-pointer"
                              >
                                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Mark Complete
                              </button>
                            </>
                          )}

                          {isCompleted && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-2xs text-charcoal-600 font-medium bg-ivory-50 border border-sand-300 px-2 py-0.5 rounded">
                                <CheckCircle2 size={11} className="text-forest-700" /> Visit Concluded
                              </span>
                              <button
                                onClick={() => openRecordModal(apt.patientId?._id || apt.patientId, patientName)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs text-forest-800 hover:text-forest-900 font-medium cursor-pointer"
                              >
                                Add Follow-up Note
                              </button>
                            </div>
                          )}

                          {isCancelled && (
                            <span className="text-2xs text-terracotta-700 italic">
                              Consultation Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Feedback & Recent Activity (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div>
                <h3 className="text-lg font-serif font-normal text-charcoal-900">
                  Patient Reviews & Ratings
                </h3>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Verified reflections on clinical quality
                </p>
              </div>
              <MessageSquare size={18} className="text-forest-700" />
            </div>

            <div className="mt-4 space-y-3">
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-xs text-charcoal-500">
                  No patient reviews recorded yet. Evaluations submitted after visits will appear here.
                </div>
              ) : (
                feedback.map((fb) => (
                  <div key={fb._id} className="p-3.5 bg-ivory-100/60 border border-sand-300 rounded-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-forest-800 text-ivory-50 text-2xs font-semibold flex items-center justify-center">
                          {(fb.patientId?.name?.[0] || 'P').toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-charcoal-900">
                          {fb.patientId?.name || 'Verified Patient'}
                        </span>
                      </div>
                      <div className="flex text-amber-500 text-xs">
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

                    <p className="text-xs text-charcoal-700 mt-2 italic">
                      "{fb.comment}"
                    </p>

                    <div className="mt-2 text-2xs font-mono text-charcoal-400 text-right">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Practitioner Registry
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Edit Clinical Profile Credentials
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-5">
              These details are presented to patients during consultation scheduling.
            </p>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Practitioner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                    placeholder="e.g. Cardiologist"
                    className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.experience}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.fees}
                    onChange={(e) => setProfileData({ ...profileData, fees: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    value={profileData.hospital}
                    onChange={(e) => setProfileData({ ...profileData, hospital: e.target.value })}
                    placeholder="e.g. MediCare Memorial"
                    className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Record Authoring Modal */}
      {isRecordOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={() => setIsRecordOpen(false)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Clinical EHR Authoring
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Record Diagnosis & Prescription
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-4">
              Patient: <span className="font-semibold text-charcoal-900">{recordData.patientName}</span> • Enforced RBAC Policy
            </p>

            {recordError && (
              <div className="mb-4 p-2.5 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-terracotta-700" />
                <span>{recordError}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Primary Diagnostic Formulation <span className="text-terracotta-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential Hypertension (Stage 1), Acute Bronchitis"
                  value={recordData.diagnosis}
                  onChange={(e) => setRecordData({ ...recordData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Prescription & Regimen Details <span className="text-terracotta-700">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Lisinopril 10mg PO once daily in morning. Low sodium diet recommendation. Follow-up in 4 weeks with BP log."
                  value={recordData.prescription}
                  onChange={(e) => setRecordData({ ...recordData, prescription: e.target.value })}
                  className="w-full p-3 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none font-sans"
                />
              </div>

              <div className="p-3 bg-ivory-100 border border-sand-200 rounded text-2xs text-charcoal-500">
                Authoring this record establishes a confidential longitudinal entry visible to patient #{recordData.patientId?.slice(-6)?.toUpperCase()} and attending clinical staff.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordSaving}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {recordSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving to EHR...</span>
                    </>
                  ) : (
                    'Save & Commit Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule & Clinical Availability Modal */}
      {isAvailabilityOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAvailabilityOpen(false)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
              <Clock size={14} />
              <span>Practice Operations</span>
            </div>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Consultation Schedule & Availability
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-5">
              Configure your active practice days and bookable consultation time slots. Patients will only be able to book within these configured hours.
            </p>

            <form onSubmit={handleAvailabilitySubmit} className="space-y-5">
              {/* Active Practice Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                    Active Practice Days ({availableDays.length}/7)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailableDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])}
                      className="text-2xs text-forest-800 hover:underline cursor-pointer"
                    >
                      Mon-Fri Only
                    </button>
                    <span className="text-charcoal-300">•</span>
                    <button
                      type="button"
                      onClick={() => setAvailableDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])}
                      className="text-2xs text-forest-800 hover:underline cursor-pointer"
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 text-xs rounded-md border flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-forest-800 text-ivory-50 border-forest-900 font-medium shadow-2xs'
                            : 'bg-ivory-100 text-charcoal-600 border-sand-300 hover:bg-ivory-200'
                        }`}
                      >
                        <span>{day}</span>
                        {isSelected && <Check size={13} className="shrink-0 text-sage-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultation Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                    Configured Time Slots ({availableTimeSlots.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAvailableTimeSlots([
                          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                          '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
                        ])
                      }
                      className="text-2xs text-forest-800 hover:underline cursor-pointer"
                    >
                      Standard 9-5
                    </button>
                    <span className="text-charcoal-300">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAvailableTimeSlots(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
                      }
                      className="text-2xs text-forest-800 hover:underline cursor-pointer"
                    >
                      Morning Only
                    </button>
                  </div>
                </div>

                {/* Slot Chips */}
                <div className="p-3 bg-ivory-100/70 border border-sand-300 rounded-md min-h-[70px] flex flex-wrap gap-1.5">
                  {availableTimeSlots.length === 0 ? (
                    <span className="text-xs text-charcoal-500 italic">No time slots configured. Add slots below.</span>
                  ) : (
                    availableTimeSlots.map((slot) => (
                      <span
                        key={slot}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sage-200 border border-sage-300 text-forest-900 rounded font-mono text-xs font-medium"
                      >
                        <span>{slot}</span>
                        <button
                          type="button"
                          onClick={() => toggleSlot(slot)}
                          className="hover:text-terracotta-700 transition cursor-pointer"
                          title="Remove slot"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Slot Input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="time"
                    value={newCustomSlot}
                    onChange={(e) => setNewCustomSlot(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                  />
                  <button
                    type="button"
                    onClick={addCustomSlot}
                    className="px-3 py-1.5 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded-md transition cursor-pointer"
                  >
                    Add Slot
                  </button>
                  <span className="text-2xs text-charcoal-500">
                    Quick-add common slots or specify custom clinical consultation times
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availabilitySaving}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {availabilitySaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving Schedule...</span>
                    </>
                  ) : (
                    'Save Schedule & Hours'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Consultation Modal */}
      {declineModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setDeclineModal({ isOpen: false, appointmentId: null, patientName: '', reason: '' })}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              Care Management
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Decline Consultation Request
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-4">
              Patient: <span className="font-semibold text-charcoal-900">{declineModal.patientName}</span>
            </p>

            <form onSubmit={handleDeclineSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Clinical / Scheduling Rationale (Optional)
                </label>
                <textarea
                  rows={3}
                  value={declineModal.reason}
                  onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                  placeholder="e.g. Schedule emergency procedure; please request an afternoon slot or choose an alternative practitioner."
                  className="w-full p-2.5 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineModal({ isOpen: false, appointmentId: null, patientName: '', reason: '' })}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === declineModal.appointmentId}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-terracotta-700 hover:bg-terracotta-800 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {actionLoading === declineModal.appointmentId ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Declining...</span>
                    </>
                  ) : (
                    'Confirm Decline'
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

export default DoctorDashboard;
