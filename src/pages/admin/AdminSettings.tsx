import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, Sliders, Clock, Sun, Moon, Palette } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';

export const AdminSettings: React.FC = () => {
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
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
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Library System Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Configure municipal borrowing limits, operating hours, and automated circulation policies
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Loading library configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Circulation Policies Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Circulation & Borrowing Policies</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Define member borrowing duration, limits, and reservation limits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Borrowing Limit (Active Books per Member)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={settings.borrowing_limit}
                  onChange={(e) => setSettings({ ...settings, borrowing_limit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Standard default is 3 books active simultaneously.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Loan Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={settings.loan_duration_days}
                  onChange={(e) => setSettings({ ...settings, loan_duration_days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Number of days before an item is marked overdue (Standard: 14 days).</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Renewal Limit (Times Allowed per Loan)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  required
                  value={settings.renewal_limit}
                  onChange={(e) => setSettings({ ...settings, renewal_limit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Number of times a borrower can renew an active non-reserved loan.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Reservation Hold Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  required
                  value={settings.reservation_period_days}
                  onChange={(e) => setSettings({ ...settings, reservation_period_days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Days a returned reserved book is held before passing to the next user.</p>
              </div>
            </div>
          </div>

          {/* Operating Hours & Municipal Policy Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Operating Schedule & Policies</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Information displayed on the public landing page and receipts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Public Library Operating Hours
                </label>
                <input
                  type="text"
                  required
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Overdue Violation Policy Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.overdue_policy}
                  onChange={(e) => setSettings({ ...settings, overdue_policy: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* System Display & Appearance Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Palette className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Display & Appearance</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Customize theme mode and global font size scaling</p>
              </div>
            </div>

            {/* Theme Mode Toggle */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Theme Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'dark') toggleTheme();
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Light Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'light') toggleTheme();
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-400 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">Dark Mode</span>
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                System Font Size Scaling
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'small' as const, label: 'Small', desc: '14px • Compact View', badge: 'Aa' },
                  { id: 'medium' as const, label: 'Medium', desc: '16px • Default Standard', badge: 'Aa' },
                  { id: 'large' as const, label: 'Large', desc: '18px • High Readability', badge: 'Aa' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFontSize(item.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center ${
                      fontSize === item.id
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <span className={`font-black mb-1 ${
                      item.id === 'small' ? 'text-sm text-slate-600 dark:text-slate-400' :
                      item.id === 'large' ? 'text-2xl text-slate-800 dark:text-slate-100' :
                      'text-lg text-slate-700 dark:text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Live Font Size Preview</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                Current active scale: <strong className="text-emerald-600 dark:text-emerald-400 capitalize">{fontSize}</strong> ({theme === 'dark' ? 'Dark Mode' : 'Light Mode'}). All tables, forms, buttons, and navigation automatically adapt across the entire dashboard.
              </p>
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
