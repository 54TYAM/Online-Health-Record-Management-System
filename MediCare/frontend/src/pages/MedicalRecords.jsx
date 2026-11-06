import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Calendar,
  ArrowLeft,
  Download,
  MessageSquare,
  X,
  Star,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Printer,
  Building2,
  Stethoscope,
  RefreshCw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDoctorName } from '../utils/formatters';

const MedicalRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [paginationInfo, setPaginationInfo] = useState(null);

  // Filters & Search (Only supported by actual data)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | '30days' | '6months' | '1year'
  const [hasAttachmentsFilter, setHasAttachmentsFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) | 'asc'

  // Detailed Record Inspection Modal
  const [inspectedRecord, setInspectedRecord] = useState(null);

  // Feedback State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch authorized records chronologically from backend
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Using /records/me: backend directly binds identity to verified JWT token
      // Does not trust client-supplied ID for authorization
      const [recordsRes, appointmentsRes] = await Promise.all([
        api.get('/records/me', {
          params: {
            page: currentPage,
            limit: pageSize,
            sort: sortOrder,
            search: searchQuery.trim() || undefined,
            doctorId: selectedDoctorFilter !== 'all' ? selectedDoctorFilter : undefined,
          }
        }),
        api.get('/appointments/me')
      ]);

      const recData = recordsRes.data;
      if (recData && recData.records && recData.pagination) {
        setRecords(recData.records);
        setPaginationInfo(recData.pagination);
      } else if (Array.isArray(recData)) {
        setRecords(recData);
        setPaginationInfo({
          total: recData.length,
          page: 1,
          totalPages: 1,
          limit: recData.length,
          hasMore: false
        });
      } else {
        setRecords([]);
      }

      const appts = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      setAppointments(appts.filter((a) => a.status === 'approved' || a.status === 'completed'));
    } catch (err) {
      console.error('Failed to retrieve authorized medical records:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load longitudinal medical records. Please verify connectivity and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortOrder, searchQuery, selectedDoctorFilter]);

  useEffect(() => {
    if (user?._id) {
      fetchRecords();
    }
  }, [user, fetchRecords]);

  // Extract unique clinicians from records for filter dropdown
  const uniqueDoctors = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (r.doctorId?._id && !map.has(r.doctorId._id)) {
        map.set(r.doctorId._id, {
          id: r.doctorId._id,
          name: r.doctorId.name,
          specialization: r.doctorId.specialization
        });
      }
    });
    return Array.from(map.values());
  }, [records]);

  // Client-side timeframe & attachment filtering on current records
  const filteredTimelineRecords = useMemo(() => {
    return records.filter((rec) => {
      // Attachments filter
      if (hasAttachmentsFilter && (!rec.files || rec.files.length === 0)) {
        return false;
      }

      // Timeframe filter
      if (timeframeFilter !== 'all') {
        const recDate = new Date(rec.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - recDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeframeFilter === '30days' && diffDays > 30) return false;
        if (timeframeFilter === '6months' && diffDays > 182) return false;
        if (timeframeFilter === '1year' && diffDays > 365) return false;
      }

      return true;
    });
  }, [records, hasAttachmentsFilter, timeframeFilter]);

  // Feedback Actions
  const openFeedback = (doctor) => {
    setSelectedDoctor(doctor);
    setRating(5);
    setComment('');
    setFeedbackError('');
    setIsFeedbackOpen(true);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      setSubmittingFeedback(true);
      setFeedbackError('');
      await api.post('/feedback', {
        doctorId: selectedDoctor._id,
        rating,
        comment
      });
      setIsFeedbackOpen(false);
      setFeedbackSuccess('Feedback securely recorded in clinical EHR registry.');
      setTimeout(() => setFeedbackSuccess(''), 4000);
      setComment('');
      setRating(5);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const printRecord = () => {
    window.print();
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert */}
      {feedbackSuccess && (
        <div className="fixed top-5 right-5 bg-forest-800 text-ivory-50 px-5 py-3 rounded-md shadow-md z-50 flex items-center gap-3 border border-forest-900 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-sage-400 shrink-0" />
          <span className="text-sm font-medium">{feedbackSuccess}</span>
        </div>
      )}

      {/* Header & Back Navigation */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest-800 hover:text-forest-900 transition mb-3 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Patient Overview
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-sand-300">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-forest-800 uppercase tracking-wider mb-1">
              <ShieldCheck size={14} className="text-forest-700" /> Longitudinal Patient Health Record
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-charcoal-900 font-normal">
              Medical History Timeline
            </h1>
            <p className="text-charcoal-600 text-sm mt-1">
              Authorized diagnostic summaries, clinical regimens, and verified physician prescriptions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              title="Refresh timeline records"
              className="p-2 text-charcoal-600 bg-ivory-50 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="text-xs text-charcoal-500 font-mono bg-ivory-50 border border-sand-300 px-3 py-2 rounded-md">
              Total Recorded: <span className="font-semibold text-charcoal-900">{paginationInfo?.total ?? records.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <section className="bg-ivory-50 border border-sand-300 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by diagnosis, clinical formulation, or medication..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-2.5 text-xs text-charcoal-400 hover:text-charcoal-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Clinician Dropdown */}
          <select
            value={selectedDoctorFilter}
            onChange={(e) => {
              setSelectedDoctorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
          >
            <option value="all">All Attending Clinicians</option>
            {uniqueDoctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {formatDoctorName(doc.name)} ({doc.specialization})
              </option>
            ))}
          </select>

          {/* Timeframe Dropdown */}
          <select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="30days">Past 30 Days</option>
            <option value="6months">Past 6 Months</option>
            <option value="1year">Past Year</option>
          </select>

          {/* Chronological Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-800 hover:bg-ivory-200 transition font-medium cursor-pointer shrink-0 flex items-center gap-1.5"
            title="Toggle chronological sorting"
          >
            <SlidersHorizontal size={13} />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasAttachmentsFilter(!hasAttachmentsFilter)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs transition cursor-pointer border ${
                hasAttachmentsFilter
                  ? 'bg-forest-800 text-ivory-50 border-forest-900 font-medium'
                  : 'bg-ivory-100 text-charcoal-700 border-sand-300 hover:bg-ivory-200'
              }`}
            >
              <Paperclip size={12} />
              <span>Has Clinical Attachments</span>
            </button>
          </div>

          {(searchQuery || selectedDoctorFilter !== 'all' || timeframeFilter !== 'all' || hasAttachmentsFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDoctorFilter('all');
                setTimeframeFilter('all');
                setHasAttachmentsFilter(false);
                setSortOrder('desc');
                setCurrentPage(1);
              }}
              className="text-2xs text-forest-800 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </section>

      {/* Main Timeline Section */}
      <section className="space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-5 bg-terracotta-50 border border-terracotta-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-terracotta-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-terracotta-900">
                  Failed to Load Medical Timeline
                </h3>
                <p className="text-xs text-terracotta-800 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchRecords}
              className="px-3.5 py-1.5 bg-terracotta-800 hover:bg-terracotta-900 text-ivory-50 text-xs font-medium rounded transition shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Retry Loading
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center text-charcoal-600 bg-ivory-50 border border-sand-300 rounded-lg">
            <div className="inline-flex items-center gap-3 p-4 bg-ivory-100 border border-sand-300 rounded-md shadow-2xs">
              <Loader2 className="animate-spin text-forest-700" size={20} />
              <span className="text-xs font-medium">Verifying authorization & loading longitudinal history...</span>
            </div>
          </div>
        ) : filteredTimelineRecords.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-ivory-50 border border-dashed border-sand-300 rounded-lg p-8">
            <FileText className="mx-auto h-12 w-12 text-charcoal-400 mb-3" />
            <h3 className="text-lg font-serif text-charcoal-900 font-normal">
              {searchQuery || selectedDoctorFilter !== 'all' || timeframeFilter !== 'all' || hasAttachmentsFilter
                ? 'No matching clinical records found'
                : 'No medical history on record'}
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedDoctorFilter !== 'all' || timeframeFilter !== 'all' || hasAttachmentsFilter
                ? 'No chronological entries match your active filters. Try clearing your search parameters.'
                : 'Medical formulations and prescriptions authored by your attending physicians during approved consultations will be chronologically documented here.'}
            </p>
            {(searchQuery || selectedDoctorFilter !== 'all' || timeframeFilter !== 'all' || hasAttachmentsFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDoctorFilter('all');
                  setTimeframeFilter('all');
                  setHasAttachmentsFilter(false);
                  setCurrentPage(1);
                }}
                className="mt-4 px-3.5 py-1.5 bg-forest-800 text-ivory-50 text-xs font-medium rounded-md hover:bg-forest-900 transition cursor-pointer"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          /* Chronological Timeline */
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-sand-300">
            {filteredTimelineRecords.map((record) => {
              const recordDate = new Date(record.createdAt);
              const formattedDate = recordDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
              const formattedTime = recordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const doctorName = record.doctorId?.name || 'Physician On Duty';
              const doctorSpec = record.doctorId?.specialization || 'Clinical Specialist';
              const doctorHospital = record.doctorId?.hospital || 'Affiliated Medical Center';

              return (
                <div key={record._id} className="relative group">
                  {/* Timeline Milestone Marker */}
                  <div className="absolute -left-6 sm:-left-8 top-5 w-5 h-5 rounded-full bg-ivory-100 border-2 border-forest-800 flex items-center justify-center transition group-hover:scale-110">
                    <div className="w-2 h-2 rounded-full bg-forest-800" />
                  </div>

                  {/* Record Entry Card */}
                  <article className="bg-ivory-50 border border-sand-300 rounded-lg p-5 sm:p-6 hover:border-sand-400 transition shadow-2xs">
                    {/* Header Row: Date & Reference */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-sand-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-forest-800 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded">
                            Consultation Entry
                          </span>
                          <span className="text-2xs font-mono text-charcoal-500">
                            ID: REC-{record._id?.slice(-8)?.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl text-charcoal-900 font-normal">
                          {record.diagnosis}
                        </h3>
                      </div>

                      <div className="sm:text-right text-xs text-charcoal-600 font-mono">
                        <div className="font-semibold text-charcoal-900 flex items-center sm:justify-end gap-1.5">
                          <Calendar size={13} className="text-forest-700" />
                          {formattedDate}
                        </div>
                        <div className="text-2xs text-charcoal-500 mt-0.5">
                          Time: {formattedTime}
                        </div>
                      </div>
                    </div>

                    {/* Attending Clinician Badge */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-charcoal-700 bg-ivory-100/70 p-2.5 rounded-md border border-sand-200">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-forest-700 shrink-0" />
                        <span className="font-semibold text-charcoal-900">{formatDoctorName(doctorName)}</span>
                        <span className="text-charcoal-500">•</span>
                        <span>{doctorSpec}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-charcoal-500">
                        <Building2 size={13} className="shrink-0" />
                        <span>{doctorHospital}</span>
                      </div>
                    </div>

                    {/* Prescription Regimen Box */}
                    <div className="mt-4 bg-ivory-100 border border-sand-300 rounded-md p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-2xs font-semibold uppercase tracking-wider text-charcoal-600">
                          Prescribed Regimen & Medication
                        </h4>
                        <span className="text-2xs font-mono text-forest-800 bg-sage-200/60 px-2 py-0.5 rounded border border-sage-300">
                          Active Protocol
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {record.prescription || 'No specific medication instructions entered.'}
                      </p>
                    </div>

                    {/* Attachments & Action Footer */}
                    <div className="mt-4 pt-3.5 border-t border-sand-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {record.files && record.files.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xs font-medium text-charcoal-600 flex items-center gap-1">
                              <Paperclip size={12} className="text-forest-700" />
                              {record.files.length} Attachment{record.files.length === 1 ? '' : 's'}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {record.files.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-ivory-100 hover:bg-sand-200 text-charcoal-800 border border-sand-300 rounded text-2xs transition"
                                >
                                  <Download size={11} /> Doc #{idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xs text-charcoal-400 italic">No attachments filed</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectedRecord(record)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded transition shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Detailed Record View</span>
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <div className="pt-4 border-t border-sand-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal-600">
            <span>
              Showing Page {paginationInfo.page} of {paginationInfo.totalPages} ({paginationInfo.total} total chronological entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-sand-300 bg-ivory-50 hover:bg-ivory-200 text-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="font-mono text-2xs px-2">
                {currentPage} / {paginationInfo.totalPages}
              </span>
              <button
                disabled={currentPage >= paginationInfo.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-sand-300 bg-ivory-50 hover:bg-ivory-200 text-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Attended Visits & Care Evaluations Section */}
      <section className="pt-8 border-t border-sand-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-serif text-charcoal-900 font-normal flex items-center gap-2">
              <Calendar size={20} className="text-forest-700" /> Attended Visits & Clinician Evaluations
            </h2>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Completed and approved clinical consultations eligible for care quality reflections
            </p>
          </div>
          <span className="text-xs text-charcoal-500 font-mono">
            {appointments.length} historical visits
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-8 bg-ivory-50 border border-sand-300 rounded-lg text-xs text-charcoal-500">
            No completed or approved clinical visits recorded.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {appointments.map((appt) => {
              const docName = appt.doctorId?.userId?.name || 'Physician';
              const spec = appt.doctorId?.specialization || 'General Practice';
              const hospital = appt.doctorId?.hospital || 'Affiliated Clinical Center';

              return (
                <div
                  key={appt._id}
                  className="bg-ivory-50 border border-sand-300 rounded-lg p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-base text-charcoal-900 font-normal">
                        {formatDoctorName(docName)}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider ${
                          appt.status === 'completed'
                            ? 'bg-sand-200 text-charcoal-800 border border-sand-300'
                            : 'bg-sage-200 text-forest-900 border border-sage-300'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 mb-1">{spec}</p>
                    <p className="text-xs text-charcoal-500 flex items-center gap-1.5 mb-4">
                      <span>🏥</span> {hospital}
                    </p>
                  </div>

                  <div className="text-xs text-charcoal-500 border-t border-sand-200 pt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} className="text-forest-700" />
                      {new Date(appt.date).toLocaleDateString()}
                    </span>
                    {appt.status === 'completed' && (
                      <button
                        onClick={() => openFeedback(appt.doctorId)}
                        className="text-forest-800 hover:text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare size={13} /> Submit Feedback
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detailed Record Inspection Modal */}
      {inspectedRecord && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setInspectedRecord(null)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close detailed view"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="pb-4 border-b border-sand-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-forest-800 bg-sage-200/80 px-2 py-0.5 rounded border border-sage-300">
                  Detailed Medical Record Inspection
                </span>
                <span className="text-2xs font-mono text-charcoal-500">
                  REC-{inspectedRecord._id?.slice(-8)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-charcoal-900 font-normal mt-1">
                {inspectedRecord.diagnosis}
              </h2>
              <div className="flex items-center gap-3 text-xs text-charcoal-600 mt-2 font-mono">
                <span>Date: {new Date(inspectedRecord.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>•</span>
                <span>Time: {new Date(inspectedRecord.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Clinician Attribution Card */}
            <div className="mt-5 bg-ivory-100 border border-sand-300 rounded-md p-4">
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-charcoal-500 mb-2">
                Attending Practitioner Details
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-sage-200 border border-sage-300 text-forest-900 font-semibold flex items-center justify-center text-sm shrink-0">
                  {(inspectedRecord.doctorId?.name?.[0] || 'D').toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-900">
                    {formatDoctorName(inspectedRecord.doctorId?.name || 'Practitioner On File')}
                  </h4>
                  <p className="text-xs text-charcoal-600">
                    {inspectedRecord.doctorId?.specialization || 'Clinical Specialist'} • {inspectedRecord.doctorId?.hospital || 'Hospital Practice'}
                  </p>
                  {inspectedRecord.doctorId?.email && (
                    <p className="text-2xs font-mono text-charcoal-500 mt-0.5">
                      Contact: {inspectedRecord.doctorId.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnostic Formulation */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                Diagnostic Formulation & Assessment
              </h3>
              <div className="p-4 bg-ivory-100/70 border border-sand-300 rounded-md text-xs text-charcoal-900 leading-relaxed font-sans">
                {inspectedRecord.diagnosis}
              </div>
            </div>

            {/* Prescription & Treatment Regimen */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 flex items-center justify-between">
                <span>Prescription & Therapeutic Regimen</span>
                <span className="text-2xs font-mono text-forest-800 bg-sage-100 px-2 py-0.5 rounded border border-sage-200">Verified Protocol</span>
              </h3>
              <div className="p-4 bg-ivory-100 border border-sand-300 rounded-md text-xs text-charcoal-900 leading-relaxed font-sans whitespace-pre-wrap">
                {inspectedRecord.prescription || 'No specific medication regimen authored.'}
              </div>
            </div>

            {/* Attachments Section */}
            {inspectedRecord.files && inspectedRecord.files.length > 0 && (
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                  Verified Attachments ({inspectedRecord.files.length})
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {inspectedRecord.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-ivory-100 border border-sand-300 hover:bg-sand-200 rounded-md text-xs text-charcoal-900 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip size={14} className="text-forest-700 shrink-0" />
                        <span className="truncate">Clinical Attachment #{idx + 1}</span>
                      </div>
                      <Download size={14} className="text-charcoal-500 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Confidentiality Notice */}
            <div className="mt-6 p-3 bg-ivory-100 border border-sand-200 rounded text-2xs text-charcoal-600 flex items-center gap-2">
              <ShieldCheck size={14} className="text-forest-700 shrink-0" />
              <span>
                Confidential health record accessible only to verified patient #{user?._id?.slice(-8)?.toUpperCase()} and attending clinical staff.
              </span>
            </div>

            {/* Actions Bar */}
            <div className="mt-6 pt-4 border-t border-sand-300 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={printRecord}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-sand-300 rounded text-xs transition cursor-pointer"
              >
                <Printer size={13} /> Print Record Summary
              </button>

              <div className="flex items-center gap-2">
                {inspectedRecord.doctorId?._id && (
                  <button
                    type="button"
                    onClick={() => {
                      const doc = inspectedRecord.doctorId;
                      setInspectedRecord(null);
                      openFeedback({
                        _id: doc._id,
                        userId: { name: doc.name }
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage-200 hover:bg-sage-300 text-forest-900 border border-sage-300 text-xs font-medium rounded transition cursor-pointer"
                  >
                    <MessageSquare size={13} /> Submit Feedback
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectedRecord(null)}
                  className="px-4 py-1.5 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded transition shadow-2xs cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Care Quality Feedback
            </span>
            <h3 className="text-xl font-serif text-charcoal-900 font-normal mt-0.5">
              Reflect on Consultation
            </h3>
            <p className="text-xs text-charcoal-600 mt-1 mb-4">
              Your feedback on {formatDoctorName(selectedDoctor?.userId?.name || selectedDoctor?.name || 'Practitioner')} helps improve clinical protocols.
            </p>

            {feedbackError && (
              <div className="mb-3 p-2.5 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded">
                {feedbackError}
              </div>
            )}

            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1.5">
                  Rating (1 to 5 stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-charcoal-400 hover:text-amber-500 transition cursor-pointer"
                      aria-label={`Select ${s} stars`}
                    >
                      <Star
                        size={22}
                        fill={rating >= s ? 'currentColor' : 'none'}
                        className={rating >= s ? 'text-amber-500' : 'text-sand-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-charcoal-500 self-center ml-2">
                    {rating} of 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Comments & Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700 resize-none min-h-[110px]"
                  placeholder="Share details regarding consultation timeliness, clarity of diagnosis, and treatment guidance..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="flex-1 py-2 text-xs font-medium text-ivory-50 bg-forest-800 hover:bg-forest-900 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Recording...</span>
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
    </div>
  );
};

export default MedicalRecords;
