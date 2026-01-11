import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';

const resetSchema = z
  .object({
    emailOrUsername: z.string().min(3, 'Email or username is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ emailOrUsername: data.emailOrUsername, newPassword: data.newPassword });
      toast.success('Password reset successfully — please login');
      navigate('/login');
    } catch (e: any) {
      toast.error(e.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Reset Password</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email or Username</label>
              <input {...register('emailOrUsername')} className={`input ${errors.emailOrUsername ? 'input-error' : ''}`} />
              {errors.emailOrUsername && <p className="text-error-600 text-sm">{errors.emailOrUsername.message}</p>}
            </div>

            <div>
              <label className="label">New Password</label>
              <input type="password" {...register('newPassword')} className={`input ${errors.newPassword ? 'input-error' : ''}`} />
              {errors.newPassword && <p className="text-error-600 text-sm">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" {...register('confirmPassword')} className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
              {errors.confirmPassword && <p className="text-error-600 text-sm">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
