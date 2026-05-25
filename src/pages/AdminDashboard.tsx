// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import DashboardStats from '../components/admin/DashboardStats';
import ReportsChart from '../components/admin/ReportsChart';
import OverdueChart from '../components/admin/OverdueChart';
import Card from '../components/common/Card';
import { AlertTriangle, Library, ShieldAlert, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold text-slate-500">Compiling library system states...</span>
        </div>
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
                  <h4 className="text-base font-bold flex items-center gap-1.5 text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                    <span>Urgent Overdues</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">Borrowers exceeding loan duration</p>
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
