import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, Building2, Calendar, AlertCircle, TrendingUp, BarChart3, CheckSquare } from 'lucide-react';

type AdminStats = {
  totalUsers: number;
  activeBookings: number;
  totalRooms: number;
  pendingApprovals: number;
  maintenanceIssues: number;
  systemHealth: number;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeBookings: 0,
    totalRooms: 0,
    pendingApprovals: 0,
    maintenanceIssues: 0,
    systemHealth: 98,
  });

  useEffect(() => {
    // TODO: Fetch admin statistics from API
    // For now, set mock data
    setStats({
      totalUsers: 1242,
      activeBookings: 487,
      totalRooms: 45,
      pendingApprovals: 12,
      maintenanceIssues: 3,
      systemHealth: 98,
    });
  }, []);

  const adminStats = [
    { name: 'Total Users', value: String(stats.totalUsers), icon: Users, color: 'bg-blue-500' },
    { name: 'Active Bookings', value: String(stats.activeBookings), icon: Calendar, color: 'bg-green-500' },
    { name: 'Total Rooms', value: String(stats.totalRooms), icon: Building2, color: 'bg-yellow-500' },
    { name: 'Pending Approvals', value: String(stats.pendingApprovals), icon: AlertCircle, color: 'bg-red-500' },
    { name: 'Maintenance Issues', value: String(stats.maintenanceIssues), icon: TrendingUp, color: 'bg-orange-500' },
    { name: 'System Health', value: `${stats.systemHealth}%`, icon: BarChart3, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Administrator</h1>
        <p className="text-purple-100">Here's your system overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminStats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-6 shadow-card border border-gray-200 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Management Actions */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Management Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/bookings"
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition group"
            >
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  Manage Bookings
                </p>
                <p className="text-sm text-gray-600 mt-1">Approve/reject booking requests</p>
              </div>
              <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition opacity-60 cursor-not-allowed">
              <p className="font-medium text-gray-900">👥 Manage Users</p>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or remove user accounts (Coming Soon)</p>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition opacity-60 cursor-not-allowed">
              <p className="font-medium text-gray-900">🏢 Configure Rooms</p>
              <p className="text-sm text-gray-600 mt-1">Add/edit rooms, capacity, equipment (Coming Soon)</p>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition opacity-60 cursor-not-allowed">
              <p className="font-medium text-gray-900">🔧 Maintenance Schedule</p>
              <p className="text-sm text-gray-600 mt-1">Block rooms for maintenance (Coming Soon)</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-700">New user registration</span>
              <span className="text-gray-500">5 min ago</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-700">Booking approval</span>
              <span className="text-gray-500">12 min ago</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-700">System backup completed</span>
              <span className="text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Maintenance window scheduled</span>
              <span className="text-gray-500">Yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health & Alerts */}
      <div className="bg-white rounded-xl p-6 shadow-card border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">Database</p>
            <p className="text-2xl font-bold text-green-600 mt-2">✓ Online</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">API Server</p>
            <p className="text-2xl font-bold text-green-600 mt-2">✓ Online</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">Socket.IO</p>
            <p className="text-2xl font-bold text-green-600 mt-2">✓ Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
