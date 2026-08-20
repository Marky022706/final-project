// src/pages/auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, AlertCircle, KeyRound, Smartphone, Shield, X, ShieldCheck, FileText, CheckCircle2, Scale, Check } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';
import logoImg from '../../assets/logo.png';

export const Login: React.FC = () => {
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetDevCode, setResetDevCode] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Popup states for Privacy Policy and Terms
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'privacy' | 'terms'>('privacy');

  const handleOpenPopup = (type: 'privacy' | 'terms') => {
    setPopupType(type);
    setShowPopup(true);
  };

  // Dynamic Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all credential fields.');
      return;
    }

    if (!agreementChecked) {
      setError('You must read and agree to the Privacy Policy and Terms of Agreement to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // Success redirection is handled by the useEffect above
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      console.error('Login Process Failure:', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setResetDevCode(null);

    if (!resetPhone.trim()) {
      setError('Please enter your registered phone number.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/request-password-reset', {
        phone: resetPhone.trim(),
      });

      setResetMessage(response.data.message || 'Reset code sent to your registered phone number.');
      setResetDevCode(response.data.data?.dev_code || null);
      setResetStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to send reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (!resetCode.trim() || !resetPassword) {
      setError('Please enter the reset code and your new password.');
      return;
    }

    if (resetPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        phone: resetPhone.trim(),
        code: resetCode.trim(),
        password: resetPassword,
      });

      setResetMessage(response.data.message || 'Password reset successfully. You can now sign in.');
      setForgotMode(false);
      setResetStep('request');
      setResetPhone('');
      setResetCode('');
      setResetPassword('');
      setResetDevCode(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotMode = () => {
    setForgotMode(true);
    setError(null);
    setResetMessage(null);
  };

  const closeForgotMode = () => {
    setForgotMode(false);
    setResetStep('request');
    setResetCode('');
    setResetPassword('');
    setResetDevCode(null);
    setError(null);
    setResetMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 gradient-bg relative overflow-hidden">
      {/* Soft background decor blurs */}
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full bg-teal-500/10 blur-2xl" />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md space-y-6 relative z-10 fade-in">
        {/* Logo and title */}
        <div className="flex flex-col items-center space-y-2.5 text-center">
          <Link to="/" className="h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden hover:scale-105 transition-transform duration-200">
            <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
              Balingasag Library Portal
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Public Library Management System
            </p>
          </div>
        </div>

        {/* Login form Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_28px_70px_rgba(15,23,42,0.24)] ring-1 ring-white/80 p-8 space-y-6 relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
              {forgotMode ? 'Reset Account Password' : 'Account Sign In'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              {forgotMode
                ? 'We will send a 6-digit code to your registered phone number'
                : 'Enter your library card credentials below'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <KeyRound className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {forgotMode ? (
            <form onSubmit={resetStep === 'request' ? handleRequestResetCode : handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-phone" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Registered Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Smartphone className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="reset-phone"
                    type="tel"
                    required
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    disabled={resetStep === 'verify'}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {resetStep === 'verify' && (
                <div className="space-y-4 fade-in">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-code" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      6-Digit Reset Code
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter code"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400 tracking-[0.3em] font-bold"
                    />
                    {resetDevCode && (
                      <p className="text-[10px] text-amber-600 font-bold">
                        Local test code: {resetDevCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reset-password" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      New Password
                    </label>
                    <input
                      id="reset-password"
                      type="password"
                      required
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForgotMode}
                  className="py-3 text-xs"
                  disabled={resetLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="py-3 text-xs"
                  isLoading={resetLoading}
                  disabled={resetLoading}
                >
                  {resetStep === 'request' ? 'Send Code' : 'Reset Password'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Library Registered Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotMode}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-4 pr-10.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Privacy and Agreement Checkbox */}
              <div className="flex items-start gap-2.5 py-1">
                <input
                  id="agreement"
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors duration-150 cursor-pointer"
                />
                <label htmlFor="agreement" className="text-[11px] text-slate-500 font-semibold select-none leading-normal">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenPopup('privacy')}
                    className="text-[11px] text-emerald-600 font-bold hover:underline inline-block focus:outline-none font-sans"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenPopup('terms')}
                    className="text-[11px] text-emerald-600 font-bold hover:underline inline-block focus:outline-none font-sans"
                  >
                    Terms of Agreement
                  </button>
                  . *
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-xs"
                isLoading={isSubmitting || authLoading}
                disabled={!agreementChecked || isSubmitting || authLoading}
              >
                Sign In to Dashboard
              </Button>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@balingasag.gov.ph');
                  setPassword('admin123');
                  setAgreementChecked(true);
                  setError(null);
                }}
                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-100 transition-all"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@balingasag.gov.ph');
                  setPassword('admin123');
                  setAgreementChecked(true);
                  setError(null);
                }}
                className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-xl border border-purple-100 transition-all"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('member@balingasag.gov.ph');
                  setPassword('member123');
                  setAgreementChecked(true);
                  setError(null);
                }}
                className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-xl border border-blue-100 transition-all"
              >
                Member
              </button>
            </div>
          </div>

          {/* Helper notes */}
          <div className="border-t border-slate-50 pt-3 text-center space-y-2">
            <p className="text-xs text-slate-500 font-semibold">
              New library borrower?{' '}
              <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
                Register for Library Card
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Redesigned Privacy Policy & Terms of Agreement Modal Dialog */}
      {showPopup && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop Click Outside */}
          <div className="fixed inset-0" onClick={() => setShowPopup(false)} />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-sm">
                    {popupType === 'privacy' ? <ShieldCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      {popupType === 'privacy' ? 'Privacy Policy' : 'Terms of Agreement'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Balingasag Municipal Public Library • Portal Terms
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Segmented Document Navigation Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPopupType('privacy')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                    popupType === 'privacy'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Privacy Policy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPopupType('terms')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                    popupType === 'terms'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Terms of Agreement</span>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Content with Rich Structured Styling */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-slate-600 text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {popupType === 'privacy' ? (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-xs sm:text-sm mb-1">
                        Commitment to Borrower Privacy
                      </h4>
                      <p className="text-xs text-emerald-800/90 leading-relaxed">
                        Your privacy is fundamental to our municipal service. We adhere strictly to data privacy standards to safeguard all personal and borrowing records.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        1. Information We Collect
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        When you register for a library card, we collect your full name, contact number, residential address, and email for the sole purpose of account identification, borrowing validation, and notification delivery.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        2. Data Storage and Server Security
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        All user profiles and activity logs are stored on secure municipal database servers. We never sell, lease, or distribute your private contact details to commercial third parties.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        3. Borrowing Records & Confidentiality
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Your borrowing history, reading lists, and reservation queries are kept confidential and accessible only to authorized municipal library personnel for inventory management.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        4. Account Security & Session Tokens
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Authentication tokens are encrypted and managed using secure rotation algorithms. You are advised to log out after using public devices.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3">
                    <Scale className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-xs sm:text-sm mb-1">
                        Balingasag Municipal Library Code of Conduct
                      </h4>
                      <p className="text-xs text-emerald-800/90 leading-relaxed">
                        By using the digital portal and accessing municipal facilities, you agree to comply with library policies and ordinances.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        1. Care of Library Materials
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Borrowers assume full responsibility for all materials checked out under their library card. Books must be returned on or before the due date in their original condition.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        2. Loan Periods and Limits
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Standard borrowing allows up to 3 books simultaneously for a period of 14 days, subject to renewal if no reservations are pending.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        3. Fines, Overdue Penalties & Replacement
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Late returns incur daily fines according to municipal ordinances. Damaged or lost items must be replaced or paid for at full replacement value.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        4. Account Credentials & Security
                      </h5>
                      <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                        Do not share your password or physical library card QR code with others. You remain responsible for any activity executed under your credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Agreement required to access member dashboard</span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPopup(false)}
                  className="w-full sm:w-auto py-2.5 px-4 text-xs font-bold"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setAgreementChecked(true);
                    setShowPopup(false);
                  }}
                  variant="primary"
                  className="w-full sm:w-auto py-2.5 px-5 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                >
                  <Check className="h-4 w-4" />
                  <span>I Understand & Agree</span>
                </Button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Premium custom Login loading screen overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm fade-in">
          <div className="bg-white border border-slate-100 p-8 rounded-3xl max-w-sm w-full mx-4 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.15)] flex flex-col items-center gap-5 text-center">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-50 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin"></div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold tracking-tight text-slate-800">
                Authenticating Account
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Verifying your credentials on the municipal server... Please wait while we load your library card profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
