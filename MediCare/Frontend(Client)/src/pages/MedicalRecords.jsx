import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Calendar, User, ArrowLeft, Download, MessageSquare, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const MedicalRecords = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);

    // Feedback State
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recordsRes, appointmentsRes] = await Promise.all([
                    api.get(`/records/${user?._id}`),
                    api.get('/appointments/me')
                ]);
                setRecords(recordsRes.data);
                setAppointments(appointmentsRes.data.filter(a => a.status === 'approved' || a.status === 'completed'));
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const openFeedback = (doctor) => {
        setSelectedDoctor(doctor);
        setIsFeedbackOpen(true);
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return;
        try {
            await api.post('/feedback', {
                doctorId: selectedDoctor._id,
                rating,
                comment
            });
            setIsFeedbackOpen(false);
            alert('Feedback submitted successfully!');
            setComment('');
            setRating(5);
        } catch (e) {
            console.error(e);
            alert('Failed to submit feedback');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading records...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
            <div className="mb-8">
                <Link to="/dashboard" className="text-blue-400 flex items-center gap-2 mb-4 hover:underline">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Medical Records</h1>
                        <p className="text-slate-400">History of diagnoses and prescriptions</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {records.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
                        <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No medical records found</h3>
                        <p className="text-slate-500">Records added by your doctor will appear here.</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <div key={record._id} className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 transition hover:border-slate-700">
                             <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{record.diagnosis}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <User size={16} /> Dr. {record.doctorId?.name || 'Unknown'} ({record.doctorId?.specialization || 'Specialist'})
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={16} /> {new Date(record.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl mb-4 border border-slate-800">
                                <h4 className="font-semibold text-slate-300 mb-2">Prescription</h4>
                                <p className="text-slate-400 whitespace-pre-wrap">{record.prescription}</p>
                            </div>

                            {record.files && record.files.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-300 mb-2 text-sm uppercase tracking-wide">Attachments</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {record.files.map((file, index) => (
                                            <a key={index} href={file} target="_blank" rel="noopener noreferrer" 
                                               className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-700 transition text-slate-300">
                                                <Download size={16} /> Attachment {index + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Visit History Section */}
            <div className="py-8 border-t border-slate-800 mt-12">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                    <Calendar className="text-purple-400" /> Visit History & Approvals
                </h2>
                {appointments.length === 0 ? (
                    <p className="text-slate-500">No approved visits found.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {appointments.map(appt => (
                            <div key={appt._id} className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-lg">{appt.doctorId?.userId?.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            appt.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                                        }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-1">{appt.doctorId?.specialization}</p>
                                    <p className="text-slate-300 font-medium flex items-center gap-2 mb-4">
                                        <span className="text-purple-400">🏥</span> {appt.doctorId?.hospital || 'Medicare General Hospital'}
                                    </p>
                                </div>
                                <div className="text-sm text-slate-500 border-t border-slate-800 pt-3 flex items-center justify-between">
                                     <span>{new Date(appt.date).toLocaleDateString()}</span>
                                     {appt.status === 'completed' && (
                                        <button onClick={() => openFeedback(appt.doctorId)} className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1">
                                            <MessageSquare size={12} /> FEEDBACK
                                        </button>
                                     )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            {isFeedbackOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                     <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md relative">
                        <button onClick={() => setIsFeedbackOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-2">Reflect on your Visit</h2>
                        <p className="text-slate-400 mb-6">How was your experience with Dr. {selectedDoctor?.userId?.name}?</p>
                        
                        <form onSubmit={submitFeedback} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button 
                                            key={s} 
                                            type="button" 
                                            onClick={() => setRating(s)}
                                            className={`p-2 rounded-lg transition ${rating >= s ? 'text-yellow-400 scale-110' : 'text-slate-600'}`}
                                        >
                                            <Star fill={rating >= s ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Comments</label>
                                <textarea 
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    placeholder="Write your review here..."
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                                Submit Feedback
                            </button>
                        </form>
                     </div>
                </div>
            )}
        </div>
    );
};

export default MedicalRecords;
