// src/pages/admin/AdminSettings.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, Sliders, Clock } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    borrowing_limit: '3',
    loan_duration_days: '14',
    renewal_limit: '1',
    reservation_period_days: '3',
    operating_hours: 'Monday - Friday: 8:00 AM - 5:00 PM',
    overdue_policy: 'Daily notifications and borrowing freeze until overdue items are returned.',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/settings/get');
      if (response.data && response.data.success) {
        const raw = response.data.data;
        setSettings({
          borrowing_limit: raw.borrowing_limit?.value || '3',
          loan_duration_days: raw.loan_duration_days?.value || '14',
          renewal_limit: raw.renewal_limit?.value || '1',
          reservation_period_days: raw.reservation_period_days?.value || '3',
          operating_hours: raw.operating_hours?.value || 'Monday - Friday: 8:00 AM - 5:00 PM',
          overdue_policy: raw.overdue_policy?.value || 'Daily notifications and borrowing freeze until returned.',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {};
      Object.entries(settings).forEach(([key, val]) => {
        payload[key] = { value: val };
      });

      const response = await api.post('/settings/update', { settings: payload });
      if (response.data && response.data.success) {
        setSuccessMsg('System configuration policies saved successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Library System Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Configure municipal borrowing limits, operating hours, and automated circulation policies
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading library configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Circulation Policies Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Sliders className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Circulation & Borrowing Policies</h3>
                <p className="text-xs text-slate-400 font-medium">Define member borrowing duration, limits, and reservation limits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Borrowing Limit (Active Books per Member)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={settings.borrowing_limit}
                  onChange={(e) => setSettings({ ...settings, borrowing_limit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 font-medium">Standard default is 3 books active simultaneously.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Loan Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={settings.loan_duration_days}
                  onChange={(e) => setSettings({ ...settings, loan_duration_days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 font-medium">Number of days before an item is marked overdue (Standard: 14 days).</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Renewal Limit (Times Allowed per Loan)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  required
                  value={settings.renewal_limit}
                  onChange={(e) => setSettings({ ...settings, renewal_limit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 font-medium">Number of times a borrower can renew an active non-reserved loan.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reservation Hold Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  required
                  value={settings.reservation_period_days}
                  onChange={(e) => setSettings({ ...settings, reservation_period_days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 font-medium">Days a returned reserved book is held before passing to the next user.</p>
              </div>
            </div>
          </div>

          {/* Operating Hours & Municipal Policy Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Clock className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Operating Schedule & Policies</h3>
                <p className="text-xs text-slate-400 font-medium">Information displayed on the public landing page and receipts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Public Library Operating Hours
                </label>
                <input
                  type="text"
                  required
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Overdue Violation Policy Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.overdue_policy}
                  onChange={(e) => setSettings({ ...settings, overdue_policy: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              className="px-8 py-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <Save className="h-4 w-4" />
              <span>Save System Settings</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
