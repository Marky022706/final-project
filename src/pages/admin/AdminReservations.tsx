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
  User,
  BookOpen,
  Filter,
  Loader2,
  AlertTriangle
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
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
  ready:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: PackageCheck, label: 'Ready' },
  completed: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: CheckCircle, label: 'Completed' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', icon: XCircle, label: 'Cancelled' }
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
        setReservations(response.data.data);
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
        toast.success(response.data.message || `Reservation status updated to "${newStatus}".`);
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

  const filterTabs = [
    { key: 'all', label: 'All', count: counts.all, color: 'slate' },
    { key: 'pending', label: 'Pending', count: counts.pending, color: 'amber' },
    { key: 'ready', label: 'Ready', count: counts.ready, color: 'emerald' },
    { key: 'completed', label: 'Completed', count: counts.completed, color: 'slate' },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'rose' },
  ];

  const columns = [
    {
      header: 'Reservation',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-3">
          <div className="h-11 w-8.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-center flex-shrink-0">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover rounded" />
            ) : (
              <BookOpen className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-700 leading-snug line-clamp-1 text-sm">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {row.author} · ISBN: {row.isbn}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'title'
    },
    {
      header: 'Member',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-emerald-600">
              {row.first_name[0]}{row.last_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{row.email}</p>
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
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-full">
              #{row.queue_position}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">—</span>
          )}
        </div>
      )
    },
    {
      header: 'Copies',
      accessor: (row: Reservation) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${
            row.available_copies > 0
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {row.available_copies > 0 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {row.available_copies > 0 ? `${row.available_copies} Available` : 'Unavailable'}
          </span>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row: Reservation) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
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
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border capitalize ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="h-3 w-3" />
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
          return <span className="text-[10px] text-slate-400 font-medium italic">No actions</span>;
        }

        return (
          <div className="flex items-center gap-1.5">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <>
                {row.status === 'pending' && (
                  <button
                    onClick={() => setConfirmAction({ reservation: row, action: 'ready' })}
                    className="h-10 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
                    title="Mark as Ready for Collection"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Mark Ready</span>
                  </button>
                )}
                {row.status === 'ready' && (
                  <button
                    onClick={() => setConfirmAction({ reservation: row, action: 'completed' })}
                    className="h-10 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
                    title="Mark as Completed / Collected"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete</span>
                  </button>
                )}
                <button
                  onClick={() => setConfirmAction({ reservation: row, action: 'cancelled' })}
                  className="h-10 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
                  title="Cancel this reservation"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  const getConfirmTitle = () => {
    if (!confirmAction) return '';
    switch (confirmAction.action) {
      case 'ready': return 'Mark as Ready for Collection';
      case 'completed': return 'Mark as Completed';
      case 'cancelled': return 'Cancel Reservation';
      default: return 'Confirm Action';
    }
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    const { reservation, action } = confirmAction;
    const memberName = `${reservation.first_name} ${reservation.last_name}`;
    const bookTitle = reservation.title;

    switch (action) {
      case 'ready':
        return `This will mark the reservation for "${bookTitle}" by ${memberName} as Ready for Collection. The member will receive a notification to pick up their book.`;
      case 'completed':
        return `This will mark the reservation for "${bookTitle}" by ${memberName} as Completed. The member has collected their reserved book.`;
      case 'cancelled':
        return `This will cancel the reservation for "${bookTitle}" by ${memberName}. This action cannot be undone.`;
      default:
        return '';
    }
  };

  const getConfirmIcon = () => {
    if (!confirmAction) return AlertTriangle;
    switch (confirmAction.action) {
      case 'ready': return Bell;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getConfirmColors = () => {
    if (!confirmAction) return { icon: 'bg-slate-50 text-slate-600 border-slate-100', btn: 'bg-slate-600 hover:bg-slate-700' };
    switch (confirmAction.action) {
      case 'ready':
        return { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' };
      case 'completed':
        return { icon: 'bg-blue-50 text-blue-600 border-blue-100', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' };
      case 'cancelled':
        return { icon: 'bg-rose-50 text-rose-600 border-rose-100', btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' };
      default:
        return { icon: 'bg-slate-50 text-slate-600 border-slate-100', btn: 'bg-slate-600 hover:bg-slate-700' };
    }
  };

  const ConfirmIcon = getConfirmIcon();
  const confirmColors = getConfirmColors();

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Reservations Management
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            View and manage all member book reservations, notify members, and process collection
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <BookMarked className="h-4 w-4 text-emerald-600" />
          <span>{counts.all} total reservations</span>
        </div>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`h-10 px-4 text-xs font-bold rounded-xl border transition-all duration-150 active:scale-95 flex items-center gap-2 ${
                isActive
                  ? `bg-${tab.color === 'slate' ? 'slate-800' : tab.color + '-600'} text-white border-transparent shadow-md`
                  : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50`
              }`}
              style={isActive ? {
                backgroundColor: tab.color === 'amber' ? '#d97706' : tab.color === 'emerald' ? '#059669' : tab.color === 'rose' ? '#e11d48' : '#334155',
                color: 'white',
                borderColor: 'transparent'
              } : {}}
            >
              <Filter className="h-3 w-3" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reservations Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 text-center">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
            <BookMarked className="h-7 w-7 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-600">No reservations found</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {activeFilter === 'all'
                ? 'There are no reservations in the system yet.'
                : `No reservations with "${activeFilter}" status.`}
            </p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredReservations}
          searchPlaceholder="Search by book title, member name, reservation ID..."
          searchField={(row: Reservation) => `${row.title} ${row.first_name} ${row.last_name} ${row.reservation_id} ${row.isbn}`}
          initialSortKey="reservation_date"
          itemsPerPage={10}
        />
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={getConfirmTitle()}
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => {
                if (confirmAction) {
                  handleUpdateStatus(confirmAction.reservation.id, confirmAction.action);
                }
              }}
              disabled={actionLoading !== null}
              className={`h-11 px-6 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-60 ${confirmColors.btn}`}
            >
              {actionLoading !== null ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        }
      >
        {confirmAction && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className={`mx-auto h-12 w-12 rounded-full border flex items-center justify-center mb-1 animate-pulse ${confirmColors.icon}`}>
              <ConfirmIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-800">{getConfirmTitle()}</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {getConfirmMessage()}
              </p>
            </div>

            {/* Reservation info card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">
                  {confirmAction.reservation.first_name} {confirmAction.reservation.last_name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">({confirmAction.reservation.email})</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 line-clamp-1">{confirmAction.reservation.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium">
                  Reserved on {new Date(confirmAction.reservation.reservation_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReservations;
