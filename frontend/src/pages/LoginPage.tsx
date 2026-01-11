import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, Users, UserCheck, Shield } from 'lucide-react';
import logo from '../media/logo.png';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const loggedUser = await login(data);
      
      // Reject admin credentials on student portal
      if (loggedUser?.role === 'ADMIN') {
        toast.error('Admins must use the Admin portal. Click the Admin button.');
        setIsLoading(false);
        return;
      }
      
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src={logo} alt="Central University Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">RESMAN</h1>
          <p className="text-primary-200">Smart Classroom Scheduling</p>
          <p className="text-xs italic lowercase text-primary-300 mt-2">faith. integrity. excellence.</p>
        </div>

        {/* Login Card with role selector on left */}
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-stretch relative">
          {/* Admin button: lower right corner */}
          <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6">
            <button onClick={() => navigate('/admin-login')} className="flex items-center gap-2 justify-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition">
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          {/* Right: form */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@centraluniversity.edu.gh"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Sign In
                </span>
              )}
            </button>
            </form>

            {/* Footer */}
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Contact IT support if you need assistance</p>
              <div className="flex gap-4">
                <a href="/register" className="text-primary-700 hover:underline text-sm">Register</a>
                <a href="/reset-password" className="text-primary-700 hover:underline text-sm">Forgot password?</a>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <p className="text-center text-primary-200 text-sm mt-8">
          © {new Date().getFullYear()} Central University — Miotso Campus. All rights reserved.
        </p>
      </div>
    </div>
  );
}
