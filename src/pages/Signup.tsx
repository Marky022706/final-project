// src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/common/Button';
import logoImg from '../assets/logo.png';

export const Signup: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fire registration request
      const response = await api.post('/auth/register', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone: phone || undefined,
        address: address || undefined,
      });

      if (response.data && response.data.success) {
        // 2. Auto-login on successful registration
        await login(email, password);
      } else {
        throw new Error(response.data.message || 'Registration failed.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed. The email may already be in use.';
      setError(errMsg);
      console.error('Registration Process Failure:', errMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 gradient-bg relative overflow-hidden">
      {/* Background decor */}
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

      <div className="w-full max-w-lg space-y-6 relative z-10 fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link to="/" className="h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden hover:scale-105 transition-transform duration-200">
            <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
          </Link>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
              Register Library Account
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Create a free Balingasag Municipal Library Card
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/40 p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
              Borrower Account Details
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              Fill in your correct contact details for physical identity validation
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* First name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                />
              </div>

              {/* Last name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dela Cruz"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Account Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09171234567"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Home Barangay Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Barangay 3, Balingasag"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-xs mt-2"
              isLoading={isSubmitting || authLoading}
            >
              Register & Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="border-t border-slate-50 pt-5 text-center">
            <p className="text-xs text-slate-500 font-semibold">
              Already have a library account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Premium custom Signup loading screen overlay */}
      {(isSubmitting || authLoading) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md fade-in">
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-4 text-center text-white">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-400 animate-spin"></div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight text-white Outfit">
                Registering Profile
              </h3>
              <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
                Generating your library card and establishing connection... Please wait while we set up your member dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
