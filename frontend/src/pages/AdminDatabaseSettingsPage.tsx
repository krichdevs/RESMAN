import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, Download, AlertCircle, CheckCircle, Clock, HardDrive, BarChart3 } from 'lucide-react';
import { databaseApi } from '../api/database';
import toast from 'react-hot-toast';

interface DatabaseStats {
  tables: {
    users: number;
    rooms: number;
    bookings: number;
    timeSlots: number;
    auditLogs: number;
  };
  statistics: {
    activeBookings: number;
    usersByRole: Record<string, number>;
  };
}

export default function AdminDatabaseSettingsPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    checkHealth();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getStats();
      setStats(data);
    } catch (error: any) {
      toast.error('Failed to fetch database stats');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const data = await databaseApi.checkHealth();
      setHealth(data);
    } catch (error: any) {
      console.error('Health check failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      setOperating('export');
      const blob = await databaseApi.exportDatabase();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resman-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Database exported successfully');
    } catch (error: any) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setOperating(null);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('This will delete old cancelled bookings and logs older than 90 days. Continue?')) {
      return;
    }
    try {
      setOperating('cleanup');
      const result = await databaseApi.cleanup(90, ['oldBookings', 'oldLogs']);
      toast.success(`Cleanup completed: ${result.results.deletedBookings || 0} bookings, ${result.results.deletedLogs || 0} logs deleted`);
      fetchStats();
    } catch (error: any) {
      toast.error('Cleanup failed: ' + error.message);
    } finally {
      setOperating(null);
    }
  };

  const handleRebuildIndexes = async () => {
    if (!window.confirm('Rebuild database indexes? This may take a moment.')) {
      return;
    }
    try {
      setOperating('reindex');
      await databaseApi.rebuildIndexes();
      toast.success('Indexes rebuilt successfully');
    } catch (error: any) {
      toast.error('Rebuild failed: ' + error.message);
    } finally {
      setOperating(null);
    }
  };

  const handleVacuum = async () => {
    if (!window.confirm('Optimize database? This may take a moment.')) {
      return;
    }
    try {
      setOperating('vacuum');
      await databaseApi.vacuum();
      toast.success('Database optimized successfully');
    } catch (error: any) {
      toast.error('Optimization failed: ' + error.message);
    } finally {
      setOperating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Database Management</h1>
            <p className="text-green-100">View statistics, backup data, and optimize performance</p>
          </div>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <div className={`rounded-xl p-6 border-2 ${health.status === 'healthy' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-center gap-3">
            {health.status === 'healthy' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h3 className={`font-semibold ${health.status === 'healthy' ? 'text-green-900' : 'text-red-900'}`}>
                Database Status: {health.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
              </h3>
              <p className={`text-sm ${health.status === 'healthy' ? 'text-green-700' : 'text-red-700'}`}>
                Connection: {health.connection}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Users</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tables.users}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-gray-600">Rooms</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tables.rooms}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-600">Bookings</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tables.bookings}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-medium text-gray-600">Time Slots</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tables.timeSlots}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-gray-600">Audit Logs</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tables.auditLogs}</p>
          </div>
        </div>
      )}

      {/* Active Bookings & Users by Role */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Active Bookings</span>
                <span className="font-bold text-lg text-blue-600">{stats.statistics.activeBookings}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Users by Role</h3>
            <div className="space-y-3">
              {Object.entries(stats.statistics.usersByRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600 capitalize">{role}</span>
                  <span className="font-bold text-lg">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Database Operations */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Database Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Export Data</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Download complete database as JSON file for backup or analysis
            </p>
            <button
              onClick={handleExport}
              disabled={operating === 'export'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {operating === 'export' ? 'Exporting...' : 'Export Database'}
            </button>
          </div>

          {/* Cleanup */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-gray-900">Clean Up Data</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Remove cancelled bookings and audit logs older than 90 days
            </p>
            <button
              onClick={handleCleanup}
              disabled={operating === 'cleanup'}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {operating === 'cleanup' ? 'Cleaning...' : 'Clean Up'}
            </button>
          </div>

          {/* Rebuild Indexes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Rebuild Indexes</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Rebuild all database indexes for optimal query performance
            </p>
            <button
              onClick={handleRebuildIndexes}
              disabled={operating === 'reindex'}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {operating === 'reindex' ? 'Rebuilding...' : 'Rebuild Indexes'}
            </button>
          </div>

          {/* Vacuum */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Optimize Database</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Optimize database file and reclaim unused space
            </p>
            <button
              onClick={handleVacuum}
              disabled={operating === 'vacuum'}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {operating === 'vacuum' ? 'Optimizing...' : 'Optimize'}
            </button>
          </div>

          {/* Refresh Stats */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Refresh Stats</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Reload current database statistics
            </p>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Important</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Always export a backup before running cleanup operations</li>
              <li>• Database optimization may take a few moments</li>
              <li>• These operations require admin privileges</li>
              <li>• Changes cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons needed - add to imports
import { Users, Building, Calendar } from 'lucide-react';
