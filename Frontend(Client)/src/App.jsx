import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import MedicalRecords from './pages/MedicalRecords';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

const Layout = ({ children }) => (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans w-full">
        <nav className="bg-slate-900 shadow-md border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
                             MediCare
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Placeholder for future nav items or user profile */}
                    </div>
                </div>
            </div>
        </nav>
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['patient']}>
                <Layout><PatientDashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/records" element={
            <ProtectedRoute allowedRoles={['patient']}>
                <Layout><MedicalRecords /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
                <Layout><DoctorDashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
