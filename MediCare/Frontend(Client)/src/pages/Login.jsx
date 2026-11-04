import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = await api.post('/auth/login', data);
      login(response.data);
      if (response.data.role === 'admin') navigate('/admin');
      else if (response.data.role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-charcoal-800">
      {/* Top Bar */}
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

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white p-8 sm:p-10 rounded-xl border border-sand-300 shadow-card">
          <div className="text-center mb-8">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage-200 text-forest-800 mb-3">
              <ShieldCheck size={20} />
            </span>
            <h1 className="font-serif font-editorial text-2xl sm:text-3xl font-semibold text-forest-900 tracking-tight">
              Sign In to MediCare
            </h1>
            <p className="text-xs text-charcoal-600 mt-1">
              Access your medical records or clinical dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-terracotta-50 border border-terracotta-200 text-terracotta-800 rounded-md text-xs leading-relaxed" role="alert">
              <span className="font-semibold block mb-0.5">Notice</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400"
                placeholder="name@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-terracotta-700">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-ivory-50 border border-sand-300 rounded-md text-charcoal-900 text-sm focus:bg-white focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition placeholder-charcoal-400 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 text-charcoal-500 hover:text-charcoal-800 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-terracotta-700">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-forest-800 text-ivory-100 py-3 rounded-md font-medium text-sm hover:bg-forest-700 transition duration-150 shadow-subtle flex justify-center items-center disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Verifying...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-sand-200 text-center space-y-3">
            <p className="text-xs text-charcoal-600">
              New patient?{' '}
              <Link to="/register" className="text-forest-800 font-semibold hover:underline">
                Register for patient access
              </Link>
            </p>
            <p className="text-[11px] text-charcoal-500 leading-normal">
              Physicians and administrators: sign in using your institutionally issued credentials above.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Bottom System Info */}
      <div className="text-center text-[11px] text-charcoal-500">
        MediCare Health System • Authorized Session Access Only
      </div>
    </div>
  );
};

export default Login;
