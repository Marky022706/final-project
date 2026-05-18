// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
