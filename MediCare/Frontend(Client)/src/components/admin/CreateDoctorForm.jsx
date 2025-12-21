import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import { Loader2, Plus } from 'lucide-react';

const doctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  specialization: z.string().min(2),
  experience: z.number().min(0),
  fees: z.number().min(0),
});

const CreateDoctorForm = ({ onSuccess }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(doctorSchema),
  });
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      await api.post('/admin/create-doctor', data);
      reset();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Plus className="text-blue-600" /> Add New Doctor
      </h3>
      
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input {...register('name')} className="w-full p-2 border rounded" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} type="email" className="w-full p-2 border rounded" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input {...register('password')} type="password" className="w-full p-2 border rounded" />
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Specialization</label>
          <input {...register('specialization')} className="w-full p-2 border rounded" />
          {errors.specialization && <p className="text-red-500 text-xs">{errors.specialization.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
          <input {...register('experience', { valueAsNumber: true })} type="number" className="w-full p-2 border rounded" />
          {errors.experience && <p className="text-red-500 text-xs">{errors.experience.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fees</label>
          <input {...register('fees', { valueAsNumber: true })} type="number" className="w-full p-2 border rounded" />
          {errors.fees && <p className="text-red-500 text-xs">{errors.fees.message}</p>}
        </div>

        <div className="md:col-span-2">
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center"
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Doctor'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDoctorForm;
