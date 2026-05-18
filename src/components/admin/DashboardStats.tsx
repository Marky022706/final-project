// src/components/admin/DashboardStats.tsx
import React from 'react';
import { BookOpen, Users, Coins, TrendingUp } from 'lucide-react';
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
}

export const DashboardStats: React.FC<KPIProps> = ({ kpis }) => {
  const statCards = [
    {
      title: 'Total Catalog Stock',
      value: kpis.total_books,
      desc: 'Total physical copies cataloged',
      icon: BookOpen,
      colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Registered Members',
      value: kpis.total_members,
      desc: 'Active library card accounts',
      icon: Users,
      colorClass: 'text-primary-850 text-emerald-800 bg-teal-50 border-teal-100',
    },
    {
      title: 'Active Checkouts',
      value: kpis.active_loans,
      desc: `${kpis.overdue_loans} loans currently overdue`,
      icon: TrendingUp,
      colorClass: 'text-amber-600 bg-amber-50 border-amber-100',
      badge: kpis.overdue_loans > 0 ? `${kpis.overdue_loans} Overdue` : null,
    },
    {
      title: 'Total Outstanding Fines',
      value: `₱${numberFormat(kpis.unpaid_fines)}`,
      desc: `₱${numberFormat(kpis.paid_fines)} collected historically`,
      icon: Coins,
      colorClass: 'text-rose-600 bg-rose-50 border-rose-100',
      badge: kpis.unpaid_fines > 0 ? 'Pending Collection' : null,
    },
  ];

  function numberFormat(val: number) {
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} hoverEffect className="relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl border ${card.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3 text-xs text-slate-500 font-semibold">
              <span>{card.desc}</span>
              {card.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  card.title.includes('Fines') 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
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
