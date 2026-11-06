import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import { Loader2, Plus, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDoctorName } from '../../utils/formatters';

const doctorSchema = z.object({
  name: z.string().trim().min(2, 'Practitioner name must be at least 2 characters'),
  email: z.string().trim().email('Invalid institutional email address'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  specialization: z.string().trim().min(2, 'Clinical specialization required'),
  experience: z.coerce.number().min(0, 'Experience must be zero or positive'),
  fees: z.coerce.number().min(0, 'Consultation fee must be zero or positive'),
  hospital: z.string().trim().optional()
});

const CreateDoctorForm = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(doctorSchema),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      await api.post('/admin/create-doctor', data);
      reset();
      setSuccess(`${formatDoctorName(data.name)} onboarded into physician directory.`);
      setTimeout(() => setSuccess(''), 5000);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create practitioner account');
    }
  };

  return (
    <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
      <div className="pb-4 border-b border-sand-200 mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 uppercase tracking-wider mb-1">
          <UserPlus size={15} /> Practitioner Onboarding
        </div>
        <h3 className="text-xl font-serif text-charcoal-900 font-normal">
          Register New Physician
        </h3>
        <p className="text-xs text-charcoal-600 mt-0.5">
          Provision verified doctor credentials and clinical profile
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 rounded flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-terracotta-700" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-sage-100 border border-sage-300 text-xs text-forest-900 rounded flex items-start gap-2">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-forest-700" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Physician Full Name <span className="text-terracotta-700">*</span>
          </label>
          <input
            {...register('name')}
            className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            placeholder="Dr. Eleanor Vance"
          />
          {errors.name && <p className="text-2xs text-terracotta-700 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Institutional Email <span className="text-terracotta-700">*</span>
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            placeholder="dr.vance@medicare.clinic"
          />
          {errors.email && <p className="text-2xs text-terracotta-700 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Temporary Login Password <span className="text-terracotta-700">*</span>
          </label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            placeholder="Minimum 6 characters"
          />
          {errors.password && <p className="text-2xs text-terracotta-700 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Clinical Discipline / Specialty <span className="text-terracotta-700">*</span>
          </label>
          <input
            {...register('specialization')}
            className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            placeholder="Cardiologist, Neurologist, Orthopedic..."
          />
          {errors.specialization && (
            <p className="text-2xs text-terracotta-700 mt-1">{errors.specialization.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">
              Experience (Years)
            </label>
            <input
              {...register('experience')}
              type="number"
              min="0"
              className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
              placeholder="e.g. 8"
            />
            {errors.experience && (
              <p className="text-2xs text-terracotta-700 mt-1">{errors.experience.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">
              Consult Fee ($)
            </label>
            <input
              {...register('fees')}
              type="number"
              min="0"
              className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
              placeholder="e.g. 150"
            />
            {errors.fees && <p className="text-2xs text-terracotta-700 mt-1">{errors.fees.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Affiliated Hospital / Clinic
          </label>
          <input
            {...register('hospital')}
            className="w-full px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
            placeholder="MediCare General Hospital"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-medium rounded-md transition shadow-2xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Registering Physician...</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>Create Physician Account</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateDoctorForm;
