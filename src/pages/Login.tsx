// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, AlertCircle, KeyRound, Smartphone } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/common/Button';
import logoImg from '../assets/logo.png';

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
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_28px_70px_rgba(15,23,42,0.24)] ring-1 ring-white/80 p-8 space-y-6">
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
                <label htmlFor="agreement" className="text-xs text-slate-500 font-semibold select-none cursor-pointer leading-normal">
                  I agree to the <span className="text-emerald-600 font-bold hover:underline">Privacy Policy</span> and <span className="text-emerald-600 font-bold hover:underline">Terms of Agreement</span>. *
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

          {/* Helper notes */}
          <div className="border-t border-slate-50 pt-5 text-center space-y-2">
            <p className="text-xs text-slate-500 font-semibold">
              New library borrower?{' '}
              <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
                Register for Library Card
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Premium custom Login loading screen overlay */}
      {(isSubmitting || authLoading) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md fade-in">
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-4 text-center text-white">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-400 animate-spin"></div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight text-white Outfit">
                Authenticating Account
              </h3>
              <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
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
