import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Users, Building2, AlertCircle } from 'lucide-react';
import { getDashboardStats } from '../api/admin';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBookings: number;
  activeUsers: number;
  roomUtilization: number;
  monthlyGrowth: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  totalRooms: number;
  recentBookings: any[];
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data.data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch statistics';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-purple-100">System usage statistics and insights</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-purple-100">System usage statistics and insights</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Statistics</h3>
              <p className="text-red-700">{error || 'Failed to load dashboard statistics'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-purple-100">System usage statistics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">This month: {stats.bookingsThisMonth}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Room Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{stats.roomUtilization}%</p>
              <p className="text-xs text-gray-500 mt-1">Total rooms: {stats.totalRooms}</p>
            </div>
            <Building2 className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}%</p>
              <p className="text-xs text-gray-500 mt-1">vs last month</p>
            </div>
            <TrendingUp className={`w-8 h-8 ${stats.monthlyGrowth >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
          </div>
        </div>
      </div>

      {stats.recentBookings && stats.recentBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking: any, index: number) => (
                  <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{booking.user.firstName} {booking.user.lastName}</p>
                        <p className="text-xs text-gray-500">{booking.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">{booking.room.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Advanced Charts Coming Soon</h3>
            <p className="text-blue-700">Detailed trend charts and custom date range reports will be available in Phase 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}