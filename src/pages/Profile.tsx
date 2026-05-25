// src/pages/Profile.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { User, Phone, MapPin, Mail, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
      });
      setSuccess('Your profile contact details have been successfully updated!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile details.');
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      {/* Dynamic Profile info Summary panel */}
      <div className="space-y-6">
        <Card className="flex flex-col items-center text-center p-8 bg-white border border-slate-100">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white shadow-xl shadow-emerald-100 flex items-center justify-center text-white text-3xl font-extrabold select-none">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-600 border border-white text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-xs text-slate-400 capitalize font-semibold tracking-wide">
              {user.role} Cardholder
            </p>
          </div>

          {/* Quick contact list */}
          <div className="w-full text-xs font-semibold text-slate-500 space-y-3.5 border-t border-slate-50 mt-6 pt-5 text-left">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="truncate">{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{user.phone || 'No phone cataloged'}</span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="truncate">{user.address || 'No address cataloged'}</span>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-50 pt-3.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Member Since {user.member_since ? new Date(user.member_since).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Form Canvas */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">
              Modify Contact Settings
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Keep your contact details fresh to guarantee book loan pick-up approvals
            </p>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <User className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Email (Read-only for security!) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Library Card Email (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed text-sm font-semibold"
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm"
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="text-xs px-6 py-2.5 self-end"
              isLoading={isSubmitting}
            >
              Apply Settings Edits
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
