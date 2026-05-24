// src/pages/member/MyBooks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Calendar, AlertTriangle, Award, RotateCcw, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBooks: React.FC = () => {
  const { refreshProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'borrows' | 'reservations'>('borrows');
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reservations, setReservations] = useState<any[]>([]);
  const [resLoading, setResLoading] = useState(false);

  // --- Return Confirmation Modal State ---
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetLoan, setReturnTargetLoan] = useState<any>(null);
  const [returnLoading, setReturnLoading] = useState(false);

  // --- Cancel Reservation Modal State ---
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetRes, setCancelTargetRes] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [borrowHeldLoading, setBorrowHeldLoading] = useState<number | null>(null);

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/list', {
        params: { status: 'active' }, // Fetches active + overdue
      });
      if (response.data && response.data.success) {
        setLoans(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load active loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    setResLoading(true);
    try {
      const response = await api.get('/reservations/list');
      if (response.data && response.data.success) {
        setReservations(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setResLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'borrows') {
      fetchActiveLoans();
    } else {
      fetchReservations();
    }
  }, [activeTab]);

  // --- Open Return Confirmation Modal ---
  const openReturnModal = (loan: any) => {
    setReturnTargetLoan(loan);
    setReturnModalOpen(true);
  };

  const confirmReturn = async () => {
    if (!returnTargetLoan) return;
    setReturnLoading(true);
    try {
      const response = await api.post('/transactions/return', {
        transaction_id: returnTargetLoan.transaction_id,
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Book checked in successfully!');

        // Refresh loans listing and global profile counters
        fetchActiveLoans();
        refreshProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to check in book copy.');
    } finally {
      setReturnLoading(false);
      setReturnModalOpen(false);
      setReturnTargetLoan(null);
    }
  };

  // --- Open Cancel Confirmation Modal ---
  const openCancelModal = (res: any) => {
    setCancelTargetRes(res);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelTargetRes) return;
    setCancelLoading(true);
    try {
      const response = await api.post('/reservations/cancel', {
        id: cancelTargetRes.id,
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Reservation cancelled successfully!');
        fetchReservations();
        refreshProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelLoading(false);
      setCancelModalOpen(false);
      setCancelTargetRes(null);
    }
  };

  const handleBorrowHeld = async (res: any) => {
    setBorrowHeldLoading(res.id);
    try {
      const response = await api.post('/transactions/borrow', {
        book_id: res.book_id,
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Book successfully checked out!');
        fetchReservations();
        refreshProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to borrow book.');
    } finally {
      setBorrowHeldLoading(null);
    }
  };

  // --- Derived modal values ---
  const loanTitle = returnTargetLoan?.title || '';
  const isOverdue = returnTargetLoan?.status === 'overdue';

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          My Borrowed & Reserved Books
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Check due dates, manage reservation queues, and settle returns
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('borrows')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'borrows'
              ? 'text-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Borrows
          {activeTab === 'borrows' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'reservations'
              ? 'text-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          My Book Reservations
          {activeTab === 'reservations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'borrows' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-20 w-14 bg-slate-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
            <Award className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-600">No active checkout books</h4>
            <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
              You currently hold zero physical inventory copies from Balingasag Public Library.
            </p>
            <Link to="/catalog" className="mt-5">
              <Button variant="primary" className="text-xs px-6 py-2.5">
                Browse Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => {
              const isLoanOverdue = loan.status === 'overdue';
              return (
                <Card 
                  key={loan.id} 
                  className={`flex flex-col justify-between border transition-all ${
                    isLoanOverdue ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Cover */}
                    <div className="h-24 w-18 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {loan.cover_image && loan.cover_image.startsWith('http') ? (
                        <img src={loan.cover_image} alt={loan.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-slate-300" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/40 px-2 py-0.5 rounded uppercase tracking-wider">
                        {loan.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2" title={loan.title}>
                        {loan.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">By {loan.author}</p>
                    </div>
                  </div>

                  {/* Deadlines and return status */}
                  <div className="my-5 border-t border-slate-50 pt-4 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Checkout Date:
                      </span>
                      <span className="text-slate-700">{new Date(loan.borrow_date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Due Date:
                      </span>
                      <span className={`font-bold ${isLoanOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        {new Date(loan.due_date).toLocaleDateString()}
                      </span>
                    </div>

                    {isLoanOverdue && (
                      <div className="flex items-center gap-1.5 p-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-100">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Overdue Loan! Daily charges of ₱5.00 active.</span>
                      </div>
                    )}
                  </div>

                  {/* Settle Return */}
                  <Button
                    variant={isLoanOverdue ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => openReturnModal(loan)}
                    className="w-full text-xs"
                  >
                    Settle Return Checkout
                  </Button>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        resLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-20 w-14 bg-slate-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
            <Award className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-600">No book reservations</h4>
            <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
              You do not have any active book copy reservations in our system.
            </p>
            <Link to="/catalog" className="mt-5">
              <Button variant="primary" className="text-xs px-6 py-2.5 bg-teal-600 hover:bg-teal-700 border-teal-600 hover:border-teal-700">
                Browse Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((res) => {
              const isReady = res.status === 'ready';
              const isPending = res.status === 'pending';
              const isCompleted = res.status === 'completed';
              const isCancelled = res.status === 'cancelled';

              return (
                <Card 
                  key={res.id} 
                  className={`flex flex-col justify-between border transition-all ${
                    isReady ? 'border-teal-100 bg-teal-50/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Cover */}
                    <div className="h-24 w-18 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {res.cover_image && res.cover_image.startsWith('http') ? (
                        <img src={res.cover_image} alt={res.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-slate-300" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-100/40 px-2 py-0.5 rounded uppercase tracking-wider">
                        {res.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2" title={res.title}>
                        {res.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">By {res.author}</p>
                    </div>
                  </div>

                  {/* Deadlines and return status */}
                  <div className="my-5 border-t border-slate-50 pt-4 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Reserved Date:
                      </span>
                      <span className="text-slate-700">{new Date(res.reservation_date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-slate-400" />
                        Reservation Code:
                      </span>
                      <span className="font-semibold text-slate-700">{res.reservation_id}</span>
                    </div>

                    {isReady && (
                      <div className="flex items-center gap-1.5 p-2 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-bold border border-teal-100 mt-1">
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Ready for Pickup! Borrow it before other holds trigger.</span>
                      </div>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-1.5 p-2 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100 mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>In Queue Position: #{res.queue_position}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isReady && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancelModal(res)}
                        className="w-full text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={borrowHeldLoading === res.id}
                        onClick={() => handleBorrowHeld(res)}
                        className="w-full text-xs bg-teal-600 hover:bg-teal-700 border-teal-600 hover:border-teal-700 text-white shadow-md shadow-teal-100"
                      >
                        Borrow Held
                      </Button>
                    </div>
                  )}

                  {isPending && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelModal(res)}
                      className="w-full text-xs mt-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Cancel Reservation
                    </Button>
                  )}

                  {(isCompleted || isCancelled) && (
                    <div className="text-center text-[10px] font-bold text-slate-400 capitalize py-2">
                      {res.status}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ═══════════════════════════════════════════════════════════
          SETTLE RETURN CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setReturnTargetLoan(null); }}
        title="Settle Return Checkout"
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
              onClick={confirmReturn}
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
              Are you ready to return
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-1">
              "{loanTitle}"
            </p>
            {isOverdue && (
              <p className="text-sm font-bold text-rose-600 mt-1">
                If overdue, a daily fine of ₱5.00 will be added.
              </p>
            )}
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
                ? 'This book is past its due date. Returning it now will finalize any accumulated overdue fines on your account.'
                : 'This will settle the return and make the book copy available for other library members to borrow.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          CANCEL RESERVATION CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => { setCancelModalOpen(false); setCancelTargetRes(null); }}
        title="Cancel Book Reservation"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setCancelModalOpen(false); setCancelTargetRes(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              No, Keep
            </Button>
            <Button
              variant="primary"
              onClick={confirmCancel}
              disabled={cancelLoading}
              className="h-11 px-5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border-transparent animate-pulse-once"
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        }
      >
        {cancelTargetRes && (
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            {/* Icon */}
            <div className="h-14 w-14 rounded-2xl border flex items-center justify-center bg-rose-50 border-rose-100">
              <AlertTriangle className="h-7 w-7 text-rose-500" />
            </div>

            {/* Prompt */}
            <div>
              <p className="text-sm font-bold text-slate-800 leading-snug">
                Are you sure you want to cancel the reservation for
              </p>
              <p className="text-base font-extrabold text-slate-900 mt-1">
                "{cancelTargetRes.title}"
              </p>
            </div>

            {/* Warning Callout */}
            <div className="flex items-start gap-2.5 border rounded-xl p-3 text-left w-full bg-rose-50/80 border-rose-100">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <p className="text-[11px] font-semibold leading-relaxed text-rose-700">
                This will remove you from the first-come-first-served queue. If you decide to reserve this book again, you will be placed at the back of the queue.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBooks;
