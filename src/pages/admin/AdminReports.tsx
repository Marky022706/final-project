// src/pages/admin/AdminReports.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import ReportsChart from '../../components/admin/ReportsChart';
import OverdueChart from '../../components/admin/OverdueChart';
import Card from '../../components/common/Card';
import { Coins, TrendingUp, BookOpen, Users } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchDetailedReports = async () => {
      setLoading(true);
      try {
        const [resKpis, resMostBorrowed] = await Promise.all([
          api.get('/reports/overdue-stats'),
          api.get('/reports/most-borrowed')
        ]);

        if (resKpis.data && resKpis.data.success) {
          setKpis(resKpis.data.data.kpis);
          setMonthlyRevenue(resKpis.data.data.monthly_revenue);
        }

        if (resMostBorrowed.data && resMostBorrowed.data.success) {
          setCategoryDistribution(resMostBorrowed.data.data.categories);
          setTopBorrowedBooks(resMostBorrowed.data.data.books);
        }
      } catch (err) {
        console.error('Failed to compile dynamic analytics reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailedReports();
  }, []);

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          Dynamic System Analytics
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Check out library performance reports, category statistics, and revenue projections
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Detailed stats grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Book Stock</span>
                <span className="text-base font-extrabold text-slate-800">{kpis.total_books} Physical Copies</span>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-800 border border-teal-100 flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
                <span className="text-base font-extrabold text-slate-800">{kpis.total_members} Registered Cardholders</span>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Checkouts</span>
                <span className="text-base font-extrabold text-slate-800">{kpis.active_loans} Loan records ({kpis.overdue_loans} late)</span>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0">
                <Coins className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue Settle</span>
                <span className="text-base font-extrabold text-slate-800">{formatCurrency(kpis.paid_fines)} Collected</span>
              </div>
            </Card>
          </div>

          {/* Graphics Distribution */}
          <ReportsChart categoriesData={categoryDistribution} booksData={topBorrowedBooks} />

          {/* Line revenue area chart */}
          <OverdueChart revenueData={monthlyRevenue} />
        </>
      )}
    </div>
  );
};

export default AdminReports;
