import React from 'react';
import { Settings, Shield, Database, Mail, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-600 to-slate-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">System Settings</h1>
        <p className="text-gray-100">Configure system preferences and policies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Security Settings</h3>
          </div>
          <p className="text-gray-600 text-sm">Password policies, session timeouts, access controls</p>
          <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
            Configure →
          </button>
        </div>

        <Link to="/admin/database-settings" className="bg-white p-6 rounded-xl shadow-card border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Database Settings</h3>
          </div>
          <p className="text-gray-600 text-sm">Backup, export, cleanup, and optimize database</p>
          <button className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium">
            Configure →
          </button>
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Email Settings</h3>
          </div>
          <p className="text-gray-600 text-sm">SMTP configuration, notification templates, email preferences</p>
          <button className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium">
            Configure →
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Notification Settings</h3>
          </div>
          <p className="text-gray-600 text-sm">Push notifications, alert thresholds, user preferences</p>
          <button className="mt-3 text-orange-600 hover:text-orange-700 text-sm font-medium">
            Configure →
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">Advanced Settings Coming Soon</h3>
            <p className="text-yellow-700">Full system configuration will be available in Phase 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}