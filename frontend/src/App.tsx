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
import DashboardPage from './pages/DashboardPage';
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
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            {/* Add more routes here */}
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
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
                            {/* Admin routes will be added here */}
                            <Route path="/admin" element={<div>Admin Dashboard</div>} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
