import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import apiClient from '../api/client';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name required'),
    lastName: z.string().min(2, 'Last name required'),
    indexNumber: z.string().min(3, 'Student ID is required'),
    course: z.string().min(1, 'Course/Department is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Array<{ code: string; name: string }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await apiClient.get('/departments');
        // log for debugging network/env issues
        // eslint-disable-next-line no-console
        console.debug('Departments fetch (apiClient) response:', resp);
        const payload: any = resp;
        let list = payload.data?.data ?? payload.data ?? [];

        // If apiClient returned nothing (common when VITE_API_URL doesn't include /api),
        // try an explicit fetch against VITE_API_URL with both possible paths.
        if ((!Array.isArray(list) || list.length === 0) && typeof window !== 'undefined') {
          try {
            const base = ((import.meta as any).env.VITE_API_URL as string) || 'http://localhost:5000/api';
            const tryUrls = [
              `${base.replace(/\/+$/,'')}/departments`,
              `${base.replace(/\/+$/,'').replace(/\/api$/,'')}/api/departments`,
            ];
            for (const u of tryUrls) {
              // eslint-disable-next-line no-await-in-loop
              const r = await fetch(u, { credentials: 'include' });
              if (!r.ok) continue;
              // eslint-disable-next-line no-await-in-loop
              const j = await r.json();
              const candidate = j?.data ?? j;
              if (Array.isArray(candidate) && candidate.length > 0) {
                list = candidate;
                break;
              }
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Departments fallback fetch failed', err);
          }
        }

        if (mounted && Array.isArray(list)) setDepartments(list);
      } catch (e) {
        // show in console to aid debugging
        // eslint-disable-next-line no-console
        console.error('Failed to load departments:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
          department: data.course,
          indexNumber: data.indexNumber,
          course: data.course,
        role: 'STUDENT',
      });
      toast.success('Registration successful — you can now sign in');
      navigate('/login');
    } catch (e: any) {
      toast.error(e.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Student Registration</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden fields to reduce browser autofill of existing credentials */}
            <input aria-hidden style={{ display: 'none' }} />
            <input type="password" aria-hidden autoComplete="new-password" style={{ display: 'none' }} />
            <div>
              <label className="label">First name</label>
              <input autoComplete="given-name" {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} />
              {errors.firstName && <p className="text-error-600 text-sm">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="label">Last name</label>
              <input autoComplete="family-name" {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} />
              {errors.lastName && <p className="text-error-600 text-sm">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="label">Student ID / Username</label>
              <input autoComplete="username" {...register('indexNumber')} className="input" placeholder="e.g. s12345" />
            </div>

            <div>
              <label className="label">Course / Department</label>
              {departments.length > 0 ? (
                <select {...register('course')} className="input">
                  <option value="">Select your course/department</option>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code} data-name={d.name}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input autoComplete="organization" {...register('course')} className="input" placeholder="e.g. CS, MATH" />
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input autoComplete="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="text-error-600 text-sm">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" autoComplete="new-password" {...register('password')} className={`input ${errors.password ? 'input-error' : ''}`} />
              {errors.password && <p className="text-error-600 text-sm">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input type="password" autoComplete="new-password" {...register('confirmPassword')} className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
              {errors.confirmPassword && <p className="text-error-600 text-sm">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            <p>Default email format: studentname@central.edu (you can provide any valid email)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
