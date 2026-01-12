import { apiClient } from './client';
import { User, ApiResponse, PaginatedResponse } from '../types';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  indexNumber?: string;
  role: string;
  department: string;
  phone?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  indexNumber?: string;
  role?: string;
  department?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  excludeRole?: string;
  department?: string;
  isActive?: boolean;
  includeStudents?: boolean;
}

// Get all users with pagination and filters
export const getUsers = async (params: UsersQueryParams = {}): Promise<PaginatedResponse<User>> => {
  console.log('📡 getUsers called with params:', params);
  const response = await apiClient.get<{ users: User[]; pagination: any }>('/admin/users', params);
  if (response.success && response.data && response.data.data) {
    return {
      data: response.data.data.users,
      ...response.data.data.pagination,
    };
  }
  throw new Error(response.error || 'Failed to fetch users');
};

// Create a new user
export const createUser = async (userData: CreateUserData): Promise<User> => {
  const response = await apiClient.post<User>('/admin/users', userData);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to create user');
};

// Update a user
export const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
  const response = await apiClient.put<User>(`/admin/users/${userId}`, userData);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to update user');
};

// Reset user password
export const resetUserPassword = async (userId: string, password: string): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(`/admin/users/${userId}/reset-password`, { password });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to reset password');
};

// Delete/deactivate a user
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/admin/users/${userId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to delete user');
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await apiClient.get('/admin/dashboard/stats');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch dashboard stats');
};

// Get system reports
export const getReports = async (params: { startDate?: string; endDate?: string } = {}) => {
  const response = await apiClient.get('/admin/reports/overview', { params });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch reports');
};

// Get system settings
export const getSettings = async () => {
  const response = await apiClient.get('/admin/settings');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch settings');
};