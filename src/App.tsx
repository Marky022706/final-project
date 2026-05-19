// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminRoute from './components/layout/AdminRoute';

// Page Imports
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MemberDashboard from './pages/MemberDashboard';
import BookCatalog from './pages/BookCatalog';
import MyBooks from './pages/MyBooks';
import History from './pages/History';
import Fines from './pages/Fines';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

// Admin Pages Imports
import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminFines from './pages/admin/AdminFines';
import AdminReports from './pages/admin/AdminReports';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
          {/* Public Front-Facing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Member Protected Portal Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/catalog" element={<BookCatalog />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/history" element={<History />} />
            <Route path="/fines" element={<Fines />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Librarian Administrative Restricted Routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/books"
              element={
                <AdminRoute>
                  <AdminBooks />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <AdminRoute>
                  <AdminTransactions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/fines"
              element={
                <AdminRoute>
                  <AdminFines />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
              }
            />
          </Route>

          {/* Page not found redirect fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <LogoutLoader />
      </AuthProvider>
     </ToastProvider>
    </BrowserRouter>
  );
};

// Full-screen premium frosted-glass logout loader
const LogoutLoader: React.FC = () => {
  const { isLoggingOut } = useAuth();

  if (!isLoggingOut) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white/10 backdrop-blur-lg border border-white/15 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-4 text-center text-white">
        {/* Beautiful double-ring spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-400 animate-spin"></div>
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-white Outfit">
            Securing Portal Session
          </h3>
          <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
            Signing out from Balingasag Municipal Library... Please wait while we clear your credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
