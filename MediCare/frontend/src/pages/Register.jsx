import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, User, Stethoscope, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('patient');

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-charcoal-800">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-600 hover:text-forest-800 transition"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-forest-800 text-ivory-100 flex items-center justify-center font-serif text-xs font-bold">
            M
          </span>
          <span className="font-serif font-semibold text-forest-900 text-sm">MediCare</span>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white p-8 sm:p-10 rounded-xl border border-sand-300 shadow-card">
          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage-200 text-forest-800 mb-3">
              <User size={20} />
            </span>
            <h1 className="font-serif font-editorial text-2xl sm:text-3xl font-semibold text-forest-900 tracking-tight">
              Create Patient Account
            </h1>
            <p className="text-xs text-charcoal-600 mt-1">
              Connect to your healthcare providers and medical history
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-terracotta-50 border border-terracotta-200 text-terracotta-800 rounded-md text-xs leading-relaxed" role="alert">
              <span className="font-semibold block mb-0.5">Registration Error</span>
              {error}
            </div>
          )}

          {/* Role Choice Selector */}
          <div className="flex p-1 bg-ivory-100 rounded-lg mb-6 border border-sand-200" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'patient'}
              onClick={() => setActiveTab('patient')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition ${
                activeTab === 'patient' 
                  ? 'bg-forest-800 text-ivory-100 shadow-subtle' 
                  : 'text-charcoal-600 hover:text-forest-900 hover:bg-sand-100'
              }`}
            >
              <User size={14} />
              Patient Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'doctor'}
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition ${
                activeTab === 'doctor' 
                  ? 'bg-forest-800 text-ivory-100 shadow-subtle' 
                  : 'text-charcoal-600 hover:text-forest-900 hover:bg-sand-100'
              }`}
            >
              <Stethoscope size={14} />
              Physician Info
            </button>
          </div>

          {activeTab === 'doctor' ? (
            <div className="p-5 bg-ivory-50 rounded-lg border border-sand-200 text-center space-y-4">
              <div className="w-10 h-10 bg-sage-200 text-forest-800 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-serif text-base font-semibold text-charcoal-900">
                Institutional Physician Verification
              </h3>
              <p className="text-charcoal-600 text-xs leading-relaxed">
                To guarantee record integrity and regulatory licensing, physician accounts cannot be created via public registration.
              </p>
              <p className="text-charcoal-600 text-xs">
                Physicians are onboarded directly by clinic administrators. If you already have credentials:
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 bg-forest-800 text-ivory-100 rounded-md font-medium text-xs hover:bg-forest-700 transition"
              >
                Sign In to Physician Portal
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400"
                  placeholder="Eleanor Vance"
                />
                {errors.name && <p className="mt-1 text-xs text-terracotta-700">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400"
                  placeholder="eleanor@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-terracotta-700">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400"
                  placeholder="Minimum 6 characters"
                />
                {errors.password && <p className="mt-1 text-xs text-terracotta-700">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400"
                  placeholder="Repeat your password"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-terracotta-700">{errors.confirmPassword.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-forest-800 text-ivory-100 py-3 rounded-md font-medium text-sm hover:bg-forest-700 transition duration-150 shadow-subtle flex justify-center items-center disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Registering...
                    </span>
                  ) : (
                    'Register Account'
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 pt-2 text-[11px] text-charcoal-500">
                <CheckCircle2 size={13} className="text-forest-700 mt-0.5 shrink-0" />
                <span>By registering, you confirm that your health entries are private to you and designated practitioners.</span>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-sand-200 text-center">
            <p className="text-xs text-charcoal-600">
              Already have an account?{' '}
              <Link to="/login" className="text-forest-800 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-charcoal-500">
        MediCare Health System • Patient Record Portal
      </div>
    </div>
  );
};

export default Register;
