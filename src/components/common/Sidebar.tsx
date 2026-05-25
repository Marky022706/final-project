// src/components/common/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/logo.png';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookMarked, 
  History, 
  Wallet, 
  Bell, 
  LogOut,
  Users,
  FileBarChart2,
  ListOrdered,
  Archive,
  CalendarClock
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Navigation schema based on user role
  const menuItems = isAdmin
    ? [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Book Inventory', path: '/admin/books', icon: BookOpen },
        { label: 'Archive Books', path: '/admin/archived-books', icon: Archive },
        { label: 'Member Directory', path: '/admin/users', icon: Users },
        { label: 'Borrow Logs', path: '/admin/transactions', icon: ListOrdered },
        { label: 'Reservations', path: '/admin/reservations', icon: CalendarClock },
        { label: 'Fines Management', path: '/admin/fines', icon: Wallet },
        { label: 'Reports & Analytics', path: '/admin/reports', icon: FileBarChart2 },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Book Catalog', path: '/catalog', icon: BookOpen },
        { label: 'My Borrowed Books', path: '/my-books', icon: BookMarked },
        { label: 'Borrowing History', path: '/history', icon: History },
        { label: 'My Fines & Dues', path: '/fines', icon: Wallet },
        { label: 'Notifications', path: '/notifications', icon: Bell },
      ];

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-gradient-to-b from-primary-950 to-primary-900 text-slate-100 border-r border-primary-950 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-900/60">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden">
            <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">
              Balingasag Municipal
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium leading-none mt-0.5">Public Library</p>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-700/80 text-white shadow-md shadow-primary-950/20 border border-emerald-500/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-primary-900/60 space-y-2">
          <NavLink 
            to="/profile" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold group-hover:bg-emerald-600/30 transition-colors text-xs">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[9px] text-emerald-400 capitalize font-medium tracking-wide">
                {user.role} Member
              </p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-bold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/10 transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Premium custom Logout confirmation dialog modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          {/* Modal Card Window */}
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl p-6 text-center animate-fade-in z-10 space-y-4">
            {/* Pulsing warning log-out icon */}
            <div className="p-3.5 bg-rose-50 text-rose-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-rose-100/50 animate-pulse">
              <LogOut className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight Outfit">
                Do you really want to Log out?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Are you sure you want to end your current session? You will need your card credentials to sign back into Balingasag Library.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2.5">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
