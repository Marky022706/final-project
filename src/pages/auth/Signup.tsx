// src/pages/auth/Signup.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, AlertCircle, User, Lock, Shield, ChevronLeft, ChevronRight, Check, Eye, EyeOff, X, ShieldCheck, FileText, CheckCircle2, Scale } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';
import logoImg from '../../assets/logo.png';

export const Signup: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popup states for Privacy Policy and Terms
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'privacy' | 'terms'>('privacy');

  const handleOpenPopup = (type: 'privacy' | 'terms') => {
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', colorClass: '', textClass: '' };

    let score = 0;

    // Condition 1: Length check
    if (pwd.length >= 6) {
      score += 1;
    }

    // Condition 2: Contains both letters and numbers
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    if (hasLetters && hasNumbers) {
      score += 1;
    }

    // Condition 3: Contains uppercase, lowercase, numbers, and special chars
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasUppercase && hasLowercase && hasSpecial) {
      score += 1;
    }

    // Map score to weak / neutral / strong
    if (score === 0 || score === 1) {
      return { score: 1, label: 'Weak', colorClass: 'bg-rose-500', textClass: 'text-rose-500' };
    } else if (score === 2) {
      return { score: 2, label: 'Neutral', colorClass: 'bg-amber-500', textClass: 'text-amber-500' };
    } else {
      return { score: 3, label: 'Strong', colorClass: 'bg-emerald-500', textClass: 'text-emerald-500' };
    }
  };

  const isNumericOnly = (str: string) => {
    const trimmed = str.trim();
    if (!trimmed) return false;
    return /^\d+$/.test(trimmed);
  };

  const containsNumbers = (str: string) => {
    return /\d/.test(str);
  };

  const handleNextStep1 = () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please fill in all required fields (First Name and Last Name).');
      return;
    }
    if (containsNumbers(firstName)) {
      setError('First Name cannot contain numbers.');
      return;
    }
    if (middleName && containsNumbers(middleName)) {
      setError('Middle Name cannot contain numbers.');
      return;
    }
    if (containsNumbers(lastName)) {
      setError('Last Name cannot contain numbers.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!/^\d+$/.test(phone)) {
      setError('Phone number must contain numbers only.');
      return;
    }
    if (phone.length !== 11) {
      setError('Phone number must be exactly 11 digits.');
      return;
    }
    if (!address.trim()) {
      setError('Home Barangay Address is required.');
      return;
    }
    if (isNumericOnly(address)) {
      setError('Address cannot consist of numbers only.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please fill in all required fields (Email and Password).');
      return;
    }
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long for account security.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Double check step validations
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !phone.trim() || !address.trim()) {
      setError('Please fill in all profile and security fields.');
      return;
    }

    if (containsNumbers(firstName) || containsNumbers(lastName) || (middleName && containsNumbers(middleName))) {
      setError('First Name, Middle Name, and Last Name cannot contain numbers.');
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      setError('Phone number must be exactly 11 digits.');
      return;
    }
    if (isNumericOnly(address)) {
      setError('Address cannot consist of numbers only.');
      return;
    }

    if (!agreementChecked) {
      setError('You must read and agree to the Privacy Policy and User Agreement to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fire registration request
      const response = await api.post('/auth/register', {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
        role: 'member',
      });

      if (response.data && response.data.success) {
        // 2. Auto-login on successful registration
        await login(email.trim(), password);
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
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_28px_70px_rgba(15,23,42,0.24)] ring-1 ring-white/80 p-8 space-y-6 relative overflow-hidden">

          {/* Visual Step Process Stepper Indicator */}
          <div className="relative mb-4">
            {/* Connecting Progress Track Bar */}
            <div className="absolute top-5 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-0">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-in-out"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              />
            </div>

            {/* Stepper circles */}
            <div className="flex justify-between items-center relative z-10">
              {/* Step 1 Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(1)}
                  disabled={isSubmitting || authLoading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 focus:outline-none ${step > 1
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100/80 cursor-pointer hover:bg-emerald-600 hover:border-emerald-600'
                    : step === 1
                      ? 'bg-white border-emerald-500 text-emerald-600 font-bold ring-4 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {step > 1 ? <Check className="h-5 w-5 stroke-[2.5]" strokeWidth={2.5} /> : <User className="h-5 w-5" />}
                </button>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors duration-200 ${step === 1 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-semibold'
                  }`}>Profile</span>
              </div>

              {/* Step 2 Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => step > 2 && setStep(2)}
                  disabled={step < 2 || isSubmitting || authLoading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 focus:outline-none ${step > 2
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100/80 cursor-pointer hover:bg-emerald-600 hover:border-emerald-600'
                    : step === 2
                      ? 'bg-white border-emerald-500 text-emerald-600 font-bold ring-4 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {step > 2 ? <Check className="h-5 w-5 stroke-[2.5]" strokeWidth={2.5} /> : <Lock className="h-5 w-5" />}
                </button>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors duration-200 ${step === 2 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-semibold'
                  }`}>Security</span>
              </div>

              {/* Step 3 Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step === 3
                    ? 'bg-white border-emerald-500 text-emerald-600 font-bold ring-4 ring-emerald-500/10'
                    : 'bg-white border-slate-200 text-slate-400'
                    }`}
                >
                  <Shield className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors duration-200 ${step === 3 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-semibold'
                  }`}>Agreement</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
              {step === 1 && 'Borrower Account Profile'}
              {step === 2 && 'Security Credentials'}
              {step === 3 && 'Privacy Policy & Terms'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              {step === 1 && 'Fill in your correct contact details for physical identity validation'}
              {step === 2 && 'Establish a secure sign in identity using email and password'}
              {step === 3 && 'Read and agree to library borrowing guidelines and server policies'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1 Inputs: Profile Details */}
            {step === 1 && (
              <div className="space-y-4 fade-in">
                <div className="grid grid-cols-3 gap-3">
                  {/* First name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-xs placeholder-slate-400 ${containsNumbers(firstName)
                        ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-primary-550/15 focus:border-primary-550'
                        }`}
                    />
                    {containsNumbers(firstName) && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">Cannot contain numbers</p>
                    )}
                  </div>

                  {/* Middle name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Optional"
                      className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-xs placeholder-slate-400 ${containsNumbers(middleName)
                        ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-primary-550/15 focus:border-primary-550'
                        }`}
                    />
                    {containsNumbers(middleName) && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">Cannot contain numbers</p>
                    )}
                  </div>

                  {/* Last name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className={`w-full px-3 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-xs placeholder-slate-400 ${containsNumbers(lastName)
                        ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-primary-550/15 focus:border-primary-550'
                        }`}
                    />
                    {containsNumbers(lastName) && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">Cannot contain numbers</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setPhone(val);
                    }}
                    placeholder="e.g. 09123456789"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm placeholder-slate-400 ${phone && (!/^\d+$/.test(phone) || phone.length !== 11)
                      ? 'border-rose-500 focus:ring-rose-500/15 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-primary-550/15 focus:border-primary-550'
                      }`}
                  />
                  {phone && !/^\d+$/.test(phone) && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">Phone must contain numbers only</p>
                  )}
                  {phone && /^\d+$/.test(phone) && phone.length !== 11 && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">Phone number must be exactly 11 digits ({phone.length}/11)</p>
                  )}
                  {phone && /^\d{11}$/.test(phone) && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Valid phone number</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Home Barangay Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Brgy. Poblacion, Balingasag"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                  />
                </div>

                {/* Navigation */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleNextStep1}
                    variant="primary"
                    className="w-full py-3 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Continue to Credentials</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 Inputs: Security Credentials */}
            {step === 2 && (
              <div className="space-y-4 fade-in">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Account Password
                  </label>
                  <div className="relative">
                    <input
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
                  <p className="text-[10px] text-slate-400 font-semibold">Must be at least 6 characters long.</p>

                  {/* Password Strength Indicator */}
                  {password && (() => {
                    const { score, label, colorClass, textClass } = getPasswordStrength(password);
                    return (
                      <div className="space-y-1.5 mt-2 fade-in">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400 uppercase tracking-wide">Password Strength</span>
                          <span className={`${textClass} uppercase tracking-wider`}>{label}</span>
                        </div>
                        <div className="flex gap-1.5 h-1.5 w-full">
                          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 1 ? colorClass : 'bg-slate-100'}`} />
                          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 2 ? colorClass : 'bg-slate-100'}`} />
                          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 3 ? colorClass : 'bg-slate-100'}`} />
                        </div>
                      </div>
                    );
                  })()}
                </div>


                {/* Navigation */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="py-3 text-xs flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep2}
                    variant="primary"
                    className="py-3 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 Inputs: Policy & Agreement */}
            {step === 3 && (
              <div className="space-y-4 fade-in">
                {/* Scrollable mock agreement details */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Library Terms & Conditions
                  </label>
                  <div className="h-36 overflow-y-auto border border-slate-200/80 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed bg-slate-50/50 font-medium space-y-2.5 scrollbar-thin">
                    <p className="font-semibold text-slate-700 text-[11px]">1. Terms of Book Borrowing</p>
                    <p>By obtaining a Balingasag Municipal Library Card, you agree to take full responsibility for all materials borrowed. You promise to return borrowed books on or before their due dates in the same condition as when they were received.</p>

                    <p className="font-semibold text-slate-700 text-[11px]">2. Fines and Penalties</p>
                    <p>Late returns are subject to late fee fines set by municipal ordinances. Unresolved overdue items or unpaid fines may lead to temporary suspension or permanent cancellation of library card privileges.</p>

                    <p className="font-semibold text-slate-700 text-[11px]">3. Privacy Policy & Data Server Integrity</p>
                    <p>Your privacy is important to us. Your profile info (First Name, Last Name, Phone, Address, Email) is strictly safely stored on the Balingasag library server database. We never sell, share or distribute your contact details to third-party databases. The collected data is solely used for library database card validation and physical identity authentication.</p>

                    <p className="font-semibold text-slate-700 text-[11px]">4. User Accounts</p>
                    <p>Users agree to safeguard their passwords and avoid sharing them with others. You are responsible for any borrowing history associated with your library card credentials.</p>
                  </div>
                </div>

                {/* Privacy and Agreement checkbox */}
                <div className="flex items-start gap-2.5 py-1">
                  <input
                    id="agreement"
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors duration-150 cursor-pointer"
                  />
                  <label htmlFor="agreement" className="text-xs text-slate-500 font-semibold select-none leading-normal">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenPopup('privacy')}
                      className="text-emerald-600 font-bold hover:underline inline-block focus:outline-none font-sans"
                    >
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenPopup('terms')}
                      className="text-emerald-600 font-bold hover:underline inline-block focus:outline-none font-sans"
                    >
                      Terms of Agreement
                    </button>
                    . *
                  </label>
                </div>

                {/* Navigation & Submit */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="py-3 text-xs flex items-center justify-center gap-1.5"
                    disabled={isSubmitting || authLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="py-3 text-xs flex items-center justify-center gap-1.5"
                    isLoading={isSubmitting || authLoading}
                    disabled={!agreementChecked || isSubmitting || authLoading}
                  >
                    <span>Register & Sign In</span>
                  </Button>
                </div>
              </div>
            )}

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
                <span>Agreement required to complete registration</span>
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

      {/* Premium custom Signup loading screen overlay */}
      {(isSubmitting || authLoading) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm fade-in">
          <div className="bg-white border border-slate-100 p-8 rounded-3xl max-w-sm w-full mx-4 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.15)] flex flex-col items-center gap-5 text-center">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-50 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin"></div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold tracking-tight text-slate-800">
                Registering Profile
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
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
