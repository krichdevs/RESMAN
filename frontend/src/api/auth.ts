import apiClient from './client';
import type { User, LoginCredentials, RegisterData } from '../types';

export const authApi = {
  // Login user
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post('/auth/login', credentials);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }

    // Backend wraps actual payload in `data` -> { token, refreshToken, user }
    const resp: any = response;
    const payload = resp.data?.data ?? resp.data;

    if (!payload || !payload.token || !payload.user) {
      throw new Error('Invalid login response');
    }

    // Store token
    localStorage.setItem('auth_token', payload.token);
    return payload.user as User;
  },

  // Register new user
  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post('/auth/register', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }

    const resp: any = response;
    // Backend may return either: { data: { token, user } } (auto-login)
    // or: { data: user } (created but not signed in). Support both.
    const payload = resp.data?.data ?? resp.data;

    // If backend returned token + user (auto-login), store token and return user
    if (payload && payload.token && payload.user) {
      localStorage.setItem('auth_token', payload.token);
      return payload.user as User;
    }

    // If backend returned a user object directly, return it (no auto-login)
    if (payload && typeof payload === 'object' && payload.id) {
      return payload as User;
    }

    throw new Error('Invalid registration response');
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get profile');
    }

    const resp: any = response;
    const payload = resp.data?.data ?? resp.data;
    if (!payload || !payload.user) throw new Error('Failed to get profile');
    return payload.user as User;
  },

  // Logout user
  async logout(): Promise<void> {
    const response = await apiClient.post('/auth/logout');
    if (!response.success) {
      throw new Error(response.error || 'Logout failed');
    }

    // Clear token
    localStorage.removeItem('auth_token');
  },

  // Refresh token
  async refreshToken(): Promise<string> {
    const response = await apiClient.post('/auth/refresh');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Token refresh failed');
    }

    const resp: any = response;
    const payload = resp.data?.data ?? resp.data;
    if (!payload || !payload.token) throw new Error('Invalid refresh response');

    // Update stored token
    localStorage.setItem('auth_token', payload.token);
    return payload.token as string;
  },

  // Change password
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    const response = await apiClient.put('/auth/change-password', data);
    if (!response.success) {
      throw new Error(response.error || 'Password change failed');
    }
  },

  // Forgot / reset password (by email or indexNumber)
  async forgotPassword(data: { emailOrUsername: string; newPassword: string }): Promise<void> {
    const response = await apiClient.post('/auth/forgot', data);
    if (!response.success) {
      throw new Error(response.error || 'Password reset failed');
    }
  },
};
