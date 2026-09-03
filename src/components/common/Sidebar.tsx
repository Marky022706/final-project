// src/components/common/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/logo.png';
import { 
  LayoutDashboard, 
  Book, 
  BookMarked, 
  History, 
  Bell, 
  Users, 
  FileBarChart2, 
  CalendarClock, 
  Activity, 
  Inbox, 
  Globe, 
  QrCode, 
  Repeat,
  ChevronDown,
  PanelLeft,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuSection {
  id: string;
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';

  // Categorized Navigation sections based on role
  let menuSections: MenuSection[] = [];

  if (isSuperAdmin) {
    menuSections = [
      {
        id: 'overview',
        title: 'Overview',
        items: [
          { label: 'Super Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        ]
      },
      {
        id: 'circulation',
        title: 'Circulation & Books',
        items: [
          { label: 'Book Management', path: '/admin/books', icon: Book },
          { label: 'Circulation', path: '/admin/transactions', icon: Repeat },
          { label: 'Reservation Management', path: '/admin/reservations', icon: CalendarClock },
          { label: 'Attendance Management', path: '/admin/attendance', icon: QrCode },
        ]
      },
      {
        id: 'users',
        title: 'Users & Requests',
        items: [
          { label: 'Member Management', path: '/admin/users', icon: Users },
          { label: 'Request Center', path: '/admin/requests', icon: Inbox },
        ]
      },
      {
        id: 'analytics',
        title: 'Analytics & Audit',
        items: [
          { label: 'Reports & Analytics', path: '/admin/reports', icon: FileBarChart2 },
          { label: 'Activity Logs', path: '/admin/activity-log', icon: Activity },
        ]
      },

    ];
  } else if (isAdmin) {
    menuSections = [
      {
        id: 'overview',
        title: 'Overview',
        items: [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        ]
      },
      {
        id: 'circulation',
        title: 'Circulation & Books',
        items: [
          { label: 'Book Inventory', path: '/admin/books', icon: Book },
          { label: 'Circulation', path: '/admin/transactions', icon: Repeat },
          { label: 'Reservations', path: '/admin/reservations', icon: CalendarClock },
          { label: 'Attendance & QR', path: '/admin/attendance', icon: QrCode },
        ]
      },
      {
        id: 'users',
        title: 'Requests & Services',
        items: [
          { label: 'Request Center', path: '/admin/requests', icon: Inbox },
        ]
      },
      {
        id: 'reports',
        title: 'Reports & Analytics',
        items: [
          { label: 'Reports & Analytics', path: '/admin/reports', icon: FileBarChart2 },
        ]
      }
    ];
  } else {
    // Member Navigation
    menuSections = [
      {
        id: 'main',
        title: 'Main',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Book Catalog', path: '/catalog', icon: Book },
        ]
      },
      {
        id: 'my-library',
        title: 'My Library',
        items: [
          { label: 'My Borrowed Books', path: '/my-books', icon: BookMarked },
          { label: 'Borrowing History', path: '/history', icon: History },
        ]
      },
      {
        id: 'digital',
        title: 'Digital & Updates',
        items: [
          { label: 'Digital Library', path: '/digital-library', icon: Globe },
          { label: 'Activity History', path: '/activity-history', icon: Activity },
          { label: 'Notifications', path: '/notifications', icon: Bell },
        ]
      }
    ];
  }

  // State to track expanded section IDs (all open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuSections.forEach(s => {
      initial[s.id] = true;
    });
    return initial;
  });

  // Auto-expand section when current route changes
  useEffect(() => {
    menuSections.forEach(section => {
      const hasActiveChild = section.items.some(item => location.pathname.startsWith(item.path));
      if (hasActiveChild) {
        setOpenSections(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-gradient-to-b from-primary-950 to-primary-900 text-slate-100 border-r border-primary-950 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Drawer Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-primary-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-white/10 p-0.5 border border-emerald-500/20">
              <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Balingasag Library
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PanelLeft className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">
                  Navigation Drawer
                </span>
              </div>
            </div>
          </div>

          {/* Mobile close drawer trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg lg:hidden transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto scrollbar-thin">
          {menuSections.map((section) => {
            const isExpanded = openSections[section.id] !== false;

            return (
              <div key={section.id} className="space-y-1">
                {/* Collapsible Category Header Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors select-none rounded-lg hover:bg-white/5"
                >
                  <span>{section.title}</span>
                  <ChevronDown 
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0 text-emerald-400' : '-rotate-90 text-slate-500'
                    }`} 
                  />
                </button>

                {/* Section Links (Collapsible) */}
                {isExpanded && (
                  <div className="space-y-0.5 animate-fade-in pl-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                              isActive
                                ? 'bg-emerald-700 text-white shadow-md shadow-primary-950/20 border border-emerald-500/20 font-bold'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
