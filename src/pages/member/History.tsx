// src/pages/member/History.tsx
import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/common/DataTable';
import { Calendar, BookOpen } from 'lucide-react';

export const History: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('');
  const { data: transactions, loading, execute } = useFetch<any[]>('/transactions/list', false);

  useEffect(() => {
    execute(filterStatus ? { status: filterStatus } : undefined);
  }, [filterStatus, execute]);

  const columns = [
    {
      header: 'Book details',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-7.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-center flex-shrink-0">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-4.5 w-4.5 text-slate-300" />
            )}
          </div>
          <div>
            <p className="font-bold text-slate-700 leading-snug line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">ISBN: {row.isbn}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Checkout Date',
      accessor: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-semibold">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {new Date(row.borrow_date).toLocaleDateString()}
        </span>
      ),
      sortable: true,
      sortKey: 'borrow_date',
    },
    {
      header: 'Return Date',
      accessor: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-semibold">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {row.return_date ? new Date(row.return_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Loan Status',
      accessor: (row: any) => {
        const statuses = {
          active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          overdue: 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse',
          completed: 'bg-slate-50 text-slate-500 border-slate-100',
        };
        const statusMap = row.status as keyof typeof statuses;
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold capitalize ${statuses[statusMap] || ''}`}>
            {row.status}
          </span>
        );
      },
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Late Fine Charge',
      accessor: (row: any) => {
        if (!row.fine_amount) return <span className="text-xs text-slate-400">—</span>;
        
        const isPaid = row.fine_status === 'paid';
        return (
          <div className="space-y-0.5">
            <span className={`text-xs font-bold ${isPaid ? 'text-slate-500' : 'text-rose-600'}`}>
              ₱{Number(row.fine_amount).toFixed(2)}
            </span>
            <span className={`block text-[9px] font-bold uppercase tracking-wider ${isPaid ? 'text-emerald-600' : 'text-rose-500'}`}>
              {row.fine_status}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Borrowing History
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Explore complete logs of past book transactions and outstanding charges
          </p>
        </div>

        {/* Dynamic Filters */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 text-xs font-bold text-slate-600 appearance-none cursor-pointer"
          >
            <option value="">All Transactions Logs</option>
            <option value="active">Active Checkouts</option>
            <option value="overdue">Overdue Loans</option>
            <option value="completed">Completed Returns</option>
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">▼</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={transactions || []}
          searchPlaceholder="Filter history by title, status..."
          searchField={(row) => `${row.title} ${row.status}`}
          initialSortKey="borrow_date"
          itemsPerPage={8}
        />
      )}
    </div>
  );
};

export default History;
