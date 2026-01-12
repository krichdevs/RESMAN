import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminDatabaseSettingsPage from './pages/AdminDatabaseSettingsPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<LandingPage />} />

              {/* Protected routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen">
                      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header onMenuClick={() => setSidebarOpen(true)} />
                        <main className="flex-1 overflow-y-auto p-6">
                          <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/bookings" element={<BookingPage />} />
                            <Route path="/rooms" element={<RoomsPage />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            {/* Add more routes here */}
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Admin routes - Protected by role */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole={['ADMIN']}>
                    <div className="flex h-screen">
                      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header onMenuClick={() => setSidebarOpen(true)} />
                        <main className="flex-1 overflow-y-auto p-6">
                          <Routes>
                            <Route path="/dashboard" element={<AdminDashboardPage />} />
                            <Route path="/bookings" element={<AdminBookingsPage />} />
                            <Route path="/users" element={<AdminUsersPage />} />
                            <Route path="/students" element={<AdminStudentsPage />} />
                            <Route path="/reports" element={<AdminReportsPage />} />
                            <Route path="/settings" element={<AdminSettingsPage />} />
                            <Route path="/database-settings" element={<AdminDatabaseSettingsPage />} />
                            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
