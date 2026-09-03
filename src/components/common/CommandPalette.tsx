// src/components/common/CommandPalette.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Book,
  LayoutDashboard,
  BookmarkCheck,
  History,
  FileText,
  Settings,
  Sun,
  Moon,
  Type,
  Users,
  QrCode,
  Inbox,
  LogOut,
  Sparkles,
  ArrowRight,
  X,
  Library
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Quick Actions' | 'Books & Catalog' | 'Preferences';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bookResults, setBookResults] = useState<any[]>([]);

  const { user, logout } = useAuth();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Listen for Ctrl+K or Cmd+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isControlled && controlledOnClose) {
          if (isOpen) controlledOnClose();
        } else {
          setInternalIsOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    const handleCustomOpen = () => {
      if (!isControlled) {
        setInternalIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen, isControlled, controlledOnClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live search books when query length >= 2
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setBookResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get('/books', {
          params: { search: query.trim(), limit: 5 }
        });
        if (response.data && response.data.data) {
          const list = Array.isArray(response.data.data)
            ? response.data.data
            : response.data.data.data || [];
          setBookResults(list.slice(0, 5));
        }
      } catch (err) {
        // silent fail on fast search
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Static Action Items
  const staticItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];

    // Navigation Items
    if (isAdmin) {
      items.push(
        {
          id: 'nav-admin-dashboard',
          title: 'Admin Dashboard',
          subtitle: 'Overview statistics & municipal circulation metrics',
          category: 'Navigation',
          icon: LayoutDashboard,
          action: () => { navigate('/admin/dashboard'); handleClose(); },
          keywords: ['home', 'stats', 'analytics', 'overview']
        },
        {
          id: 'nav-admin-books',
          title: 'Book Inventory & Catalog Management',
          subtitle: 'Add new books, manage copies, edit metadata & QR codes',
          category: 'Navigation',
          icon: Book,
          action: () => { navigate('/admin/books'); handleClose(); },
          keywords: ['catalog', 'books', 'inventory', 'isbn']
        },
        ...(user?.role === 'superadmin' ? [{
          id: 'nav-admin-users',
          title: 'Member & Patron Management',
          subtitle: 'Manage cardholders, approval verification & roles',
          category: 'Navigation' as const,
          icon: Users,
          action: () => { navigate('/admin/users'); handleClose(); },
          keywords: ['users', 'members', 'accounts', 'patrons']
        }] : []),
        {
          id: 'nav-admin-attendance',
          title: 'Live QR Scanner & Circulation Desk',
          subtitle: 'Scan library cards and quick book check-in/out',
          category: 'Navigation',
          icon: QrCode,
          action: () => { navigate('/admin/attendance'); handleClose(); },
          keywords: ['scanner', 'attendance', 'check in', 'borrow', 'return']
        },
        {
          id: 'nav-admin-requests',
          title: 'Acquisition & Digital Requests',
          subtitle: 'Review member book purchase proposals and holds',
          category: 'Navigation',
          icon: Inbox,
          action: () => { navigate('/admin/requests'); handleClose(); },
          keywords: ['requests', 'proposals', 'holds']
        },

      );
    } else {
      items.push(
        {
          id: 'nav-member-dashboard',
          title: 'Member Dashboard',
          subtitle: 'Your active loans, digital card & recommendations',
          category: 'Navigation',
          icon: LayoutDashboard,
          action: () => { navigate('/member/dashboard'); handleClose(); },
          keywords: ['home', 'overview', 'main']
        },
        {
          id: 'nav-member-catalog',
          title: 'Browse Public Catalog',
          subtitle: 'Search and reserve available books in the library',
          category: 'Navigation',
          icon: Library,
          action: () => { navigate('/member/catalog'); handleClose(); },
          keywords: ['books', 'search', 'borrow', 'reserve', 'find']
        },
        {
          id: 'nav-member-my-books',
          title: 'My Active Loans & Holds',
          subtitle: 'View your borrowed titles, due dates and return receipts',
          category: 'Navigation',
          icon: BookmarkCheck,
          action: () => { navigate('/member/my-books'); handleClose(); },
          keywords: ['borrowed', 'loans', 'due date', 'renew']
        },
        {
          id: 'nav-member-history',
          title: 'Borrowing Timeline & History',
          subtitle: 'Complete reading log and circulation archive',
          category: 'Navigation',
          icon: History,
          action: () => { navigate('/member/history'); handleClose(); },
          keywords: ['history', 'timeline', 'past', 'records']
        },
        {
          id: 'nav-member-digital',
          title: 'Digital Monograph Library',
          subtitle: 'Read digitized public documents & manuscripts',
          category: 'Navigation',
          icon: FileText,
          action: () => { navigate('/member/digital-library'); handleClose(); },
          keywords: ['digital', 'pdf', 'reader', 'online']
        },
        {
          id: 'nav-member-settings',
          title: 'Account & Preference Settings',
          subtitle: 'Update profile, font scaling & notification options',
          category: 'Navigation',
          icon: Settings,
          action: () => { navigate('/member/settings'); handleClose(); },
          keywords: ['profile', 'account', 'security', 'preferences']
        }
      );
    }

    // Quick System Actions & Preferences
    items.push(
      {
        id: 'action-theme-toggle',
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        subtitle: `Currently using ${theme === 'dark' ? 'Dark' : 'Light'} theme`,
        category: 'Preferences',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          toggleTheme();
          toast.success(`Theme switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
          handleClose();
        },
        keywords: ['dark', 'light', 'theme', 'color', 'mode', 'appearance']
      },
      {
        id: 'action-font-small',
        title: 'Font Size: Small (14px)',
        subtitle: 'Compact typography layout scale',
        category: 'Preferences',
        icon: Type,
        action: () => {
          setFontSize('small');
          toast.info('System font size set to Small (14px)');
          handleClose();
        },
        keywords: ['font', 'text', 'size', 'small', 'scale']
      },
      {
        id: 'action-font-medium',
        title: 'Font Size: Medium (16px - Default)',
        subtitle: 'Standard typography layout scale',
        category: 'Preferences',
        icon: Type,
        action: () => {
          setFontSize('medium');
          toast.info('System font size set to Medium (16px)');
          handleClose();
        },
        keywords: ['font', 'text', 'size', 'medium', 'default']
      },
      {
        id: 'action-font-large',
        title: 'Font Size: Large (18px)',
        subtitle: 'High readability typography scale',
        category: 'Preferences',
        icon: Type,
        action: () => {
          setFontSize('large');
          toast.info('System font size set to Large (18px)');
          handleClose();
        },
        keywords: ['font', 'text', 'size', 'large', 'big']
      },
      {
        id: 'action-logout',
        title: 'Sign Out of System',
        subtitle: `Logged in as ${user?.first_name || 'User'} (${user?.role || 'Member'})`,
        category: 'Quick Actions',
        icon: LogOut,
        action: () => {
          logout();
          toast.info('Signed out successfully.');
          handleClose();
        },
        keywords: ['logout', 'signout', 'exit', 'leave']
      }
    );

    return items;
  }, [isAdmin, theme, toggleTheme, fontSize, setFontSize, user, navigate, logout, toast]);

  // Filtered items based on query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return staticItems;

    return staticItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchCat || matchKeywords;
    });
  }, [staticItems, query]);

  // Combine static filtered items with dynamic book results
  const allResults: (CommandItem | { isBook: true; book: any })[] = useMemo(() => {
    const combined: (CommandItem | { isBook: true; book: any })[] = [...filteredItems];
    if (bookResults.length > 0) {
      bookResults.forEach((b) => {
        combined.push({ isBook: true, book: b });
      });
    }
    return combined;
  }, [filteredItems, bookResults]);

  // Keep selected index in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allResults[selectedIndex];
      if (current) {
        if ('isBook' in current) {
          navigate(isAdmin ? '/admin/books' : '/member/catalog');
          handleClose();
        } else {
          current.action();
        }
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center p-4 sm:p-6 md:pt-20 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      {/* Backdrop click outside */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Command Palette Modal Box */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden z-10 animate-scale-up"
        onKeyDown={handleKeyDownList}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search books, or jump to page... (e.g. 'catalog', 'dark mode')"
            className="flex-1 bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base font-semibold focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg text-slate-400 text-xs"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-mono font-bold">
            <span>ESC</span>
          </div>
        </div>

        {/* Results / Navigation List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {allResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching commands or books found</p>
              <p className="text-xs text-slate-400">Try searching for keywords like "books", "theme", "history", or book titles.</p>
            </div>
          ) : (
            <>
              {/* Commands & Pages */}
              {allResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if ('isBook' in item) {
                  const book = item.book;
                  return (
                    <button
                      key={`book-${book.id}`}
                      type="button"
                      onClick={() => {
                        navigate(isAdmin ? '/admin/books' : '/member/catalog');
                        handleClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <Book className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                            by {book.author} • {book.category || 'General'} • ISBN: {book.isbn || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex-shrink-0 ml-2">
                        Book Catalog
                      </span>
                    </button>
                  );
                }

                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                        isSelected
                          ? 'bg-emerald-600 text-white scale-105 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-bold truncate">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
                        {item.category}
                      </span>
                      <ArrowRight className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        isSelected ? 'translate-x-1 text-emerald-600 dark:text-emerald-400' : 'opacity-0'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">↵</kbd>
              <span>to select</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Balingasag Library Quick Command</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
