// src/pages/admin/AdminTransactions.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Calendar, BookOpen, User, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const toast = useToast();

  // --- Return Confirmation Modal State ---
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetLoan, setReturnTargetLoan] = useState<any>(null);
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/list', {
        params: { status: filterStatus || undefined }
      });
      if (response.data && response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to query system transactions logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterStatus]);

  // --- Open Return Confirmation Modal ---
  const openReturnModal = (loan: any) => {
    setReturnTargetLoan(loan);
    setReturnModalOpen(true);
  };

  const confirmManualReturn = async () => {
    if (!returnTargetLoan) return;
    setReturnLoading(true);
    try {
      const response = await api.post('/transactions/return', {
        transaction_id: returnTargetLoan.transaction_id
      });
      if (response.data && response.data.success) {
        fetchTransactions();
        toast.success(response.data.message || 'Book checked in successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete book return checkout.');
    } finally {
      setReturnLoading(false);
      setReturnModalOpen(false);
      setReturnTargetLoan(null);
    }
  };

  // --- Derived modal values ---
  const loanTitle = returnTargetLoan?.title || '';
  const loanMember = returnTargetLoan ? `${returnTargetLoan.first_name} ${returnTargetLoan.last_name}` : '';
  const isOverdue = returnTargetLoan?.status === 'overdue';

  const columns = [
    {
      header: 'Transaction ID',
      accessor: (row: any) => <span className="font-mono text-xs font-bold text-slate-400 select-all">{row.transaction_id}</span>,
      sortable: true,
      sortKey: 'transaction_id'
    },
    {
      header: 'Member / Account',
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
      header: 'Book borrowed',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="font-bold text-slate-700 leading-snug truncate max-w-[160px]" title={row.title}>
            {row.title}
          </p>
        </div>
      ),
      sortable: true,
      sortKey: 'title'
    },
    {
      header: 'Checkout / Due Dates',
      accessor: (row: any) => (
        <div className="space-y-0.5 text-xs text-slate-500 font-semibold">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            Out: {new Date(row.borrow_date).toLocaleDateString()}
          </p>
          <p className={`flex items-center gap-1 font-bold ${row.status === 'overdue' ? 'text-rose-500' : ''}`}>
            <Calendar className="h-3 w-3 text-slate-400" />
            Due: {new Date(row.due_date).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
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
      sortKey: 'status'
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        if (row.status === 'completed') {
          return (
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
              <CheckCircle className="h-3.5 w-3.5 text-slate-300" />
              Returned
            </span>
          );
        }
        return (
          <Button
            variant={row.status === 'overdue' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => openReturnModal(row)}
            className="text-[10px] py-1.5 px-3"
            title="Mark this book copy as returned by the member"
          >
            Process Return
          </Button>
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
            System Borrowing Logs
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Track historical loans, verify deadlines, and process manual check-ins
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

      {/* Main registry Table */}
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
          data={transactions}
          searchPlaceholder="Query logs by borrower, book title, txn id..."
          searchField={(row) => `${row.first_name} ${row.last_name} ${row.title} ${row.transaction_id}`}
          initialSortKey="borrow_date"
          itemsPerPage={10}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          PROCESS RETURN CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setReturnTargetLoan(null); }}
        title="Confirm Return Processing"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setReturnModalOpen(false); setReturnTargetLoan(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmManualReturn}
              disabled={returnLoading}
              className={`h-11 px-5 text-xs font-bold text-white border-transparent ${
                isOverdue
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {returnLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Proceed'
              )}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          {/* Icon */}
          <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${
            isOverdue
              ? 'bg-rose-50 border-rose-100'
              : 'bg-emerald-50 border-emerald-100'
          }`}>
            <RotateCcw className={`h-7 w-7 ${isOverdue ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>

          {/* Prompt */}
          <div>
            <p className="text-sm font-bold text-slate-800 leading-snug">
              Confirm manual checkout return processing for
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-1">
              "{loanTitle}"
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              borrowed by member <span className="font-extrabold text-slate-900">{loanMember}</span>?
            </p>
          </div>

          {/* Warning / Info Callout */}
          <div className={`flex items-start gap-2.5 border rounded-xl p-3 text-left w-full ${
            isOverdue
              ? 'bg-rose-50/80 border-rose-100'
              : 'bg-amber-50/80 border-amber-100'
          }`}>
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
              isOverdue ? 'text-rose-500' : 'text-amber-500'
            }`} />
            <p className={`text-[11px] font-semibold leading-relaxed ${
              isOverdue ? 'text-rose-700' : 'text-amber-700'
            }`}>
              {isOverdue
                ? 'This loan is overdue. Processing this return may trigger applicable late fees for the borrower.'
                : 'This action will mark the book as returned and make the copy available for other members to borrow.'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTransactions;
