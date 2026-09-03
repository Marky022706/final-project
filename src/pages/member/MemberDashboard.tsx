// src/pages/member/MemberDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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

const MemberDashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="flex flex-col justify-between h-44 p-6 bg-white border border-slate-100">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-3 w-32 rounded-full bg-slate-100" />
              <div className="h-9 w-16 rounded-lg bg-slate-100" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-100" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
            <div className="h-3 w-36 rounded-full bg-slate-100" />
            <div className="h-4 w-4 rounded-full bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 min-h-[320px] bg-white border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-slate-100" />
            <div className="h-3 w-52 rounded-full bg-slate-100" />
          </div>
          <div className="h-3 w-20 rounded-full bg-slate-100" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-16 w-12 rounded-lg bg-slate-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 rounded-full bg-slate-100" />
                  <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                  <div className="h-2.5 w-32 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="min-h-[320px] bg-white border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-3 w-40 rounded-full bg-slate-100" />
          </div>
          <div className="h-3 w-16 rounded-full bg-slate-100" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex gap-2.5 items-center p-2">
              <div className="h-11 w-9 rounded-lg bg-slate-100" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export const MemberDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [readyReservations, setReadyReservations] = useState<any[]>([]);
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
        const responseNew = await api.get('/books/getAll', { params: { limit: 5 } });
        if (responseNew.data && responseNew.data.success) {
          const booksData = Array.isArray(responseNew.data.data?.books)
            ? responseNew.data.data.books
            : (Array.isArray(responseNew.data.data) ? responseNew.data.data : []);
          setNewArrivals(booksData);
        }

        // Fetch ready reservations
        const responseRes = await api.get('/reservations/list', { params: { status: 'ready' } });
        if (responseRes.data && responseRes.data.success) {
          const resData = Array.isArray(responseRes.data.data) ? responseRes.data.data : [];
          setReadyReservations(resData);
        }

        // Sync stats and refresh listings
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

      {/* Ready Reservations Alert Banner */}
      {readyReservations.length > 0 && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4.5 flex gap-3 text-teal-700 animate-pulse-once">
          <BookMarked className="h-5.5 w-5.5 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-normal flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-slate-800">Reserved Book Now Available!</h4>
              <p className="font-semibold mt-0.5 text-teal-600">
                Excellent news! Your reserved book <span className="font-extrabold text-slate-700">"{readyReservations[0].title}"</span> by {readyReservations[0].author} is now available and currently held for you at the library desk.
              </p>
            </div>
            <Link to="/my-books" className="flex-shrink-0">
              <Button variant="primary" className="text-[10px] py-1.5 px-3 bg-teal-600 hover:bg-teal-700 border-teal-600 hover:border-teal-700 text-white font-bold h-auto shadow-md shadow-teal-100">
                Claim Held Copy
              </Button>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <MemberDashboardSkeleton />
      ) : (
        <>
      {/* Grid of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.link}>
              <Card hoverEffect className="flex flex-col justify-between h-44 p-6 bg-white border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                      {kpi.value}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl border ${kpi.color} flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-2 border-t border-slate-50 pt-3">
                  <span>{kpi.desc}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-500 transition-transform group-hover:translate-x-1" />
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
            {activeLoans.length === 0 ? (
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
                  <div key={loan.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {loan.cover_image && loan.cover_image.startsWith('http') ? (
                          <img src={loan.cover_image} alt={loan.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">{loan.title}</h5>
                        <p className="text-[11px] text-slate-500 font-semibold">Written by {loan.author} ({loan.year})</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ISBN: {loan.isbn}</p>
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
            {newArrivals.length === 0 ? (
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
        </>
      )}
    </div>
  );
};

export default MemberDashboard;
