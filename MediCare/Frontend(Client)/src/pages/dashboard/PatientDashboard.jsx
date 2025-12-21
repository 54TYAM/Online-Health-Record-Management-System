import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Loader2, Plus, FileText, Search, Activity, MessageSquare, HeartPulse, Bone, Sparkles, Brain, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';

const appointmentSchema = z.object({
    doctorId: z.string().min(1, 'Please select a doctor'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
});

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [records, setRecords] = useState([]);
    const [bookingError, setBookingError] = useState('');

    // Feedback State
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, doctorId: null, doctorName: '', rating: 5, comment: '' });
    const [feedbackSuccess, setFeedbackSuccess] = useState('');
    const [myFeedback, setMyFeedback] = useState([]);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(appointmentSchema),
    });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments/me');
            setAppointments(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/auth/doctors');
            setDoctors(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRecords = async () => {
        try {
            if (user?._id) {
                const res = await api.get(`/records/${user._id}`);
                setRecords(res.data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchMyFeedback = async () => {
        try {
            const res = await api.get('/feedback/me');
            setMyFeedback(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
        fetchMyFeedback();
        if (user?._id) fetchRecords();
    }, [user]);

    const onBook = async (data) => {
        try {
            setBookingError('');
            const combinedDate = `${data.date}T${data.time}:00`;

            await api.post('/appointments', {
                doctorId: data.doctorId,
                date: combinedDate,
                time: data.time
            });
            fetchAppointments();
            reset();
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Booking failed');
        }
    };

    // Feedback Handler
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/feedback', {
                doctorId: feedbackModal.doctorId,
                rating: feedbackModal.rating,
                comment: feedbackModal.comment
            });
            setFeedbackSuccess('Feedback submitted successfully!');
            setFeedbackModal({ ...feedbackModal, isOpen: false, rating: 5, comment: '' });
            setTimeout(() => setFeedbackSuccess(''), 3000);
            fetchMyFeedback(); // Refresh the list
            fetchMyFeedback(); // Refresh the list
        } catch (e) {
            console.error(e);
            alert('Failed to submit feedback');
        }
    };

    const openFeedbackModal = (doctorId = null, doctorName = '') => {
        setFeedbackModal({ isOpen: true, doctorId, doctorName, rating: 5, comment: '' });
    };

    // Filter Logic
    const [selectedCategory, setSelectedCategory] = useState('');
    const categories = [
        { name: 'Cardiologist', icon: <HeartPulse className="text-red-500" size={20} />, label: 'Heart' },
        { name: 'Orthopedic', icon: <Bone className="text-slate-400" size={20} />, label: 'Bones' },
        { name: 'Dermatologist', icon: <Sparkles className="text-amber-400" size={20} />, label: 'Skin' },
        { name: 'Neurologist', icon: <Brain className="text-pink-500" size={20} />, label: 'Brain' },
        { name: 'Pediatrician', icon: <Baby className="text-blue-400" size={20} />, label: 'Child' },
    ];

    const filteredDoctors = selectedCategory
        ? doctors.filter(d => d.specialization === selectedCategory)
        : doctors;

    return (
        <div className="space-y-8 relative">
            {/* Feedback Success Toast */}
            {feedbackSuccess && (
                <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce">
                    {feedbackSuccess}
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-white mb-2">Rate Your Experience</h3>
                        <p className="text-slate-400 mb-6">
                            {feedbackModal.doctorName ? (
                                <>How was your appointment with <span className="text-blue-400 font-semibold">{feedbackModal.doctorName}</span>?</>
                            ) : (
                                "Select a doctor to review:"
                            )}
                        </p>

                        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                            {!feedbackModal.doctorName && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Doctor</label>
                                    <select
                                        required
                                        value={feedbackModal.doctorId || ''}
                                        onChange={e => setFeedbackModal({ ...feedbackModal, doctorId: e.target.value })}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Choose a doctor...</option>
                                        {doctors.map(d => (
                                            <option key={d._id} value={d._id}>{d.userId?.name || d.name} ({d.specialization})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFeedbackModal({ ...feedbackModal, rating: star })}
                                            className={`text-2xl transition hover:scale-110 ${star <= feedbackModal.rating ? 'text-yellow-400' : 'text-slate-700'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Comments</label>
                                <textarea
                                    value={feedbackModal.comment}
                                    onChange={e => setFeedbackModal({ ...feedbackModal, comment: e.target.value })}
                                    required
                                    rows={4}
                                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder-slate-600"
                                    placeholder="Share your experience..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
                                >
                                    Submit Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative">
                    <h1 className="text-4xl font-bold text-white mb-2">My Health Hub</h1>
                    <p className="text-slate-400 text-lg">Good Morning, <span className="text-blue-400 font-semibold">{user?.name}</span></p>
                </div>
                <button onClick={logout} className="relative px-6 py-2.5 bg-slate-800 text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-xl transition font-medium border border-slate-700">
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar / Stats */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                <Activity size={24} className="text-blue-100" />
                            </div>
                            <div>
                                <h3 className="text-blue-100 font-medium text-sm text-uppercase tracking-wider">Total Visits</h3>
                                <p className="text-3xl font-bold">{appointments.length}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-blue-900/30 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-200/50 w-3/4"></div>
                        </div>
                        <p className="text-sm text-blue-200 mt-2">+2 from last month</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800">
                        <h3 className="text-slate-100 font-bold mb-4 text-lg">Quick Actions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-blue-400 font-medium transition flex items-center gap-3 border border-slate-700 group"
                            >
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Search size={18} />
                                </div>
                                Find a Specialist
                            </button>
                            <Link to="/records" className="block w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-emerald-400 font-medium transition flex items-center gap-3 border border-slate-700 group">
                                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <FileText size={18} />
                                </div>
                                View Medical Records
                            </Link>
                        </div>
                    </div>

                    {/* My Reviews Section */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800">
                        <h3 className="text-slate-100 font-bold mb-4 text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2"><MessageSquare size={20} className="text-pink-500" /> My Reviews</span>
                            <button
                                onClick={() => openFeedbackModal()}
                                className="text-xs bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition font-bold"
                            >
                                Write Review
                            </button>
                        </h3>
                        <div className="space-y-4">
                            {myFeedback.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-slate-500 text-sm mb-1">No reviews submitted yet.</p>
                                    <p className="text-slate-600 text-xs">Feedback helps others find the best care.</p>
                                </div>
                            ) : (
                                myFeedback.slice(0, 3).map(fb => (
                                    <div key={fb._id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-200 text-sm">To: {fb.doctorId?.userId?.name || 'Doctor'}</h4>
                                            <span className="text-xs text-slate-500 font-mono">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex text-yellow-500 text-xs mb-1">
                                            {'★'.repeat(fb.rating)}
                                            <span className="text-slate-600">{'★'.repeat(5 - fb.rating)}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 italic line-clamp-2">"{fb.comment}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Medical Records Preview */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800">
                        <h3 className="text-slate-100 font-bold mb-4 text-lg flex items-center gap-2">
                            <FileText size={20} className="text-emerald-500" /> Recent Records
                        </h3>
                        <div className="space-y-4">
                            {records.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-slate-500 text-sm mb-1">No medical records found.</p>
                                    <p className="text-slate-600 text-xs">Records are created by your doctor after a consultation.</p>
                                </div>
                            ) : (
                                records.slice(0, 3).map(record => (
                                    <div key={record._id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-200">{record.diagnosis}</h4>
                                            <span className="text-xs text-slate-500 font-mono">{new Date(record.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">Dr. {record.doctorId?.name || 'Unknown'}</p>
                                        <div className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded w-fit">
                                            Rx: {record.prescription}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link to="/records" className="block text-center text-sm text-slate-500 hover:text-white mt-4 transition">View all records →</Link>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Booking Form */}
                    <div id="booking-form" className="bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Plus className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Book Appointment</h3>
                                <p className="text-slate-500">Schedule a visit with our top specialists</p>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Filter by Condition</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('')}
                                    className={`px-5 py-2.5 rounded-2xl whitespace-nowrap transition font-medium text-sm ${!selectedCategory ? 'bg-white text-slate-900 ring-2 ring-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
                                >
                                    All Doctors
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.name}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`px-5 py-2.5 rounded-2xl whitespace-nowrap transition font-medium text-sm flex items-center gap-2 ${selectedCategory === cat.name ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700 hover:text-white'}`}
                                    >
                                        <span>{cat.icon}</span> {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {bookingError && <p className="text-red-400 text-sm mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{bookingError}</p>}

                        <form onSubmit={handleSubmit(onBook)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Select Specialist</label>
                                <select {...register('doctorId')} className="w-full p-4 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none cursor-pointer">
                                    <option value="" className="bg-slate-900">{selectedCategory ? `Select a ${selectedCategory}` : 'Choose a doctor...'}</option>
                                    {filteredDoctors.map(d => (
                                        <option key={d._id} value={d._id} className="bg-slate-900">{d.userId?.name || d.name} ({d.specialization}) — ${d.fees}</option>
                                    ))}
                                </select>
                                {errors.doctorId && <p className="text-red-500 text-xs mt-1.5">{errors.doctorId.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Date</label>
                                <input type="date" {...register('date')} className="w-full p-4 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition [color-scheme:dark]" />
                                {errors.date && <p className="text-red-500 text-xs mt-1.5">{errors.date.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Time</label>
                                <input type="time" {...register('time')} className="w-full p-4 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition [color-scheme:dark]" />
                                {errors.time && <p className="text-red-500 text-xs mt-1.5">{errors.time.message}</p>}
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Access List */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Calendar className="text-purple-400" size={28} /> My Appointments
                        </h3>
                        <div className="grid gap-4">
                            {appointments.length === 0 ? (
                                <div className="text-center py-16 bg-slate-900 rounded-3xl border border-dashed border-slate-800">
                                    <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
                                    <p className="text-slate-500 text-lg">No upcoming appointments.</p>
                                    <button onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })} className="text-blue-400 hover:text-blue-300 mt-2 font-medium">Book your first one now</button>
                                </div>
                            ) : (
                                appointments.map(apt => (
                                    <div key={apt._id} className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-slate-700 transition-all">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                                {(apt.doctorId?.userId?.name?.[0] || 'D').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{apt.doctorId?.userId?.name || 'Unknown Doctor'}</p>
                                                <p className="text-sm text-slate-400 font-medium">{apt.doctorId?.specialization || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-300 flex items-center gap-2 justify-end">
                                                    <Clock size={16} className="text-indigo-400" /> {new Date(apt.date).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-slate-500 font-mono mt-1">{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${apt.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    apt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                                {/* Leave Feedback Button for Completed/Approved Appointments */}
                                                {(apt.status === 'completed' || apt.status === 'approved') && (
                                                    <button
                                                        onClick={() => openFeedbackModal(apt.doctorId?._id, apt.doctorId?.userId?.name)}
                                                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                                                    >
                                                        Leave Feedback
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
