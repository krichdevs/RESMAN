import apiClient from './client';

export const databaseApi = {
  // Get database statistics
  async getStats() {
    const response = await apiClient.get<any>('/admin/database/stats');
    if (response.success && response.data) {
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to fetch database stats');
  },

  // Export database as JSON
  async exportDatabase() {
    try {
      const response = await apiClient.client.get('/api/admin/database/export', {
        responseType: 'blob',
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
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to cleanup database');
  },

  // Rebuild indexes
  async rebuildIndexes() {
    const response = await apiClient.post<any>('/admin/database/rebuild-indexes');
    if (response.success && response.data) {
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to rebuild indexes');
  },

  // Vacuum/optimize database
  async vacuum() {
    const response = await apiClient.post<any>('/admin/database/vacuum');
    if (response.success && response.data) {
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to optimize database');
  },

  // Check database health
  async checkHealth() {
    const response = await apiClient.get<any>('/admin/database/health');
    if (response.success && response.data) {
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to check database health');
  },
};
