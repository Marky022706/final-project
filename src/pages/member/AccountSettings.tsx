// src/pages/member/AccountSettings.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User, 
  Shield, 
  Bell, 
  Palette, 
  AlertTriangle, 
  Camera, 
  Save, 
  Eye,
  EyeOff,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

type SettingsSection = 'profile' | 'security' | 'notifications' | 'theme' | 'danger';

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    middleName: user?.middle_name || '',
    lastName: user?.last_name || '',
    email: user?.email || ''
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    bookDueReminders: true,
    reservationUpdates: true,
    libraryAnnouncements: true,
    fineNotifications: true,
    systemUpdates: false
  });

  // Theme state
  const [themeSettings, setThemeSettings] = useState({
    themeMode: theme,
    accentColor: '#15803D',
    fontSize: 'medium',
    compactMode: false
  });

  const menuItems = [
    { id: 'profile' as SettingsSection, icon: User, label: 'Profile Details' },
    { id: 'security' as SettingsSection, icon: Shield, label: 'Security Credentials' },
    { id: 'notifications' as SettingsSection, icon: Bell, label: 'Notifications' },
    { id: 'theme' as SettingsSection, icon: Palette, label: 'Theme & Appearance' },
    { id: 'danger' as SettingsSection, icon: AlertTriangle, label: 'Danger Zone' },
  ];

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: Implement API call to save changes
    setHasChanges(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setProfile({
      firstName: user?.first_name || '',
      middleName: user?.middle_name || '',
      lastName: user?.last_name || '',
      email: user?.email || ''
    });
    setHasChanges(false);
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white border border-slate-200 rounded-full shadow-md hover:bg-slate-50 transition-colors">
            <Camera className="h-4 w-4 text-slate-600" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Profile Picture</h3>
          <p className="text-sm text-slate-500 mb-2">JPG, PNG or GIF. Max 2MB.</p>
          <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Change Photo
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => handleProfileChange('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Enter first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Middle Name <span className="text-slate-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={profile.middleName}
            onChange={(e) => handleProfileChange('middleName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Enter middle name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => handleProfileChange('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Enter last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="pb-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Enter new password"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            <div className="mt-2 flex gap-1">
              <div className="h-1 flex-1 bg-slate-200 rounded"></div>
              <div className="h-1 flex-1 bg-slate-200 rounded"></div>
              <div className="h-1 flex-1 bg-slate-200 rounded"></div>
              <div className="h-1 flex-1 bg-slate-200 rounded"></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Confirm new password"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            Update Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={security.twoFactorEnabled}
              onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Active Login Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Current Session</p>
                <p className="text-sm text-slate-500">Chrome on Windows • Active now</p>
              </div>
            </div>
          </div>
        </div>
        <button className="mt-4 px-6 py-2.5 border border-rose-300 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors">
          Sign Out From All Devices
        </button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
        { key: 'bookDueReminders', label: 'Book Due Reminders', desc: 'Get reminded before books are due' },
        { key: 'reservationUpdates', label: 'Reservation Updates', desc: 'Updates on your book reservations' },
        { key: 'libraryAnnouncements', label: 'Library Announcements', desc: 'News and announcements from the library' },
        { key: 'fineNotifications', label: 'Fine Notifications', desc: 'Alerts about unpaid fines' },
        { key: 'systemUpdates', label: 'System Updates', desc: 'Updates about system maintenance' },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <div>
            <p className="font-medium text-slate-800">{item.label}</p>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications[item.key as keyof typeof notifications]}
              onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderThemeSection = () => (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Theme Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                if (theme !== mode) toggleTheme();
              }}
              className={`p-4 border-2 rounded-xl transition-all ${
                theme === mode
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-center">
                <p className="font-medium text-slate-800 capitalize">{mode}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Accent Color</h3>
        <div className="flex gap-3">
          {['#15803D', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'].map((color) => (
            <button
              key={color}
              onClick={() => setThemeSettings({ ...themeSettings, accentColor: color })}
              className={`w-10 h-10 rounded-full transition-all ${
                themeSettings.accentColor === color ? 'ring-4 ring-offset-2 ring-slate-300' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Font Size</h3>
        <div className="flex gap-3">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setThemeSettings({ ...themeSettings, fontSize: size })}
              className={`px-4 py-2 border-2 rounded-xl transition-all ${
                themeSettings.fontSize === size
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium text-slate-800 capitalize ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : ''}`}>
                {size}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <p className="font-medium text-slate-800">Compact Mode</p>
          <p className="text-sm text-slate-500">Reduce spacing for more content</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={themeSettings.compactMode}
            onChange={(e) => setThemeSettings({ ...themeSettings, compactMode: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {/* Preview Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl">
        <p className="text-sm text-slate-500 mb-4">Preview</p>
        <div className={`p-4 bg-slate-50 rounded-lg ${themeSettings.compactMode ? 'space-y-2' : 'space-y-3'}`}>
          <p className={`font-semibold text-slate-800 ${themeSettings.fontSize === 'small' ? 'text-sm' : themeSettings.fontSize === 'large' ? 'text-lg' : ''}`}>
            Sample Card Title
          </p>
          <p className={`text-slate-600 ${themeSettings.fontSize === 'small' ? 'text-xs' : themeSettings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
            This is how your content will appear with the selected settings.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDangerZone = () => (
    <div className="border-2 border-rose-200 rounded-xl p-6 bg-rose-50/50">
      <h3 className="text-lg font-semibold text-rose-800 mb-2">Danger Zone</h3>
      <p className="text-sm text-rose-600 mb-6">These actions are irreversible. Please proceed with caution.</p>

      <div className="space-y-4">
        <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-rose-300 rounded-xl hover:bg-rose-50 transition-colors">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-slate-600" />
            <div className="text-left">
              <p className="font-medium text-slate-800">Download Personal Data</p>
              <p className="text-sm text-slate-500">Get a copy of all your data</p>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-rose-300 rounded-xl hover:bg-rose-50 transition-colors">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-slate-600" />
            <div className="text-left">
              <p className="font-medium text-slate-800">Remove Profile Picture</p>
              <p className="text-sm text-slate-500">Delete your current profile photo</p>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-rose-300 rounded-xl hover:bg-rose-50 transition-colors">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-slate-600" />
            <div className="text-left">
              <p className="font-medium text-slate-800">Reset Preferences</p>
              <p className="text-sm text-slate-500">Restore default settings</p>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between px-4 py-3 bg-rose-600 border border-rose-600 rounded-xl hover:bg-rose-700 transition-colors">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-white" />
            <div className="text-left">
              <p className="font-medium text-white">Delete Account</p>
              <p className="text-sm text-rose-100">Permanently delete your account</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Account Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your personal information, security settings, notification preferences, and application appearance.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all ${
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel - Content */}
        <div className="lg:col-span-3">
          {/* Section Content */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'security' && renderSecuritySection()}
            {activeSection === 'notifications' && renderNotificationsSection()}
            {activeSection === 'theme' && renderThemeSection()}
            {activeSection === 'danger' && renderDangerZone()}
          </div>
        </div>
      </div>

      {/* Sticky Save Button (only shows when there are changes) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl shadow-lg hover:bg-emerald-700 transition-all hover:scale-105"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
