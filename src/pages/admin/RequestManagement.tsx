import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Inbox, 
  BookOpen, 
  Archive, 
  Sparkles, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';

export const RequestManagement: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'all' | 'borrowing' | 'archive' | 'acquisition'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action Modal State (Approve / Reject)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (activeTab !== 'all') params.type = activeTab;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/requests/list', { params });
      if (response.data && response.data.success) {
        setRequests(response.data.data.requests || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleOpenAction = (req: any, type: 'approved' | 'rejected') => {
    setSelectedRequest(req);
    setActionType(type);
    setRemarks('');
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    setIsSubmittingAction(true);
    setError(null);

    try {
      const response = await api.post('/requests/update_status', {
        request_id: selectedRequest.request_id,
        status: actionType,
        remarks: remarks.trim()
      });

      if (response.data && response.data.success) {
        setActionSuccessMsg(`Request ${selectedRequest.request_id} has been ${actionType}.`);
        setSelectedRequest(null);
        setActionType(null);
        fetchRequests();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to process ${actionType} action.`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
            Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Check className="h-3.5 w-3.5 text-blue-500" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Pending Review
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'borrowing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <BookOpen className="h-3.5 w-3.5" />
            Borrowing Request
          </span>
        );
      case 'archive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Archive className="h-3.5 w-3.5" />
            Archive Request
          </span>
        );
      case 'acquisition':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-3.5 w-3.5" />
            New Acquisition
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
              Request Management Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Review and authorize patron borrowing proposals, book archival requests, and acquisition queues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRequests}
            className="px-4 py-2.5 text-xs font-bold rounded-2xl active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Request Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('borrowing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'borrowing' 
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Borrowing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'archive' 
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acquisition')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'acquisition' 
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Acquisition
            </button>
          </div>

          {/* Status Segment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Request ID, title, requester name, or book accession..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Search
          </button>
        </form>
      </div>

      {/* Requests List Cards */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading library request queue...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <div className="h-14 w-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">No requests in this queue</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            There are no {statusFilter !== 'all' ? statusFilter : ''} {activeTab !== 'all' ? activeTab : ''} requests matching your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover-lift interactive-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {req.request_id}
                  </span>
                  {getTypeBadge(req.type)}
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(req.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {req.title}
                  </h3>
                  {req.author && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      by <span className="font-semibold text-slate-700 dark:text-slate-300">{req.author}</span>
                      {req.category && ` • ${req.category}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Requester: <strong className="text-slate-800 dark:text-slate-200">{req.requester_name}</strong></span>
                  </div>
                  {req.reason && (
                    <div className="flex items-center gap-1.5 font-medium max-w-lg truncate">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate italic">"{req.reason}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenAction(req, 'approved')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAction(req, 'rejected')}
                    className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* APPROVAL / REJECTION REMARKS MODAL */}
      {selectedRequest && actionType && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => { setSelectedRequest(null); setActionType(null); }}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  actionType === 'approved' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                }`}>
                  {actionType === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {actionType === 'approved' ? 'Authorize Request' : 'Reject Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedRequest(null); setActionType(null); }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Request Target:</p>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {selectedRequest.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requester: <strong className="text-slate-700 dark:text-slate-300">{selectedRequest.requester_name}</strong>
              </p>
            </div>

            <form onSubmit={handleProcessAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Administrative Remarks / Notes (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    actionType === 'approved'
                      ? 'e.g., Approved for immediate pickup at circulation desk...'
                      : 'e.g., Book is currently restricted or details incomplete...'
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedRequest(null); setActionType(null); }}
                  className="px-4 py-2.5 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={actionType === 'approved' ? 'primary' : 'danger'}
                  disabled={isSubmittingAction}
                  className="px-5 py-2.5 text-xs font-bold"
                >
                  {isSubmittingAction ? 'Processing...' : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RequestManagement;
