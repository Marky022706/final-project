// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminRoute from './components/layout/AdminRoute';
import { AIChatbot } from './components/member/AIChatbot';
import { MessageCircle } from 'lucide-react';

// Page Imports
import LandingPage from './pages/public/LandingPage';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import MemberDashboard from './pages/member/MemberDashboard';
import BookCatalog from './pages/member/BookCatalog';
import MyBooks from './pages/member/MyBooks';
import History from './pages/member/History';
import Fines from './pages/member/Fines';
import Notifications from './pages/member/Notifications';
import Profile from './pages/member/Profile';
import AccountSettings from './pages/member/AccountSettings';
import MemberActivityHistory from './pages/member/MemberActivityHistory';
import DigitalLibrary from './pages/member/DigitalLibrary';

// Admin Pages Imports
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminArchivedBooks from './pages/admin/AdminArchivedBooks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminReservations from './pages/admin/AdminReservations';
import AdminFines from './pages/admin/AdminFines';
import AdminReports from './pages/admin/AdminReports';
import AdminActivityLog from './pages/admin/AdminActivityLog';
import QRAttendanceScan from './pages/admin/QRAttendanceScan';
import AdminAttendance from './pages/admin/AdminAttendance';
import RequestManagement from './pages/admin/RequestManagement';

import NotFound from './pages/NotFound';

// Global AI Chatbot Component
const GlobalAIChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Only show for authenticated members (not admins)
  if (!user || user.role !== 'member') return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all hover:scale-105"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      
      {/* Chatbot Component */}
      <AIChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
          {/* Public Front-Facing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Member Protected Portal Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/catalog" element={<BookCatalog />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/history" element={<History />} />
            <Route path="/digital-library" element={<DigitalLibrary />} />
            <Route path="/activity-history" element={<MemberActivityHistory />} />
            <Route path="/fines" element={<Fines />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account-settings" element={<AccountSettings />} />
          </Route>

          {/* Librarian & Super Admin Administrative Restricted Routes */}
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
              path="/admin/archived-books"
              element={
                <AdminRoute>
                  <AdminArchivedBooks />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute superAdminOnly={true}>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <AdminRoute>
                  <RequestManagement />
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
              path="/admin/circulation"
              element={
                <AdminRoute>
                  <AdminTransactions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <AdminRoute>
                  <AdminReservations />
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
            <Route
              path="/admin/activity-log"
              element={
                <AdminRoute superAdminOnly={true}>
                  <AdminActivityLog />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <AdminRoute>
                  <AdminAttendance />
                </AdminRoute>
              }
            />

          </Route>

          {/* QR Scanner - Fullscreen */}
          <Route
            path="/admin/qr-scan"
            element={
              <AdminRoute>
                <QRAttendanceScan />
              </AdminRoute>
            }
          />

          {/* Page not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GlobalAIChatbot />
        <LogoutLoader />
      </AuthProvider>
     </ToastProvider>
    </ThemeProvider>
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
