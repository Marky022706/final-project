// src/pages/admin/AdminReservations.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import {
  BookMarked,
  Clock,
  CheckCircle,
  XCircle,
  PackageCheck,
  Bell,
  CalendarDays,
  BookOpen,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface Reservation {
  id: number;
  reservation_id: string;
  user_id: number;
  book_id: number;
  reservation_date: string;
  status: 'pending' | 'ready' | 'completed' | 'cancelled';
  notified: boolean;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  author: string;
  isbn: string;
  cover_image: string;
  category: string;
  year: number;
  available_copies: number;
  queue_position: number;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  pending: { 
    bg: 'bg-amber-50 dark:bg-amber-950/40', 
    text: 'text-amber-700 dark:text-amber-300', 
    border: 'border-amber-200 dark:border-amber-800', 
    icon: Clock, 
    label: 'Pending Queue' 
  },
  ready: { 
    bg: 'bg-emerald-50 dark:bg-emerald-950/40', 
    text: 'text-emerald-700 dark:text-emerald-300', 
    border: 'border-emerald-200 dark:border-emerald-800', 
    icon: PackageCheck, 
    label: 'Ready for Pickup' 
  },
  completed: { 
    bg: 'bg-slate-100 dark:bg-slate-800', 
    text: 'text-slate-600 dark:text-slate-300', 
    border: 'border-slate-200 dark:border-slate-700', 
    icon: CheckCircle, 
    label: 'Completed' 
  },
  cancelled: { 
    bg: 'bg-rose-50 dark:bg-rose-950/40', 
    text: 'text-rose-600 dark:text-rose-300', 
    border: 'border-rose-200 dark:border-rose-800', 
    icon: XCircle, 
    label: 'Cancelled' 
  }
};

export const AdminReservations: React.FC = () => {
  const toast = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    reservation: Reservation;
    action: 'ready' | 'completed' | 'cancelled';
  } | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reservations/list');
      if (response.data && response.data.success) {
        setReservations(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleUpdateStatus = async (reservationId: number, newStatus: string) => {
    setActionLoading(reservationId);
    try {
      const response = await api.post('/reservations/update_status', {
        reservation_id: reservationId,
        status: newStatus
      });
      if (response.data && response.data.success) {
        toast.success(response.data.message || `Reservation updated to "${newStatus}".`);
        fetchReservations();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update reservation.';
      toast.error(errMsg);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  // Filter data based on status tab
  const filteredReservations = activeFilter === 'all'
    ? reservations
    : reservations.filter(r => r.status === activeFilter);

  // Summary counts
  const counts = {
    all: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    ready: reservations.filter(r => r.status === 'ready').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  const columns = [
    {
      header: 'Reservation Item',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1 text-sm">{row.title}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {row.author} · <span className="font-mono">ISBN: {row.isbn}</span>
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'title'
    },
    {
      header: 'Patron / Member',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
            {row.first_name?.[0] || 'U'}{row.last_name?.[0] || ''}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{row.first_name} {row.last_name}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'last_name'
    },
    {
      header: 'Queue',
      accessor: (row: Reservation) => (
        <div className="text-center">
          {row.status === 'pending' && row.queue_position > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full">
              #{row.queue_position}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">—</span>
          )}
        </div>
      )
    },
    {
      header: 'Copy Stock',
      accessor: (row: Reservation) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
            row.available_copies > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}>
            {row.available_copies > 0 ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {row.available_copies > 0 ? `${row.available_copies} Available` : '0 Copies'}
          </span>
        </div>
      )
    },
    {
      header: 'Reserved Date',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>{new Date(row.reservation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'reservation_date'
    },
    {
      header: 'Status',
      accessor: (row: Reservation) => {
        const config = statusConfig[row.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        );
      },
      sortable: true,
      sortKey: 'status'
    },
    {
      header: 'Actions',
      accessor: (row: Reservation) => {
        const isLoading = actionLoading === row.id;

        if (row.status === 'completed' || row.status === 'cancelled') {
          return <span className="text-xs text-slate-400 font-medium italic">No actions</span>;
        }

        return (
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <>
                {row.status === 'pending' && (
                  <button
                    onClick={() => setConfirmAction({ reservation: row, action: 'ready' })}
                    className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    title="Mark as Ready for Collection"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>Mark Ready</span>
                  </button>
                )}
                {row.status === 'ready' && (
                  <button
                    onClick={() => setConfirmAction({ reservation: row, action: 'completed' })}
                    className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    title="Mark as Completed / Collected"
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </button>
                )}
                <button
                  onClick={() => setConfirmAction({ reservation: row, action: 'cancelled' })}
                  className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl transition-all active:scale-95"
                  title="Cancel Reservation"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
              Reservations & Hold Queue Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Review queue priority, notify patrons for pickup & manage hold requests
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Filter Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: 'all', label: 'All Holds', count: counts.all, color: 'slate' },
          { key: 'pending', label: 'Pending Queue', count: counts.pending, color: 'amber' },
          { key: 'ready', label: 'Ready for Pickup', count: counts.ready, color: 'emerald' },
          { key: 'completed', label: 'Completed Holds', count: counts.completed, color: 'blue' },
          { key: 'cancelled', label: 'Cancelled Holds', count: counts.cancelled, color: 'rose' },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/70 dark:border-emerald-500/50 shadow-lg'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {tab.label}
              </span>
              <p className="text-2xl sm:text-3xl font-black">{tab.count}</p>
            </div>
          );
        })}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading reservations queue...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <DataTable
            columns={columns}
            data={filteredReservations}
            searchPlaceholder="Search holds by book title, author, patron name, ISBN..."
            searchField={(row) => `${row.title} ${row.author} ${row.first_name} ${row.last_name} ${row.isbn}`}
            initialSortKey="reservation_date"
            itemsPerPage={10}
          />
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL */}
      {confirmAction && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={
            confirmAction.action === 'ready'
              ? 'Mark Reservation Ready for Pickup'
              : confirmAction.action === 'completed'
              ? 'Complete Reservation & Check Out'
              : 'Cancel Reservation'
          }
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
                className="h-11 px-5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                variant={confirmAction.action === 'cancelled' ? 'danger' : 'primary'}
                onClick={() => handleUpdateStatus(confirmAction.reservation.id, confirmAction.action)}
                disabled={actionLoading !== null}
                className="h-11 px-6 text-xs font-bold"
              >
                {actionLoading !== null ? 'Updating...' : 'Confirm Action'}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <div className={`h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg ${
              confirmAction.action === 'ready'
                ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                : confirmAction.action === 'completed'
                ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
            }`}>
              {confirmAction.action === 'ready' && <PackageCheck className="h-8 w-8" />}
              {confirmAction.action === 'completed' && <CheckCircle2 className="h-8 w-8" />}
              {confirmAction.action === 'cancelled' && <XCircle className="h-8 w-8" />}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Are you sure you want to update hold status for:
              </p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                "{confirmAction.reservation.title}"
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                Patron: <strong className="text-emerald-600 dark:text-emerald-400">{confirmAction.reservation.first_name} {confirmAction.reservation.last_name}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left w-full text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Queue Notification</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                {confirmAction.action === 'ready' && 'The member will be notified that the book is placed on hold at the circulation counter.'}
                {confirmAction.action === 'completed' && 'This marks the reservation fulfilled and converts the hold into a checked-out loan.'}
                {confirmAction.action === 'cancelled' && 'This releases the book reservation and advances the queue for the next member.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminReservations;
