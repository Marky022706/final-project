// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardStats from '../../components/admin/DashboardStats';
import ReportsChart from '../../components/admin/ReportsChart';
import OverdueChart from '../../components/admin/OverdueChart';
import Card from '../../components/common/Card';
import { AlertTriangle, Library, ShieldAlert, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="h-36 bg-white border border-slate-100">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-3 w-28 rounded-full bg-slate-100" />
              <div className="h-8 w-20 rounded-lg bg-slate-100" />
              <div className="h-3 w-36 rounded-full bg-slate-100" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-80 bg-white border border-slate-100">
        <div className="h-4 w-40 rounded-full bg-slate-100 mb-6" />
        <div className="flex h-56 items-end gap-3">
          {[48, 72, 56, 88, 64, 96, 76].map((height, idx) => (
            <div key={idx} className="flex-1 rounded-t-xl bg-slate-100" style={{ height }} />
          ))}
        </div>
      </Card>
      <Card className="h-80 bg-white border border-slate-100">
        <div className="h-4 w-44 rounded-full bg-slate-100 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 h-[340px] bg-white border border-slate-100">
        <div className="h-4 w-36 rounded-full bg-slate-100 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded-xl bg-slate-100" />
          ))}
        </div>
      </Card>
      <Card className="h-[340px] bg-white border border-slate-100">
        <div className="h-4 w-32 rounded-full bg-slate-100 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-3/4 rounded-full bg-slate-100" />
                <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
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
  
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [topBorrowedBooks, setTopBorrowedBooks] = useState<any[]>([]);
  const [recentOverdue, setRecentOverdue] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        // Parallel queries to maximize loading performance
        const [resKpis, resMostBorrowed, resOverdueTxns] = await Promise.all([
          api.get('/reports/overdue-stats'),
          api.get('/reports/most-borrowed'),
          api.get('/transactions/list', { params: { status: 'overdue' } })
        ]);

        if (resKpis.data && resKpis.data.success) {
          setKpis(resKpis.data.data.kpis);
          setMonthlyRevenue(resKpis.data.data.monthly_revenue);
        }

        if (resMostBorrowed.data && resMostBorrowed.data.success) {
          setCategoryDistribution(resMostBorrowed.data.data.categories);
          setTopBorrowedBooks(resMostBorrowed.data.data.books);
        }

        if (resOverdueTxns.data && resOverdueTxns.data.success) {
          setRecentOverdue(resOverdueTxns.data.data.slice(0, 5)); // Show top 5 recent overdue
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
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Library Administration Desk
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Track catalog health, active transactions, fines collections, and systems metrics
          </p>
        </div>
      </div>

      {loading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
          {/* DashboardStats component */}
          <DashboardStats kpis={kpis} />

          {/* Graphical Data Trends */}
          <ReportsChart categoriesData={categoryDistribution} booksData={topBorrowedBooks} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue curve chart */}
            <div className="lg:col-span-2">
              <OverdueChart revenueData={monthlyRevenue} />
            </div>

            {/* Overdue Borrowers lists */}
            <Card className="flex flex-col h-[340px]">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-rose-600">
                    <ShieldAlert className="h-4.5 w-4.5" />
                    <span>Urgent Overdues</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Borrowers exceeding loan duration</p>
                </div>
                <Link to="/admin/transactions?status=overdue" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  View All
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                {recentOverdue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 text-center">
                    <Library className="h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700">All books checked in</p>
                    <p className="text-[9px] text-slate-400">Zero active overdue borrows!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentOverdue.map((loan) => (
                      <div key={loan.id} className="py-2.5 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 truncate leading-snug">
                            {loan.first_name} {loan.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                            Book: {loan.title}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </p>
                          {loan.phone && (
                            <p className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center justify-end gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {loan.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
