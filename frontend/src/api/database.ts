import apiClient from './client';
import axios from 'axios';

export const databaseApi = {
  // Get database statistics
  async getStats() {
    try {
      const response = await apiClient.get<any>('/admin/database/stats');
      console.log('getStats response:', response);
      
      if (response.success) {
        // response.data contains the axios response data which has { success, data }
        if (response.data && response.data.data) {
          return response.data.data;
        }
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch database stats');
    } catch (error: any) {
      console.error('getStats error:', error);
      throw error;
    }
  },

  // Export database as JSON
  async exportDatabase() {
    try {
      const token = localStorage.getItem('auth_token');
      // Remove /api suffix if present since we're adding the full path
      const baseURL = ((import.meta as any).env.VITE_API_URL as string) || 'http://localhost:5000/api';
      const cleanBaseURL = baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
      const response = await axios.get('/api/admin/database/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
        baseURL: cleanBaseURL,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export database');
    }
  },

  // Clean up old data
  async cleanup(daysOld: number = 90, cleanupTypes: string[] = ['oldBookings', 'oldLogs']) {
    const response = await apiClient.post<any>('/admin/database/cleanup', {
      daysOld,
      cleanupTypes,
    });
    if (response.success && response.data) {
      return response.data.data || response.data;
    }
    throw new Error(response.error || 'Failed to cleanup database');
  },

  // Rebuild indexes
  async rebuildIndexes() {
    const response = await apiClient.post<any>('/admin/database/rebuild-indexes');
    if (response.success && response.data) {
      return response.data.data || response.data;
    }
    throw new Error(response.error || 'Failed to rebuild indexes');
  },

  // Vacuum/optimize database
  async vacuum() {
    const response = await apiClient.post<any>('/admin/database/vacuum');
    if (response.success && response.data) {
      return response.data.data || response.data;
    }
    throw new Error(response.error || 'Failed to optimize database');
  },

  // Check database health
  async checkHealth() {
    try {
      const response = await apiClient.get<any>('/admin/database/health');
      console.log('checkHealth response:', response);
      
      if (response.success) {
        if (response.data && response.data.data) {
          return response.data.data;
        }
        return response.data;
      }
      throw new Error(response.error || 'Failed to check database health');
    } catch (error: any) {
      console.error('checkHealth error:', error);
      return null;
    }
  },
};
