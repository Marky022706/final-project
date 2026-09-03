// src/components/common/UserAccountDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Shield, 
  Moon, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

interface UserAccountDropdownProps {
  onLogoutClick?: () => void;
}

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({ onLogoutClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!user) return null;

  // Format initials and display names
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || 'Master Administrator';
  const initials = `${firstName.charAt(0) || 'M'}${lastName.charAt(0) || 'A'}`.toUpperCase();

  const formattedRole = user.role === 'superadmin' 
    ? 'Super Admin' 
    : (user.role === 'admin' ? 'Librarian Admin' : 'Member');

  const handleLogoutAction = () => {
    setIsOpen(false);
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all duration-150 focus:outline-none select-none group"
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        {/* Circular green avatar with initials */}
        <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm ring-2 ring-emerald-600/20 group-hover:scale-105 transition-transform">
          {initials}
        </div>

        {/* User Name */}
        <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">
          {displayName}
        </span>

        {/* Small downward chevron */}
        <ChevronDown 
          className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`} 
        />
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2.5 w-[290px] sm:w-[310px] bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-scale-up"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Profile Header */}
          <div className="p-4.5 bg-gradient-to-b from-slate-50/80 via-white to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              {/* Large circular green avatar */}
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base font-black shadow-md shadow-emerald-900/20 shrink-0">
                {initials}
              </div>

              <div className="min-w-0 flex-1 text-left">
                {/* Full Name */}
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                  {displayName}
                </h4>

                {/* Email */}
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">
                  {user.email || 'admin@balingasag.gov.ph'}
                </p>

                {/* Status row: Green dot, Online, separator dot, Role */}
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
                  <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">{formattedRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-0.5 text-left">
            {/* 1. My Profile */}
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 rounded-xl transition-colors duration-150"
            >
              <User className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" strokeWidth={2} />
              <span>My Profile</span>
            </Link>

            {/* 2. Account Settings */}
            <Link
              to="/account-settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 rounded-xl transition-colors duration-150"
            >
              <Settings className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={2} />
              <span>Account Settings</span>
            </Link>

            {/* 3. Security */}
            <Link
              to="/account-settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 rounded-xl transition-colors duration-150"
            >
              <Shield className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={2} />
              <span>Security</span>
            </Link>

            {/* Subtle Divider */}
            <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

            {/* 4. Dark Mode with Toggle */}
            <div className="flex items-center justify-between px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors select-none">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-slate-400 dark:text-purple-400 shrink-0" strokeWidth={2} />
                <span>Dark Mode</span>
              </div>
              
              {/* Compact Toggle Switch */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={theme === 'dark'}
                aria-label="Toggle dark mode"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Help Center */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsHelpOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 rounded-xl transition-colors duration-150"
            >
              <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={2} />
              <span>Help Center</span>
            </button>

            {/* 6. Terms & Privacy */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsTermsOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 rounded-xl transition-colors duration-150"
            >
              <FileText className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={2} />
              <span>Terms & Privacy</span>
            </button>

            {/* Subtle Divider */}
            <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

            {/* 7. Logout (Danger State) */}
            <button
              type="button"
              onClick={handleLogoutAction}
              className="w-full flex items-center gap-3 px-3.5 h-11 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0" strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Help Center Simple Modal */}
      {isHelpOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Library Assistance Center</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Balingasag Municipal Public Library</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Need technical support or assistance with book circulation? Contact the library administrator at <span className="font-bold text-slate-800 dark:text-slate-100">admin@balingasag.gov.ph</span> or visit the municipal desk during library operating hours.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Terms & Privacy Simple Modal */}
      {isTermsOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Terms & Privacy Policy</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Republic Act 10173 & Municipal Guidelines</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All member account information and library borrowing records are protected in compliance with the Data Privacy Act of 2012. Library resources must be returned in accordance with loan policies.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Understood
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserAccountDropdown;
