// src/components/common/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { Menu, Bell, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, refreshProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync notifications unread count on startup and click
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/get');
      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications.slice(0, 4)); // Show top 4
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to load quick notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [user]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const response = await api.post('/notifications/get?action=mark_read', { id });
      if (response.data && response.data.success) {
        fetchNotifications();
        refreshProfile();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-35 flex items-center justify-between h-24 px-6 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl lg:hidden focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none mb-1.5">
            Balingasag Municipal Portal
          </h2>
          <p className="text-xs text-slate-500 font-semibold">Welcome back, {user.first_name}!</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Clock preview */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold capitalize tracking-wide animate-pulse">
            Municipal Server Active
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              fetchNotifications();
            }}
            className="relative p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-80.5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl shadow-slate-200/80 rounded-2xl overflow-hidden animate-fade-in z-50">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Check className="h-8 w-8 text-emerald-400 mb-2.5" />
                    <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                    <p className="text-[10px] text-slate-400 mt-1">No unread library alerts.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`flex gap-3 px-5 py-3.5 transition-colors ${n.is_read ? 'bg-white' : 'bg-slate-50/45 hover:bg-slate-50'}`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'overdue' ? (
                          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-xs font-bold text-slate-700 truncate">{n.title}</p>
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                              title="Mark as read"
                            >
                              Read
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                to="/notifications"
                onClick={() => setDropdownOpen(false)}
                className="block text-center py-3.5 border-t border-slate-50 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
