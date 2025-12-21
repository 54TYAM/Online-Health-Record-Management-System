import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Clock, LogOut, Users, MessageSquare, FileText } from 'lucide-react';
import { mockDoctorFeedback } from '../../data/mockData';

const DoctorDashboard = () => {
    const { logout, user } = useAuth();
    const [appointments, setAppointments] = useState([]);

    const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments/me');
            setAppointments(res.data);

            const total = res.data.length;
            const today = res.data.filter((a) => new Date(a.date).toDateString() === new Date().toDateString()).length;
            const pending = res.data.filter((a) => a.status === 'pending').length;
            setStats({ total, today, pending });

        } catch (e) {
            console.error(e);
        }
    };

    const [feedback, setFeedback] = useState([]);

    const fetchFeedback = async () => {
        try {
            const res = await api.get('/feedback/me');
            setFeedback(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchFeedback();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (e) {
            console.error(e);
        }
    };

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        } catch (e) { console.error(e); }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/auth/profile', profileData);
            setIsProfileOpen(false);
            // Optionally refresh user context name if needed, but page refresh works too
        } catch (e) {
            console.error(e);
            alert('Failed to update profile');
        }
    };

    // Record Modal State
    const [isRecordOpen, setIsRecordOpen] = useState(false);
    const [recordData, setRecordData] = useState({
        patientId: '',
        patientName: '',
        diagnosis: '',
        prescription: '',
        files: []
    });

    const openRecordModal = (patientId, patientName) => {
        setRecordData({ ...recordData, patientId, patientName, diagnosis: '', prescription: '' });
        setIsRecordOpen(true);
    };

    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/records', {
                patientId: recordData.patientId,
                diagnosis: recordData.diagnosis,
                prescription: recordData.prescription,
                files: [] // File upload not implemented yet
            });
            setIsRecordOpen(false);
            alert('Prescription added successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to add record');
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                <div className="relative">
                    <h1 className="text-4xl font-bold text-white mb-2">Doctor Portal</h1>
                    <p className="text-slate-400 text-lg">Welcome, <span className="text-blue-400 font-semibold">{user?.name}</span></p>
                </div>
                <div className="flex gap-3">
                    <button onClick={openProfile} className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium shadow-lg shadow-blue-500/20 flex gap-2 items-center">
                        <Users size={18} /> Edit Profile
                    </button>
                    <button onClick={logout} className="px-6 py-2.5 bg-slate-800 text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-xl transition font-medium border border-slate-700 flex gap-2 items-center">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Profile Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg relative">
                        <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Specialization</label>
                                    <input
                                        type="text"
                                        value={profileData.specialization}
                                        onChange={e => setProfileData({ ...profileData, specialization: e.target.value })}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Experience (Years)</label>
                                    <input
                                        type="number"
                                        value={profileData.experience}
                                        onChange={e => setProfileData({ ...profileData, experience: e.target.value })}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Consultation Fees ($)</label>
                                    <input
                                        type="number"
                                        value={profileData.fees}
                                        onChange={e => setProfileData({ ...profileData, fees: e.target.value })}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Hospital / Clinic</label>
                                    <input
                                        type="text"
                                        value={profileData.hospital}
                                        onChange={e => setProfileData({ ...profileData, hospital: e.target.value })}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition mt-4">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Modal */}
            {isRecordOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setIsRecordOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-2">Prescription</h2>
                        <p className="text-slate-400 mb-6">For Patient: <span className="text-emerald-400 font-semibold">{recordData.patientName}</span></p>

                        <form onSubmit={handleRecordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Diagnosis / Condition</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Viral Fever, Hypertension"
                                    value={recordData.diagnosis}
                                    onChange={e => setRecordData({ ...recordData, diagnosis: e.target.value })}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Prescription / Report Details</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="e.g. Paracetamol 500mg (2x daily), Rest for 3 days..."
                                    value={recordData.prescription}
                                    onChange={e => setRecordData({ ...recordData, prescription: e.target.value })}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition mt-4 shadow-lg shadow-emerald-500/20">
                                Save & Send to Patient
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 hover:border-slate-700 transition group">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Patients</p>
                    <div className="flex items-end justify-between">
                        <p className="text-4xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.total}</p>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Users size={24} /></div>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 hover:border-slate-700 transition group">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Today's Schedule</p>
                    <div className="flex items-end justify-between">
                        <p className="text-4xl font-bold text-white group-hover:text-emerald-400 transition-colors">{stats.today}</p>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><Clock size={24} /></div>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 hover:border-slate-700 transition group">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Pending Requests</p>
                    <div className="flex items-end justify-between">
                        <p className="text-4xl font-bold text-white group-hover:text-yellow-400 transition-colors">{stats.pending}</p>
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><Check size={24} /></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Appointment Requests - Main Column */}
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-white">Appointment Queue</h3>
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">{appointments.length} Total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                                    <th className="p-6 font-semibold">Patient Name</th>
                                    <th className="p-6 font-semibold">Scheduled Date</th>
                                    <th className="p-6 font-semibold">Status</th>
                                    <th className="p-6 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {appointments.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-slate-500">No appointments found.</td></tr>
                                ) : (
                                    appointments.map(apt => (
                                        <tr key={apt._id} className="hover:bg-slate-800/50 transition bg-slate-900">
                                            <td className="p-6 font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                                                        {apt.patientId?.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        {apt.patientId?.name || 'Unknown User'}
                                                        <span className="block text-xs text-slate-500 font-normal mt-0.5">{apt.patientId?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-slate-400">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-300">{new Date(apt.date).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-500">{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${apt.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        apt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {apt.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => updateStatus(apt._id, 'approved')}
                                                            className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition border border-emerald-500/20"
                                                            title="Approve"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(apt._id, 'cancelled')}
                                                            className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition border border-red-500/20"
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : apt.status === 'approved' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openRecordModal(apt.patientId._id, apt.patientId.name)}
                                                            className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition border border-emerald-500/20 text-xs font-bold uppercase tracking-wide flex items-center gap-1"
                                                        >
                                                            <FileText size={14} /> Add Rx
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(apt._id, 'completed')}
                                                            className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition border border-blue-500/20 text-xs font-bold uppercase tracking-wide flex items-center gap-1"
                                                        >
                                                            <Check size={14} /> Complete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback / Recent Activity Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <MessageSquare className="text-pink-500" size={24} /> Patient Feedback
                        </h3>
                        <div className="space-y-4">
                            {feedback.length === 0 ? (
                                <p className="text-slate-500 italic">No feedback received yet.</p>
                            ) : (
                                feedback.map(fb => (
                                    <div key={fb._id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-500 text-xs font-bold">
                                                    {fb.patientId?.name?.[0] || 'U'}
                                                </div>
                                                <span className="font-bold text-slate-200 text-sm">{fb.patientId?.name || 'Anonymous'}</span>
                                            </div>
                                            <span className="flex text-yellow-500 text-sm">
                                                {'★'.repeat(fb.rating)}
                                                <span className="text-slate-600">{'★'.repeat(5 - fb.rating)}</span>
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 italic">"{fb.comment}"</p>
                                        <p className="text-xs text-slate-600 mt-2 text-right">{new Date(fb.createdAt).toLocaleDateString()}</p>
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

export default DoctorDashboard;
