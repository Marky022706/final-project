// src/pages/admin/AdminTransactions.tsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  Repeat,
  Bookmark,
  Search,
  Check,
  AlertTriangle,
  Barcode,
  ArrowRight,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

type TabType = 'pending' | 'issue' | 'return' | 'active' | 'reservations';

export const AdminTransactions: React.FC = () => {
  const toast = useToast();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [booksList, setBooksList] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Step-by-Step Issue Loan Modal States ---
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [stepModalStep, setStepModalStep] = useState<1 | 2 | 3>(1);
  const [stepSelectedUser, setStepSelectedUser] = useState<any>(null);
  const [stepSelectedBook, setStepSelectedBook] = useState<any>(null);
  const [stepLoanDurationDays, setStepLoanDurationDays] = useState(14);
  const [stepRemarks, setStepRemarks] = useState('');
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepUserSearch, setStepUserSearch] = useState('');
  const [stepBookSearch, setStepBookSearch] = useState('');

  // --- Return Process Modal State ---
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetLoan, setReturnTargetLoan] = useState<any>(null);
  const [returnLoading, setReturnLoading] = useState(false);

  // --- Barcode Scanner / Quick Return Tab State ---
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [barcodeSearchLoading, setBarcodeSearchLoading] = useState(false);
  const [matchedLoanForReturn, setMatchedLoanForReturn] = useState<any>(null);

  // --- Staff Direct Issue Tab State ---
  const [staffSelectedUser, setStaffSelectedUser] = useState<any>(null);
  const [staffSelectedBook, setStaffSelectedBook] = useState<any>(null);
  const [staffLoanDurationDays, setStaffLoanDurationDays] = useState(14);
  const [staffRemarks, setStaffRemarks] = useState('');
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffUserSearch, setStaffUserSearch] = useState('');
  const [staffBookSearch, setStaffBookSearch] = useState('');

  // --- Action Modal for Approving / Rejecting Borrow Request ---
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedBorrowRequest, setSelectedBorrowRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- Action Modal for Reservation Status ---
  const [resActionModalOpen, setResActionModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [resActionType, setResActionType] = useState<'ready' | 'fulfill' | 'cancel'>('ready');
  const [resActionLoading, setResActionLoading] = useState(false);

  // --- Filter states for Active Loans & Reservations Tabs ---
  const [activeLoansFilter, setActiveLoansFilter] = useState<'all' | 'active' | 'overdue'>('all');
  const [activeLoansSearch, setActiveLoansSearch] = useState('');
  const [reservationsFilter, setReservationsFilter] = useState<'all' | 'pending' | 'ready' | 'completed' | 'cancelled'>('all');
  const [reservationsSearch, setReservationsSearch] = useState('');

  // Fetch all circulation data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [txnsRes, reqsRes, resRes, usersRes, booksRes] = await Promise.allSettled([
        api.get('/transactions/list'),
        api.get('/requests/list'),
        api.get('/reservations/list'),
        api.get('/users/list'),
        api.get('/books/getAll')
      ]);

      if (txnsRes.status === 'fulfilled' && txnsRes.value.data?.success) {
        setTransactions(txnsRes.value.data.data || []);
      }

      if (reqsRes.status === 'fulfilled' && reqsRes.value.data?.success) {
        const rawReqs = reqsRes.value.data.data;
        const list = Array.isArray(rawReqs) ? rawReqs : rawReqs?.requests || [];
        setBorrowRequests(list);
      }

      if (resRes.status === 'fulfilled' && resRes.value.data?.success) {
        setReservations(resRes.value.data.data || []);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
        setUsersList(usersRes.value.data.data || []);
      }

      if (booksRes.status === 'fulfilled' && booksRes.value.data?.success) {
        setBooksList(booksRes.value.data.data?.books || booksRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load circulation dataset:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered pending lists for the primary "Pending Approvals" tab (matching the screenshot)
  const pendingBorrowRequests = useMemo(() => {
    return borrowRequests.filter(req => {
      // In the backend, borrowing requests have type === 'borrowing' and status === 'pending'
      const isBorrowing = req.type === 'borrowing' || !req.type;
      return isBorrowing && req.status === 'pending';
    });
  }, [borrowRequests]);

  const pendingReservations = useMemo(() => {
    return reservations.filter(res => res.status === 'pending');
  }, [reservations]);

  // Active loans count
  const activeLoans = useMemo(() => {
    return transactions.filter(t => t.status === 'active' || t.status === 'overdue');
  }, [transactions]);

  // Compute stats
  const activeLoansCount = activeLoans.length;
  const reservationsCount = reservations.length;

  // --- Step-by-Step Issue Loan Workflow ---
  const handleOpenStepModal = () => {
    setStepModalStep(1);
    setStepSelectedUser(null);
    setStepSelectedBook(null);
    setStepLoanDurationDays(14);
    setStepRemarks('');
    setStepUserSearch('');
    setStepBookSearch('');
    setStepModalOpen(true);
  };

  const handleStepSubmit = async () => {
    if (!stepSelectedUser || !stepSelectedBook) {
      toast.error('Please select both a patron and a book copy.');
      return;
    }

    setStepSubmitting(true);
    try {
      const response = await api.post('/transactions/borrow', {
        user_id: stepSelectedUser.id,
        book_id: stepSelectedBook.id
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || `Loan successfully issued to ${stepSelectedUser.full_name || stepSelectedUser.first_name}!`);
        setStepModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to issue loan.');
    } finally {
      setStepSubmitting(false);
    }
  };

  // --- Staff Direct Issue Loan Workflow ---
  const handleStaffDirectIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffSelectedUser || !staffSelectedBook) {
      toast.error('Please select both a patron and an available book.');
      return;
    }

    setStaffSubmitting(true);
    try {
      const response = await api.post('/transactions/borrow', {
        user_id: staffSelectedUser.id,
        book_id: staffSelectedBook.id
      });

      if (response.data && response.data.success) {
        toast.success(`Book loan registered for ${staffSelectedUser.full_name || staffSelectedUser.first_name}.`);
        setStaffSelectedUser(null);
        setStaffSelectedBook(null);
        setStaffRemarks('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to check-out loan.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  // --- Return Modal Workflow ---
  const openReturnModal = (loan: any) => {
    setReturnTargetLoan(loan);
    setReturnModalOpen(true);
  };

  const confirmReturn = async () => {
    if (!returnTargetLoan) return;
    setReturnLoading(true);
    try {
      const response = await api.post('/transactions/return', {
        transaction_id: returnTargetLoan.transaction_id || returnTargetLoan.id
      });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Book checked in successfully!');
        setReturnModalOpen(false);
        setReturnTargetLoan(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete book return checkout.');
    } finally {
      setReturnLoading(false);
    }
  };

  // --- Barcode / Fast Return Lookup Workflow ---
  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeQuery.trim().toLowerCase();
    if (!query) return;

    setBarcodeSearchLoading(true);
    // Find among active transactions
    const found = transactions.find(t => 
      (t.status === 'active' || t.status === 'overdue') && (
        String(t.transaction_id || '').toLowerCase() === query ||
        String(t.isbn || '').toLowerCase() === query ||
        String(t.accession_number || '').toLowerCase() === query ||
        String(t.book_id || '').toLowerCase() === query
      )
    );

    if (found) {
      setMatchedLoanForReturn(found);
      toast.success(`Active loan match found: ${found.title}`);
    } else {
      setMatchedLoanForReturn(null);
      toast.error(`No active loan found matching "${barcodeQuery}". Verify barcode or transaction ID.`);
    }
    setBarcodeSearchLoading(false);
  };

  const processBarcodeReturn = async () => {
    if (!matchedLoanForReturn) return;
    setReturnLoading(true);
    try {
      const response = await api.post('/transactions/return', {
        transaction_id: matchedLoanForReturn.transaction_id || matchedLoanForReturn.id
      });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Book check-in recorded successfully!');
        setMatchedLoanForReturn(null);
        setBarcodeQuery('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete check-in.');
    } finally {
      setReturnLoading(false);
    }
  };

  // --- Borrow Request Decision (Approve / Reject) ---
  const handleOpenBorrowAction = (req: any, type: 'approve' | 'reject') => {
    setSelectedBorrowRequest(req);
    setActionType(type);
    setActionRemarks('');
    setActionModalOpen(true);
  };

  const handleProcessBorrowAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowRequest) return;
    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        // First issue the loan if book_id & user_id exist
        if (selectedBorrowRequest.book_id && selectedBorrowRequest.user_id) {
          await api.post('/transactions/borrow', {
            user_id: selectedBorrowRequest.user_id,
            book_id: selectedBorrowRequest.book_id
          });
        }
        // Update request status to approved
        await api.post('/requests/update_status', {
          request_id: selectedBorrowRequest.request_id,
          status: 'approved',
          remarks: actionRemarks.trim() || 'Approved borrow request by staff'
        });
        toast.success(`Borrow request #${selectedBorrowRequest.request_id} approved & loan issued!`);
      } else {
        await api.post('/requests/update_status', {
          request_id: selectedBorrowRequest.request_id,
          status: 'rejected',
          remarks: actionRemarks.trim() || 'Borrow request declined by administration'
        });
        toast.success(`Borrow request #${selectedBorrowRequest.request_id} rejected.`);
      }
      setActionModalOpen(false);
      setSelectedBorrowRequest(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Action failed to process.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Reservation Decision ---
  const handleOpenReservationAction = (res: any, type: 'ready' | 'fulfill' | 'cancel') => {
    setSelectedReservation(res);
    setResActionType(type);
    setResActionModalOpen(true);
  };

  const handleProcessReservationAction = async () => {
    if (!selectedReservation) return;
    setResActionLoading(true);
    try {
      if (resActionType === 'ready') {
        await api.post('/reservations/update_status', {
          id: selectedReservation.id,
          status: 'ready'
        });
        toast.success(`Reservation #${selectedReservation.reservation_id} is marked Ready for Pickup!`);
      } else if (resActionType === 'fulfill') {
        // Issue loan
        await api.post('/transactions/borrow', {
          user_id: selectedReservation.user_id,
          book_id: selectedReservation.book_id
        });
        await api.post('/reservations/update_status', {
          id: selectedReservation.id,
          status: 'fulfilled'
        });
        toast.success(`Book loan registered and reservation fulfilled!`);
      } else if (resActionType === 'cancel') {
        await api.post('/reservations/cancel', {
          id: selectedReservation.id
        });
        toast.success(`Reservation cancelled.`);
      }
      setResActionModalOpen(false);
      setSelectedReservation(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update reservation.');
    } finally {
      setResActionLoading(false);
    }
  };

  // Filtered members for search
  const filteredUsers = useMemo(() => {
    const q = (stepModalStep === 1 ? stepUserSearch : staffUserSearch).toLowerCase().trim();
    if (!q) return usersList.slice(0, 10);
    return usersList.filter(u => 
      `${u.first_name || ''} ${u.last_name || ''} ${u.full_name || ''}`.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.student_id && String(u.student_id).toLowerCase().includes(q))
    ).slice(0, 10);
  }, [usersList, stepUserSearch, staffUserSearch, stepModalStep]);

  // Filtered books for search
  const filteredBooks = useMemo(() => {
    const q = (stepModalStep === 2 ? stepBookSearch : staffBookSearch).toLowerCase().trim();
    if (!q) return booksList.filter(b => b.status === 'available').slice(0, 10);
    return booksList.filter(b => 
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.accession_number && b.accession_number.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [booksList, stepBookSearch, staffBookSearch, stepModalStep]);

  // Filtered Active Loans table
  const displayedActiveLoans = useMemo(() => {
    return transactions.filter(t => {
      const matchesFilter = activeLoansFilter === 'all' 
        ? true 
        : t.status === activeLoansFilter;
      const q = activeLoansSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        (t.transaction_id && t.transaction_id.toLowerCase().includes(q)) ||
        (`${t.first_name} ${t.last_name}`).toLowerCase().includes(q) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.isbn && t.isbn.toLowerCase().includes(q))
      );
      return matchesFilter && matchesSearch;
    });
  }, [transactions, activeLoansFilter, activeLoansSearch]);

  // Filtered Reservations table
  const displayedReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesFilter = reservationsFilter === 'all' ? true : r.status === reservationsFilter;
      const q = reservationsSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        (r.reservation_id && r.reservation_id.toLowerCase().includes(q)) ||
        (r.user_name && r.user_name.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.isbn && r.isbn.toLowerCase().includes(q))
      );
      return matchesFilter && matchesSearch;
    });
  }, [reservations, reservationsFilter, reservationsSearch]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-14 px-1 sm:px-2">
      
      {/* ========================================================================= */}
      {/* HEADER (Matching screenshot layout) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Circulation Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Book Borrowing, Barcode Returns, Loan Renewals, and Active Reservation Holds
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing || loading}
            title="Refresh circulation records"
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenStepModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#064e3b] hover:bg-[#043d2e] active:scale-95 text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Step-by-Step Issue Loan Modal
          </button>
        </div>
      </div>

      {/* Loading Indeterminate Bar */}
      {loading && (
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-emerald-600 rounded-full animate-pulse" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* NAVIGATION TABS (5 tabs matching the screenshot) */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-2 text-sm font-medium">
          {/* Tab 1: Pending Approvals */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-emerald-600 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clock className={`h-4 w-4 ${activeTab === 'pending' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Pending Approvals</span>
          </button>

          {/* Tab 2: Issue Loan (Staff) */}
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'issue'
                ? 'border-emerald-600 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className={`h-4 w-4 ${activeTab === 'issue' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Issue Loan (Staff)</span>
          </button>

          {/* Tab 3: Return (Scan Barcode) */}
          <button
            onClick={() => setActiveTab('return')}
            className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'return'
                ? 'border-emerald-600 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className={`h-4 w-4 ${activeTab === 'return' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Return (Scan Barcode)</span>
          </button>

          {/* Tab 4: Active Loans (count) */}
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-emerald-600 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Repeat className={`h-4 w-4 ${activeTab === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Active Loans ({activeLoansCount})</span>
          </button>

          {/* Tab 5: Reservations (count) */}
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reservations'
                ? 'border-emerald-600 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${activeTab === 'reservations' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Reservations ({reservationsCount})</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENDING APPROVALS (EXACT SCREENSHOT LAYOUT & CONTENT) */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-6">

          {/* CARD 1: Borrow Requests Awaiting Approval */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Borrow Requests Awaiting Approval
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {pendingBorrowRequests.length} Pending
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Members who requested to borrow physical books from the online catalog
              </p>
            </div>

            {/* Table Container */}
            <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f0f4f8] dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      PATRON / MEMBER
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      BOOK TITLE & ACCESSION
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      BARCODE
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      DATE REQUESTED
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right sm:text-center">
                      REVIEW DECISION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingBorrowRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 font-normal">
                        No pending borrow requests at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingBorrowRequests.map((req) => (
                      <tr key={req.id || req.request_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                              {(req.user_name?.[0] || 'M').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{req.user_name || 'Member'}</p>
                              <p className="text-[11px] text-slate-400">{req.user_email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100 leading-snug">
                              {req.book_title || req.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ACC: {req.accession_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {req.barcode || req.isbn || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Today'}
                        </td>
                        <td className="py-3.5 px-4 text-right sm:text-center">
                          <div className="flex items-center justify-end sm:justify-center gap-2">
                            <button
                              onClick={() => handleOpenBorrowAction(req, 'approve')}
                              className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenBorrowAction(req, 'reject')}
                              className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 2: Reservation Holds Awaiting Approval */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Reservation Holds Awaiting Approval
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {pendingReservations.length} Pending
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Hold requests placed by patrons waiting for shelf clearance
              </p>
            </div>

            {/* Table Container */}
            <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f0f4f8] dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      PATRON / MEMBER
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      BOOK TITLE
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      DATE REQUESTED
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      QUEUE POS.
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right sm:text-center">
                      REVIEW DECISION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingReservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 font-normal">
                        No pending reservation holds.
                      </td>
                    </tr>
                  ) : (
                    pendingReservations.map((res, idx) => (
                      <tr key={res.id || res.reservation_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                              {(res.user_name?.[0] || 'P').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{res.user_name || 'Patron'}</p>
                              <p className="text-[11px] text-slate-400">{res.user_email || 'Verified account'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100 leading-snug">{res.title}</p>
                            <p className="text-[11px] text-slate-400">{res.author || 'Catalog book'}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {res.reservation_date || (res.created_at ? new Date(res.created_at).toLocaleDateString() : 'Today')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            #{idx + 1} in queue
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right sm:text-center">
                          <div className="flex items-center justify-end sm:justify-center gap-2">
                            <button
                              onClick={() => handleOpenReservationAction(res, 'ready')}
                              className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                            >
                              Mark Ready
                            </button>
                            <button
                              onClick={() => handleOpenReservationAction(res, 'cancel')}
                              className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ISSUE LOAN (STAFF DIRECT DESK CHECKOUT) */}
      {/* ========================================================================= */}
      {activeTab === 'issue' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Staff Desk Book Checkout
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Directly issue an available book to a patron without prior online reservation
            </p>
          </div>

          <form onSubmit={handleStaffDirectIssue} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Member / Patron */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  1. Select Patron / Member
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={staffUserSearch}
                    onChange={(e) => setStaffUserSearch(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {staffSelectedUser ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {(staffSelectedUser.first_name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {staffSelectedUser.first_name} {staffSelectedUser.last_name}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {staffSelectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffSelectedUser(null)}
                      className="text-xs text-slate-400 hover:text-rose-500 font-bold px-2 py-1"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <p className="p-4 text-xs text-center text-slate-400">No matching patrons found</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setStaffSelectedUser(u)}
                          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {u.first_name} {u.last_name} {u.student_id ? `(${u.student_id})` : ''}
                            </p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600">Select</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Select Available Book */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  2. Select Available Book
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={staffBookSearch}
                    onChange={(e) => setStaffBookSearch(e.target.value)}
                    placeholder="Search by title, author, barcode..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {staffSelectedBook ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate max-w-[240px]">
                        {staffSelectedBook.title}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {staffSelectedBook.author} • Available: {staffSelectedBook.available_copies ?? 1}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffSelectedBook(null)}
                      className="text-xs text-slate-400 hover:text-rose-500 font-bold px-2 py-1"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBooks.length === 0 ? (
                      <p className="p-4 text-xs text-center text-slate-400">No books found or all copies loaned</p>
                    ) : (
                      filteredBooks.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setStaffSelectedBook(b)}
                          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="truncate max-w-[240px]">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{b.title}</p>
                            <p className="text-[10px] text-slate-400">{b.author} • Acc: {b.accession_number || 'N/A'}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                            {b.available_copies ?? 1} copies
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Loan Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Standard Loan Duration
                </label>
                <div className="flex gap-2">
                  {[7, 14, 21, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setStaffLoanDurationDays(days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        staffLoanDurationDays === days
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Staff Notes / Checkout Desk Remarks
                </label>
                <input
                  type="text"
                  value={staffRemarks}
                  onChange={(e) => setStaffRemarks(e.target.value)}
                  placeholder="Optional notes or shelf remarks..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={staffSubmitting || !staffSelectedUser || !staffSelectedBook}
                className="px-6 py-2.5 rounded-lg bg-[#064e3b] hover:bg-[#043d2e] disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {staffSubmitting ? 'Registering Loan...' : 'Issue Book Loan to Patron'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RETURN (SCAN BARCODE TERMINAL) */}
      {/* ========================================================================= */}
      {activeTab === 'return' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Scanner Input Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Barcode className="h-5 w-5 text-emerald-600" />
                Barcode Check-in & Return Terminal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Scan or type the book's Barcode, Accession Number, or Transaction ID to immediately check it back in
              </p>
            </div>

            <form onSubmit={handleBarcodeLookup} className="flex gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="Scan barcode or enter Transaction ID (e.g. TXN-2026...)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={barcodeSearchLoading || !barcodeQuery.trim()}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-semibold transition-all flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Lookup Loan
              </button>
            </form>

            {/* Matched Loan Card for Confirmation */}
            {matchedLoanForReturn && (
              <div className="mt-6 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Loan Match Confirmed
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {matchedLoanForReturn.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Borrower: <strong className="text-slate-800 dark:text-slate-200">{matchedLoanForReturn.first_name} {matchedLoanForReturn.last_name}</strong> • Transaction: <span className="font-mono">{matchedLoanForReturn.transaction_id}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Borrowed: {new Date(matchedLoanForReturn.borrow_date).toLocaleDateString()} | Due: {new Date(matchedLoanForReturn.due_date).toLocaleDateString()}
                    </p>
                    {matchedLoanForReturn.status === 'overdue' && (
                      <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Overdue return! Late fine will be automatically logged to patron's ledger.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={processBarcodeReturn}
                    disabled={returnLoading}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {returnLoading ? 'Processing Return...' : 'Confirm Book Return'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Active Loans ready for return */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider text-xs">
              Quick Check-in: Active Borrowers ({activeLoans.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {activeLoans.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">All book copies have been returned.</p>
              ) : (
                activeLoans.map(loan => (
                  <div key={loan.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{loan.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {loan.first_name} {loan.last_name} • Due: {new Date(loan.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openReturnModal(loan)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex-shrink-0"
                    >
                      Check-in
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACTIVE LOANS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'active' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                All Active & Historical Circulation Loans
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Complete audit trail of book borrowings, return dates, and circulation statuses
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={activeLoansSearch}
                  onChange={(e) => setActiveLoansSearch(e.target.value)}
                  placeholder="Search loans..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={activeLoansFilter}
                onChange={(e: any) => setActiveLoansFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="overdue">Overdue Only</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f4f8] dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">TXN ID</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">PATRON / MEMBER</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">BOOK TITLE</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">OUT / DUE DATE</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">STATUS</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedActiveLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">No circulation records found.</td>
                  </tr>
                ) : (
                  displayedActiveLoans.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{row.transaction_id}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{row.first_name} {row.last_name}</p>
                        <p className="text-[10px] text-slate-400">{row.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">{row.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ISBN: {row.isbn || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-500">Out: {new Date(row.borrow_date).toLocaleDateString()}</p>
                        <p className={`font-semibold ${row.status === 'overdue' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          Due: {new Date(row.due_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          row.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          row.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.status !== 'returned' && (
                          <button
                            onClick={() => openReturnModal(row)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold transition-all"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: RESERVATIONS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'reservations' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Patron Book Reservations & Hold Queues
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track hold queues, ready pick-up notifications, and fulfillment timelines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={reservationsSearch}
                  onChange={(e) => setReservationsSearch(e.target.value)}
                  placeholder="Search reservations..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={reservationsFilter}
                onChange={(e: any) => setReservationsFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="ready">Ready for Pickup</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f4f8] dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">HOLD ID</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">PATRON</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">BOOK TITLE</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">RESERVED ON</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">STATUS</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">No reservations records found.</td>
                  </tr>
                ) : (
                  displayedReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.reservation_id}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{r.user_name}</p>
                        <p className="text-[10px] text-slate-400">{r.user_email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">{r.title}</p>
                        <p className="text-[10px] text-slate-400">{r.author}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.reservation_date || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          r.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          r.status === 'fulfilled' || r.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleOpenReservationAction(r, 'ready')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                          >
                            Mark Ready
                          </button>
                        )}
                        {r.status === 'ready' && (
                          <button
                            onClick={() => handleOpenReservationAction(r, 'fulfill')}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                          >
                            Issue Loan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP-BY-STEP ISSUE LOAN MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={stepModalOpen}
        onClose={() => setStepModalOpen(false)}
        title="Step-by-Step Issue Book Loan"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Stepper Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                stepModalStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                1
              </span>
              <span className={`text-xs font-bold ${stepModalStep >= 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                Select Patron
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                stepModalStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </span>
              <span className={`text-xs font-bold ${stepModalStep >= 2 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                Select Book
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                stepModalStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </span>
              <span className={`text-xs font-bold ${stepModalStep === 3 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                Review & Confirm
              </span>
            </div>
          </div>

          {/* STEP 1: Select Patron */}
          {stepModalStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Find Library Member
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={stepUserSearch}
                    onChange={(e) => setStepUserSearch(e.target.value)}
                    placeholder="Search by patron name, student/staff ID, or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setStepSelectedUser(u)}
                    className={`p-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      stepSelectedUser?.id === u.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {(u.first_name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {u.first_name} {u.last_name} {u.student_id ? `(${u.student_id})` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    {stepSelectedUser?.id === u.id && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!stepSelectedUser}
                  onClick={() => setStepModalStep(2)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  Continue to Book Selection <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Book */}
          {stepModalStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Find Available Catalog Book
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={stepBookSearch}
                    onChange={(e) => setStepBookSearch(e.target.value)}
                    placeholder="Search by book title, author, barcode, accession..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBooks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setStepSelectedBook(b)}
                    className={`p-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      stepSelectedBook?.id === b.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate max-w-[320px]">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{b.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {b.author} • Accession: {b.accession_number || 'N/A'} • Available: {b.available_copies ?? 1}
                      </p>
                    </div>
                    {stepSelectedBook?.id === b.id && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStepModalStep(1)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!stepSelectedBook}
                  onClick={() => setStepModalStep(3)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  Continue to Terms <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Terms */}
          {stepModalStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Patron:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {stepSelectedUser?.first_name} {stepSelectedUser?.last_name} ({stepSelectedUser?.email})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Book:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {stepSelectedBook?.title}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Accession Number:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {stepSelectedBook?.accession_number || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Loan Period:</span>
                  <span className="font-bold text-emerald-600">
                    {stepLoanDurationDays} Days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Loan Duration
                </label>
                <div className="flex gap-2">
                  {[7, 14, 21, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setStepLoanDurationDays(days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        stepLoanDurationDays === days
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Notes / Checkout Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={stepRemarks}
                  onChange={(e) => setStepRemarks(e.target.value)}
                  placeholder="Shelf location, copy condition, or notes..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStepModalStep(2)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={stepSubmitting}
                  onClick={handleStepSubmit}
                  className="px-6 py-2.5 rounded-lg bg-[#064e3b] hover:bg-[#043d2e] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  {stepSubmitting ? 'Issuing Loan...' : 'Confirm & Issue Loan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* RETURN CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Check-in Book Return"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {returnTargetLoan?.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Patron: {returnTargetLoan?.first_name} {returnTargetLoan?.last_name}
            </p>
            <p className="text-xs text-slate-500">
              Due Date: {returnTargetLoan ? new Date(returnTargetLoan.due_date).toLocaleDateString() : ''}
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to mark this physical book copy as returned? The available copies count will automatically increase in the public catalog.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmReturn}
              disabled={returnLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {returnLoading ? 'Processing...' : 'Confirm Check-in'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* BORROW REQUEST DECISION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === 'approve' ? 'Approve Online Borrow Request' : 'Decline Borrow Request'}
        size="md"
      >
        <form onSubmit={handleProcessBorrowAction} className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500">Requested Book:</p>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {selectedBorrowRequest?.book_title || selectedBorrowRequest?.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Member: {selectedBorrowRequest?.user_name} ({selectedBorrowRequest?.user_email})
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {actionType === 'approve' ? 'Staff Approval Note (Optional)' : 'Reason for Decline'}
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder={actionType === 'approve' ? 'Ready for shelf pickup...' : 'Book copy undergoing maintenance...'}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {actionLoading ? 'Processing...' : actionType === 'approve' ? 'Approve & Issue' : 'Decline Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* RESERVATION DECISION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={resActionModalOpen}
        onClose={() => setResActionModalOpen(false)}
        title={
          resActionType === 'ready' ? 'Mark Ready for Pickup' :
          resActionType === 'fulfill' ? 'Issue Loan to Reserving Patron' :
          'Cancel Reservation'
        }
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {resActionType === 'ready' && `Notify ${selectedReservation?.user_name} that their reserved copy of "${selectedReservation?.title}" is ready on the reservation shelf?`}
            {resActionType === 'fulfill' && `Issue book "${selectedReservation?.title}" to ${selectedReservation?.user_name} as an active loan?`}
            {resActionType === 'cancel' && `Are you sure you want to cancel the reservation for "${selectedReservation?.title}"?`}
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setResActionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Back
            </button>
            <button
              type="button"
              disabled={resActionLoading}
              onClick={handleProcessReservationAction}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {resActionLoading ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminTransactions;
