// src/pages/admin/AdminFines.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import { Calendar, User, CheckCircle2 } from 'lucide-react';

export const AdminFines: React.FC = () => {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const response = await api.get('/fines/list', {
        params: { status: filterStatus || undefined }
      });
      if (response.data && response.data.success) {
        setFines(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load system fines registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [filterStatus]);

  const handleSettle = async (fine: any, action: 'pay' | 'waive') => {
    const actionLabel = action === 'pay' ? 'RECORD CASH PAYMENT' : 'WAIVE PENALTY FEE';
    if (!confirm(`Are you sure you want to ${actionLabel} of ₱${parseFloat(fine.amount).toFixed(2)} for ${fine.first_name} ${fine.last_name}?`)) {
      return;
    }

    setActionLoadingId(fine.id);
    try {
      const response = await api.post('/fines/pay', {
        fine_id: fine.fine_id,
        action
      });
      if (response.data && response.data.success) {
        fetchFines();
        alert(response.data.message || 'Fine successfully settled!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to settle fine card.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      header: 'Fine Card ID',
      accessor: (row: any) => <span className="font-mono text-xs font-bold text-slate-400 select-all">{row.fine_id}</span>,
      sortable: true,
      sortKey: 'fine_id'
    },
    {
      header: 'Member Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <div>
            <p className="font-bold text-slate-700 leading-snug">{row.first_name} {row.last_name}</p>
            <p className="text-[9px] text-slate-400 font-semibold">{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'last_name'
    },
    {
      header: 'Book title',
      accessor: (row: any) => (
        <div className="max-w-[150px] truncate font-semibold text-xs text-slate-700" title={row.book_title}>
          {row.book_title}
        </div>
      ),
      sortable: true,
      sortKey: 'book_title'
    },
    {
      header: 'Fine Amount',
      accessor: (row: any) => <span className="text-xs font-extrabold text-slate-800">₱{parseFloat(row.amount).toFixed(2)}</span>,
      sortable: true,
      sortKey: 'amount'
    },
    {
      header: 'Settlement Status',
      accessor: (row: any) => {
        const isUnpaid = row.status === 'unpaid';
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isUnpaid 
              ? 'bg-rose-50 text-rose-500 border-rose-100 animate-pulse' 
              : row.status === 'waived' 
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {row.status}
          </span>
        );
      },
      sortable: true,
      sortKey: 'status'
    },
    {
      header: 'Dates',
      accessor: (row: any) => (
        <div className="space-y-0.5 text-[10px] text-slate-400 font-semibold">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Issued: {new Date(row.created_at).toLocaleDateString()}
          </p>
          {row.paid_date && (
            <p className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" />
              Paid: {new Date(row.paid_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        if (row.status !== 'unpaid') {
          return (
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Settled
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoadingId === row.id}
              onClick={() => handleSettle(row, 'pay')}
              className="text-[10px] py-1.5 px-2.5"
            >
              Collect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isLoading={actionLoadingId === row.id}
              onClick={() => handleSettle(row, 'waive')}
              className="text-[10px] py-1.5 px-2.5 border border-slate-200 hover:bg-slate-50"
            >
              Waive
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Fines Collection desk
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Collect member overdue fine payments, waive historical fees, and print audit reports
          </p>
        </div>

        {/* Dynamic Filters */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 text-xs font-bold text-slate-600 appearance-none cursor-pointer"
          >
            <option value="">All Fines Cards</option>
            <option value="unpaid">Unpaid Outstanding</option>
            <option value="paid">Paid Settlements</option>
            <option value="waived">Waived Charges</option>
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">▼</span>
        </div>
      </div>

      {/* Table grid */}
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
          data={fines}
          searchPlaceholder="Query registry by member name, fine card..."
          searchField={(row) => `${row.first_name} ${row.last_name} ${row.fine_id}`}
          initialSortKey="created_at"
          itemsPerPage={10}
        />
      )}
    </div>
  );
};

export default AdminFines;
