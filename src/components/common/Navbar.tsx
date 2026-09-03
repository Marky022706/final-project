import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { 
  Menu, 
  Bell, 
  Check, 
  BookOpen, 
  AlertTriangle, 
  LogOut, 
  ChevronRight, 
  Home, 
  LayoutDashboard,
  Search
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import UserAccountDropdown from './UserAccountDropdown';

interface NavbarProps {
  onMenuToggle: () => void;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const getBreadcrumbs = (pathname: string, role?: string): BreadcrumbItem[] => {
  const isAdmin = role === 'admin' || pathname.startsWith('/admin');

  if (isAdmin) {
    const rootItem: BreadcrumbItem = { label: 'Admin', path: '/admin/dashboard', icon: Home };

    switch (pathname) {
      case '/admin/dashboard':
        return [rootItem, { label: 'Dashboard', icon: LayoutDashboard }];
      case '/admin/books':
        return [rootItem, { label: 'Book Inventory' }];
      case '/admin/archived-books':
        return [rootItem, { label: 'Book Inventory', path: '/admin/books' }, { label: 'Archive Books' }];
      case '/admin/users':
        return [rootItem, { label: 'Member Directory' }];
      case '/admin/transactions':
      case '/admin/circulation':
        return [rootItem, { label: 'Circulation' }];
      case '/admin/reservations':
        return [rootItem, { label: 'Reservations' }];
      case '/admin/fines':
        return [rootItem, { label: 'Fines Management' }];
      case '/admin/reports':
        return [rootItem, { label: 'Reports & Analytics' }];
      case '/admin/attendance':
        return [rootItem, { label: 'Attendance Records' }];
      case '/admin/activity-log':
        return [rootItem, { label: 'Activity Logs' }];
      case '/admin/qr-scan':
        return [rootItem, { label: 'QR Attendance Scan' }];
      default: {
        const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
        const dynamicItems: BreadcrumbItem[] = [rootItem];
        let accumulatedPath = '/admin';
        segments.forEach((seg, index) => {
          accumulatedPath += `/${seg}`;
          const formatted = seg
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          dynamicItems.push({
            label: formatted,
            path: index === segments.length - 1 ? undefined : accumulatedPath
          });
        });
        return dynamicItems.length > 1 ? dynamicItems : [rootItem, { label: 'Dashboard' }];
      }
    }
  }

  // Member / User breadcrumbs
  const memberRoot: BreadcrumbItem = { label: 'Portal', path: '/dashboard', icon: Home };
  switch (pathname) {
    case '/dashboard':
      return [memberRoot, { label: 'Dashboard', icon: LayoutDashboard }];
    case '/catalog':
      return [memberRoot, { label: 'Book Catalog' }];
    case '/my-books':
      return [memberRoot, { label: 'My Borrowed Books' }];
    case '/history':
      return [memberRoot, { label: 'Borrowing History' }];
    case '/fines':
      return [memberRoot, { label: 'My Fines & Dues' }];
    case '/notifications':
      return [memberRoot, { label: 'Notifications' }];
    case '/profile':
      return [memberRoot, { label: 'My Profile' }];
    case '/account-settings':
      return [memberRoot, { label: 'Account Settings' }];
    default: {
      const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
      const dynamicItems: BreadcrumbItem[] = [memberRoot];
      let accumulatedPath = '';
      segments.forEach((seg, index) => {
        accumulatedPath += `/${seg}`;
        const formatted = seg
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        dynamicItems.push({
          label: formatted,
          path: index === segments.length - 1 ? undefined : accumulatedPath
        });
      });
      return dynamicItems;
    }
  }
};

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, refreshProfile, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumbs(location.pathname, user?.role);

  // Sync notifications unread count on startup and click
  const fetchNotifications = async () => {
    const token = localStorage.getItem('balingasag_access_token');
    if (!user || !token) return;
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
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(fetchNotifications, 60000); // Check every 60s
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [user]);

  // Handle clicking outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

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
    <header className="sticky top-0 z-40 flex items-center justify-between h-20 md:h-24 px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-slate-950/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl lg:hidden focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center">
          <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const Icon = crumb.icon;
              return (
                <li key={idx} className="flex items-center gap-1.5 sm:gap-2">
                  {idx > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                  {crumb.path && !isLast ? (
                    <Link
                      to={crumb.path}
                      className="group flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />}
                      <span className="truncate max-w-[120px] sm:max-w-none">{crumb.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {Icon && <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      <span className="truncate max-w-[160px] sm:max-w-none">{crumb.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Interactive Quick Search / Command Palette Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl transition-all group interactive-btn"
          title="Search books, commands & pages (Ctrl+K)"
        >
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          <span className="hidden md:inline">Quick Search...</span>
          <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              fetchNotifications();
            }}
            className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-[360px] h-[180px] aspect-[2/1] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/80 dark:shadow-slate-950/80 rounded-2xl overflow-hidden animate-fade-in z-50 flex flex-col justify-between">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-800 flex-shrink-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 min-h-0">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                    <Check className="h-6 w-6 text-emerald-400 mb-1" />
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`flex gap-2.5 px-4 py-2.5 transition-colors ${n.is_read ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/45 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {n.type === 'overdue' ? (
                          <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{n.title}</p>
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 px-1.5 py-0.5 rounded transition-colors flex-shrink-0 focus:outline-none"
                              title="Mark as read"
                            >
                              Read
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 line-clamp-1">
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
                className="block text-center py-2.5 border-t border-slate-50 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Modern User Account Dropdown */}
        <UserAccountDropdown onLogoutClick={handleLogout} />
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-8 text-center animate-fade-in z-10 space-y-5 overflow-hidden">
            {/* Icon */}
            <div className="p-4 bg-rose-500 text-white rounded-2xl w-16 h-16 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/25">
              <LogOut className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Confirm Logout
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Are you sure you want to end your current session? You'll need your card credentials to sign back into Balingasag Library.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-5 py-3 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
