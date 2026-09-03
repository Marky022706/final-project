// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardStats from '../../components/admin/DashboardStats';
import ReportsChart from '../../components/admin/ReportsChart';
import { 
  AlertTriangle, 
  Library, 
  ShieldAlert, 
  Phone, 
  ArrowUpRight,
  LayoutDashboard,
  QrCode,
  PlusCircle,
  Users,
  Repeat,
  FileBarChart2,
  Activity,
  Inbox,
  Bookmark,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardSkeleton: React.FC<{ isSuperAdmin?: boolean }> = ({ isSuperAdmin }) => (
  <div className="space-y-6 animate-pulse">
    {/* Stats cards skeleton */}
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
      {Array.from({ length: isSuperAdmin ? 6 : 4 }).map((_, idx) => (
        <div key={idx} className="h-[104px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-6 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[420px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
        <div className="h-4 w-40 rounded-full bg-slate-100 dark:bg-slate-800 mb-6" />
        <div className="flex h-[320px] items-end justify-center">
          <div className="h-48 w-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800" />
        </div>
      </div>
      <div className="h-[420px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
        <div className="h-4 w-44 rounded-full bg-slate-100 dark:bg-slate-800 mb-6" />
        <div className="flex h-[300px] items-end gap-3 justify-center">
          {[48, 72, 56, 88, 64].map((height, idx) => (
            <div key={idx} className="flex-1 rounded-t-xl bg-slate-100 dark:bg-slate-800" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [kpis, setKpis] = useState({
    total_books: 0,
    total_members: 0,
    active_loans: 0,
    overdue_loans: 0,
    unpaid_fines: 0.00,
    paid_fines: 0.00
  });
  
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [topBorrowedBooks, setTopBorrowedBooks] = useState<any[]>([]);
  const [recentOverdue, setRecentOverdue] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ total_today: 0, currently_inside: 0 });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingReservations, setPendingReservations] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const [
          resKpis, 
          resMostBorrowed, 
          resOverdueTxns,
          resAttendance,
          resRequests,
          resReservations
        ] = await Promise.allSettled([
          api.get('/reports/overdue-stats'),
          api.get('/reports/most-borrowed'),
          api.get('/transactions/list', { params: { status: 'overdue' } }),
          api.get('/attendance/stats'),
          api.get('/requests/list', { params: { status: 'pending' } }),
          api.get('/reservations/list', { params: { status: 'pending' } })
        ]);

        if (resKpis.status === 'fulfilled' && resKpis.value.data?.success) {
          setKpis(resKpis.value.data.data.kpis);
        }

        if (resMostBorrowed.status === 'fulfilled' && resMostBorrowed.value.data?.success) {
          setCategoryDistribution(resMostBorrowed.value.data.data.categories || []);
          setTopBorrowedBooks(resMostBorrowed.value.data.data.books || []);
        }

        if (resOverdueTxns.status === 'fulfilled' && resOverdueTxns.value.data?.success) {
          setRecentOverdue(resOverdueTxns.value.data.data.slice(0, 6));
        }

        if (resAttendance.status === 'fulfilled' && resAttendance.value.data?.success) {
          setAttendance(resAttendance.value.data.data);
        }

        if (resRequests.status === 'fulfilled' && resRequests.value.data?.success) {
          const raw = resRequests.value.data.data;
          const list = Array.isArray(raw) ? raw : raw?.requests || [];
          setPendingRequests(list.slice(0, 5));
        }

        if (resReservations.status === 'fulfilled' && resReservations.value.data?.success) {
          setPendingReservations(resReservations.value.data.data.slice(0, 5));
        }

      } catch (err) {
        console.error('Failed to load administrative analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6 fade-in text-left max-w-[1600px] mx-auto pb-14">
      {/* Header Banner - Dynamic per role */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl text-white flex items-center justify-center shadow-lg flex-shrink-0 ${
            isSuperAdmin 
              ? 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 shadow-emerald-900/20' 
              : 'bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 shadow-blue-900/20'
          }`}>
            {isSuperAdmin ? <LayoutDashboard className="h-7 w-7" /> : <Library className="h-7 w-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isSuperAdmin 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                <Sparkles className="h-3 w-3" />
                {isSuperAdmin ? 'Super Administrator Executive' : 'Librarian & Circulation Desk'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                • Welcome, {user?.first_name || 'Staff'} {user?.last_name || ''}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {isSuperAdmin ? 'Executive Super Dashboard' : 'Librarian Operations Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {isSuperAdmin 
                ? 'Municipal library oversight, system administration, patron analytics, and revenue streams'
                : 'Front-desk book check-in/out, live patron holds, catalog management, and gate attendance'
              }
            </p>
          </div>
        </div>

        {/* Dynamic Quick Action Shortcuts based on role */}
        <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
          {isSuperAdmin ? (
            <>
              <Link to="/admin/users">
                <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>Members</span>
                </button>
              </Link>
              <Link to="/admin/transactions">
                <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-950/20 active:scale-95 transition-all">
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Circulation</span>
                </button>
              </Link>
              <Link to="/admin/reports">
                <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95">
                  <FileBarChart2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Reports</span>
                </button>
              </Link>
              <Link to="/admin/activity-log">
                <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95">
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  <span>Logs</span>
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/admin/transactions">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                  <Repeat className="h-4 w-4" />
                  <span>Circulation Desk</span>
                </button>
              </Link>
              <Link to="/admin/attendance">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                  <QrCode className="h-4 w-4" />
                  <span>QR Attendance</span>
                </button>
              </Link>
              <Link to="/admin/books">
                <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95">
                  <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
                  <span>Catalog Book</span>
                </button>
              </Link>
              <Link to="/admin/requests">
                <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95">
                  <Inbox className="h-3.5 w-3.5 text-slate-500" />
                  <span>Requests</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <AdminDashboardSkeleton isSuperAdmin={isSuperAdmin} />
      ) : (
        <>
          {/* Dynamic KPI Stats Row */}
          <DashboardStats 
            kpis={kpis} 
            role={user?.role}
            attendance={attendance}
            pendingRequestsCount={pendingRequests.length}
            pendingReservationsCount={pendingReservations.length}
          />

          {/* Graphical Analytics (Categories Distribution & Top Borrowed Books) */}
          <ReportsChart categoriesData={categoryDistribution} booksData={topBorrowedBooks} />
          
          {/* Role-Specific Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left Panel: Urgent Overdues Ledger */}
            <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h4 className="text-base font-extrabold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="h-5 w-5" />
                    <span>Urgent Overdue Borrowers</span>
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Patrons with unreturned books past due date</p>
                </div>
                <Link to="/admin/transactions" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2.5 pr-1">
                {recentOverdue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <Library className="h-10 w-10 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Zero Overdue Records</p>
                    <p className="text-xs text-slate-400">All books currently in circulation are within valid loan terms.</p>
                  </div>
                ) : (
                  recentOverdue.map((loan) => (
                    <div 
                      key={loan.id} 
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                          {loan.first_name} {loan.last_name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">
                          Book: <strong className="text-slate-700 dark:text-slate-300">{loan.title}</strong>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </span>
                        {loan.phone && (
                          <p className="text-[10px] text-slate-400 font-mono font-bold flex items-center justify-end gap-1">
                            <Phone className="h-3 w-3" />
                            {loan.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Role-Specific Action Center */}
            {isSuperAdmin ? (
              /* SUPERADMIN: Pending Approvals & Requests Center */
              <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div>
                    <h4 className="text-base font-extrabold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Inbox className="h-5 w-5" />
                      <span>Pending Requests & Approvals ({pendingRequests.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Acquisitions, archives, and borrowing authorizations</p>
                  </div>
                  <Link to="/admin/requests" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <span>Review All</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2.5 pr-1">
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                      <CheckCircle2 className="h-10 w-10 text-indigo-500 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Pending Requests</p>
                      <p className="text-xs text-slate-400">All member proposals and requests have been processed.</p>
                    </div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div 
                        key={req.id || req.request_id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                            {req.user_name || 'Member'} • <span className="capitalize text-indigo-600 dark:text-indigo-400">{req.type || 'Request'}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">
                            {req.title || req.book_title || req.reason || 'Pending review'}
                          </p>
                        </div>

                        <Link to="/admin/requests" className="flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-all">
                            Decision
                          </span>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* LIBRARIAN / ADMIN: Active Reservation Holds Queue */
              <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div>
                    <h4 className="text-base font-extrabold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Bookmark className="h-5 w-5" />
                      <span>Pending Reservation Holds ({pendingReservations.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Patrons in queue awaiting shelf retrieval</p>
                  </div>
                  <Link to="/admin/reservations" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                    <span>Manage Holds</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2.5 pr-1">
                  {pendingReservations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                      <Bookmark className="h-10 w-10 text-purple-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Hold Queues</p>
                      <p className="text-xs text-slate-400">All book hold requests have been prepared for pickup.</p>
                    </div>
                  ) : (
                    pendingReservations.map((res, idx) => (
                      <div 
                        key={res.id || res.reservation_id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                            {res.user_name || 'Patron'} • <strong className="text-purple-600 dark:text-purple-400">{res.title}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">
                            Reserved: {res.reservation_date || 'Today'}
                          </p>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex-shrink-0">
                          Queue #{idx + 1}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
