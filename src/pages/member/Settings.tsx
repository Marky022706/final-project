import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { 
  Moon, 
  Sun, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut,
  Bell,
  Shield,
  Save,
  Type
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [contactSettings, setContactSettings] = useState({
    phone: user?.phone || '',
    address: user?.address || '',
    email: user?.email || ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });
  const [saving, setSaving] = useState(false);

  const handleContactSave = async () => {
    setSaving(true);
    // TODO: Implement API call to update contact settings
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight leading-none mb-1">
          Settings
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            {theme === 'light' ? <Sun className="h-5 w-5 text-purple-600 dark:text-purple-400" /> : <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Appearance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred theme</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (theme === 'dark') toggleTheme();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Sun className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Light</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (theme === 'light') toggleTheme();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Dark</span>
          </button>
        </div>
      </div>

      {/* Font Size Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Type className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">System Font Size</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the font size across the entire system for optimal readability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'small' as const, label: 'Small', sizeDesc: '14px • Compact', badgeText: 'Aa' },
            { id: 'medium' as const, label: 'Medium', sizeDesc: '16px • Default', badgeText: 'Aa' },
            { id: 'large' as const, label: 'Large', sizeDesc: '18px • Readable', badgeText: 'Aa' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFontSize(item.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center ${
                fontSize === item.id
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20 shadow-sm ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <span className={`font-black mb-1 ${
                item.id === 'small' ? 'text-sm text-slate-600 dark:text-slate-400' :
                item.id === 'large' ? 'text-2xl text-slate-800 dark:text-slate-100' :
                'text-lg text-slate-700 dark:text-slate-200'
              }`}>
                {item.badgeText}
              </span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {item.label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {item.sizeDesc}
              </span>
            </button>
          ))}
        </div>

        {/* Live Font Preview Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Live Preview</p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            The Balingasag Municipal Library system font size is currently set to <strong className="text-emerald-600 dark:text-emerald-400 capitalize">{fontSize}</strong>. All tables, text, buttons, and navigation adapt automatically.
          </p>
        </div>
      </div>

      {/* Contact Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Contact Information</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Update your contact details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={contactSettings.email}
                onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="tel"
                value={contactSettings.phone}
                onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <textarea
                value={contactSettings.address}
                onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
                placeholder="Your full address"
              />
            </div>
          </div>

          <button
            onClick={handleContactSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notification Preferences</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage how you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Email Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">SMS Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive text messages</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Push Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Browser notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
            <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Account Actions</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl p-6 text-center animate-fade-in z-10 space-y-4">
            <div className="p-3.5 bg-rose-50 text-rose-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-rose-100/50 animate-pulse">
              <LogOut className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Do you really want to Log out?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Are you sure you want to end your current session? You will need your card credentials to sign back into Balingasag Library.
              </p>
            </div>

            <div className="flex gap-3 pt-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Settings;
