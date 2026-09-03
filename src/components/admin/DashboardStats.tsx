// src/components/admin/DashboardStats.tsx
import React from 'react';
import { 
  BookOpen, 
  Users, 
  Coins, 
  TrendingUp, 
  QrCode, 
  Inbox, 
  Bookmark,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Card from '../common/Card';

interface KPIProps {
  kpis: {
    total_books: number;
    total_members: number;
    active_loans: number;
    overdue_loans: number;
    unpaid_fines: number;
    paid_fines: number;
  };
  role?: string;
  attendance?: {
    total_today: number;
    currently_inside: number;
  };
  pendingRequestsCount?: number;
  pendingReservationsCount?: number;
}

export const DashboardStats: React.FC<KPIProps> = ({ 
  kpis, 
  role = 'superadmin',
  attendance = { total_today: 0, currently_inside: 0 },
  pendingRequestsCount = 0,
  pendingReservationsCount = 0
}) => {
  const isSuperAdmin = role === 'superadmin';

  function numberFormat(val: number) {
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }

  // Stat cards dynamically constructed per role
  const statCards = isSuperAdmin ? [
    {
      title: 'Total Catalog Stock',
      value: kpis.total_books,
      desc: 'Physical book copies cataloged',
      icon: BookOpen,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800',
    },
    {
      title: 'Registered Members',
      value: kpis.total_members,
      desc: 'Active patron & user accounts',
      icon: Users,
      colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-800',
    },
    {
      title: 'Active Checkouts',
      value: kpis.active_loans,
      desc: `${kpis.overdue_loans} loans currently overdue`,
      icon: TrendingUp,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800',
      badge: kpis.overdue_loans > 0 ? `${kpis.overdue_loans} Overdue` : null,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
      title: 'Collected Revenue',
      value: `₱${numberFormat(kpis.paid_fines)}`,
      desc: `₱${numberFormat(kpis.unpaid_fines)} unpaid fines`,
      icon: Coins,
      colorClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700',
      badge: kpis.unpaid_fines > 0 ? 'Fines Pending' : null,
      badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    },
    {
      title: 'Pending Approvals',
      value: pendingRequestsCount,
      desc: 'Acquisition & borrow proposals',
      icon: Inbox,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-800',
      badge: pendingRequestsCount > 0 ? 'Requires Review' : 'All Clear',
      badgeColor: pendingRequestsCount > 0 
        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
    },
    {
      title: "Today's Gate Visitors",
      value: attendance.total_today,
      desc: `${attendance.currently_inside} patrons inside right now`,
      icon: QrCode,
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-800',
      badge: attendance.currently_inside > 0 ? `${attendance.currently_inside} Inside` : null,
      badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }
  ] : [
    // Librarian / Staff focused cards
    {
      title: 'Active Checkouts',
      value: kpis.active_loans,
      desc: `${kpis.overdue_loans} loans currently overdue`,
      icon: TrendingUp,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800',
      badge: kpis.overdue_loans > 0 ? `${kpis.overdue_loans} Overdue` : null,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
      title: 'Available on Shelf',
      value: Math.max(0, kpis.total_books - kpis.active_loans),
      desc: `Out of ${kpis.total_books} total copies`,
      icon: BookOpen,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800',
      badge: 'Ready to Issue',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    {
      title: "Today's Attendance",
      value: attendance.total_today,
      desc: `${attendance.currently_inside} patrons currently inside`,
      icon: QrCode,
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-800',
      badge: 'Live Gate',
      badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Reservation Holds',
      value: pendingReservationsCount,
      desc: 'Holds awaiting shelf clearance',
      icon: Bookmark,
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800',
      badge: pendingReservationsCount > 0 ? 'Pending' : 'Fulfilled',
      badgeColor: pendingReservationsCount > 0
        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5`}>
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} hoverEffect className="relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl border ${card.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-slate-50 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="truncate pr-2">{card.desc}</span>
              {card.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${(card as any).badgeColor || 'bg-slate-100 text-slate-600'}`}>
                  {card.badge}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
