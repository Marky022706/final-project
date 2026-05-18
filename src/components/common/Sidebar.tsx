// src/components/common/Sidebar.tsx
import React from 'react';
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
  ListOrdered
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Navigation schema based on user role
  const menuItems = isAdmin
    ? [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Book Inventory', path: '/admin/books', icon: BookOpen },
        { label: 'Member Directory', path: '/admin/users', icon: Users },
        { label: 'Borrow Logs', path: '/admin/transactions', icon: ListOrdered },
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
    if (confirm('Are you sure you want to log out from Balingasag Public Library?')) {
      logout();
    }
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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64.5 bg-gradient-to-b from-primary-950 to-primary-900 text-slate-100 border-r border-primary-950 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-primary-900/60">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden">
            <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              Balingasag Municipal
            </h1>
            <p className="text-xs text-emerald-400 font-medium">Public Library</p>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
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
        <div className="p-4 border-t border-primary-900/60 space-y-3">
          <NavLink 
            to="/profile" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold group-hover:bg-emerald-600/30 transition-colors">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[10px] text-emerald-400 capitalize font-medium tracking-wide">
                {user.role} Member
              </p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/10 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
