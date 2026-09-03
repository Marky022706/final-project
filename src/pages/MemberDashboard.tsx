// src/pages/MemberDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  BookMarked, 
  Wallet, 
  Bell, 
  History, 
  Calendar, 
  AlertTriangle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MemberDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch active loans
        const responseLoans = await api.get('/transactions/list', { params: { status: 'active' } });
        if (responseLoans.data && responseLoans.data.success) {
          const loansData = Array.isArray(responseLoans.data.data) ? responseLoans.data.data : [];
          setActiveLoans(loansData.slice(0, 3));
        }

        // Fetch new book arrivals
        const responseNew = await api.get('/books/getAll', { params: { limit: 3 } });
        if (responseNew.data && responseNew.data.success) {
          const booksData = Array.isArray(responseNew.data.data?.books)
            ? responseNew.data.data.books
            : (Array.isArray(responseNew.data.data) ? responseNew.data.data : []);
          setNewArrivals(booksData);
        }

        // Sync fresh profile stats
        await refreshProfile();
      } catch (err) {
        console.error('Failed to load member dashboard info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (!user) return null;

  const stats = user.stats || {
    active_loans: 0,
    total_loans: 0,
    unpaid_fines: 0.00,
    unread_notifications: 0,
  };

  const dashboardKPIs = [
    {
      title: 'Current Active Checkouts',
      value: stats.active_loans,
      desc: 'Books checked out currently',
      icon: BookMarked,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/my-books',
    },
    {
      title: 'Outstanding Late Fines',
      value: `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(stats.unpaid_fines)}`,
      desc: 'Accumulated overdue fines due',
      icon: Wallet,
      color: stats.unpaid_fines > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-100',
      link: '/fines',
    },
    {
      title: 'Unread Notifications',
      value: stats.unread_notifications,
      desc: 'Urgent system messages',
      icon: Bell,
      color: stats.unread_notifications > 0 ? 'text-amber-600 bg-amber-50 border-amber-100 animate-pulse' : 'text-slate-500 bg-slate-50 border-slate-100',
      link: '/notifications',
    },
    {
      title: 'Cumulative Loans',
      value: stats.total_loans,
      desc: 'Your historical borrowings count',
      icon: History,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      link: '/history',
    },
  ];

  // Check if any loan is currently overdue
  const hasOverdueLoans = activeLoans.some(loan => loan.status === 'overdue');

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          Member Dashboard
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Check out system alerts, statistics, and book returns deadlines
        </p>
      </div>

      {/* Critical Overdue Alert Banner */}
      {hasOverdueLoans && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4.5 flex gap-3 text-rose-700 animate-pulse">
          <AlertTriangle className="h-5.5 w-5.5 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-normal">
            <h4 className="font-extrabold">Outstanding Overdue Loans Warning!</h4>
            <p className="font-semibold mt-0.5 text-rose-600">
              One or more of your active book loans has expired past the due date. Please return these copies immediately to the Municipal Desk to avoid incremental overdue charges of <span className="font-bold">₱5.00/day</span>.
            </p>
          </div>
        </div>
      )}

      {/* Grid of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.link}>
              <Card hoverEffect className="flex flex-col justify-between h-36">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                      {kpi.value}
                    </h3>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-2 border-t border-slate-50 pt-2">
                  <span>{kpi.desc}</span>
                  <ArrowRight className="h-3 w-3 text-emerald-500 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently Borrowed Books Panel */}
        <Card className="lg:col-span-2 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">My Active Loans</h4>
              <p className="text-[10px] text-slate-400">Current checkout copies and returns timers</p>
            </div>
            <Link to="/my-books" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Manage Active
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-14 bg-slate-100 rounded-xl" />
                <div className="h-14 bg-slate-100 rounded-xl" />
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <BookOpen className="h-10 w-10 text-slate-300 mb-2.5" />
                <p className="text-xs font-semibold text-slate-500">No active book loans</p>
                <p className="text-[10px] text-slate-400 max-w-xs text-center mt-1">
                  Browse the catalog and borrow books to see checkout statuses here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-9 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {loan.cover_image && loan.cover_image.startsWith('http') ? (
                          <img src={loan.cover_image} alt={loan.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 leading-snug line-clamp-1">{loan.title}</h5>
                        <p className="text-[10px] text-slate-400">ISBN: {loan.isbn}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        loan.status === 'overdue' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        Due {new Date(loan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Dynamic New Arrivals Suggestions */}
        <Card className="flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">New Arrivals</h4>
              <p className="text-[10px] text-slate-400">Newly cataloged titles on our shelves</p>
            </div>
            <Link to="/catalog" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Browse All
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-between space-y-4">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-lg" />
                <div className="h-10 bg-slate-100 rounded-lg" />
              </div>
            ) : newArrivals.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-xs font-semibold">
                No recent arrivals cataloged.
              </div>
            ) : (
              <div className="space-y-3">
                {newArrivals.map((book) => (
                  <div key={book.id} className="flex gap-2.5 items-center p-2 rounded-xl hover:bg-slate-50/70 border border-transparent hover:border-slate-100 transition-all">
                    <div className="h-11 w-8.5 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {book.cover_image && book.cover_image.startsWith('http') ? (
                        <img src={book.cover_image} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-4.5 w-4.5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 leading-snug truncate">{book.title}</p>
                      <p className="text-[9px] text-slate-400 truncate">By {book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/catalog">
              <Button variant="secondary" className="w-full text-xs py-2.5">
                Explore Full Catalog
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberDashboard;
