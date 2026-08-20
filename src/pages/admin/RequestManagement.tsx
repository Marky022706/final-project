// src/pages/admin/RequestManagement.tsx
import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export const RequestManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Check className="h-3.5 w-3.5 text-blue-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'borrowing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <BookOpen className="h-3 w-3" />
            Borrowing Request
          </span>
        );
      case 'archive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Archive className="h-3 w-3" />
            Archive Request
          </span>
        );
      case 'acquisition':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="h-3 w-3" />
            New Acquisition
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Request Management Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Review and authorize borrowing transactions, book archival requests, and acquisition proposals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRequests}
            className="px-4 py-2 text-xs font-bold"
          >
            Refresh List
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Request Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('borrowing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'borrowing' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Borrowing ({requests.filter(r => r.type === 'borrowing').length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'archive' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Archive Requests ({requests.filter(r => r.type === 'archive').length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acquisition')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'acquisition' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Acquisition ({requests.filter(r => r.type === 'acquisition').length || 0})
            </button>
          </div>

          {/* Status Segment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Requests List Cards / Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading library requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No requests found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no {statusFilter !== 'all' ? statusFilter : ''} {activeTab !== 'all' ? activeTab : ''} requests matching your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-extrabold text-slate-800">
                    {req.request_id}
                  </span>
                  {getTypeBadge(req.type)}
                  {getStatusBadge(req.status)}
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(req.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800 leading-snug">
                    {req.title || req.book_title || 'Untitled Request'}
                  </h4>
                  {(req.author || req.book_author) && (
                    <p className="text-xs text-slate-500 font-medium">
                      by {req.author || req.book_author}
                      {req.book_accession && (
                        <span className="ml-2 font-mono text-[11px] text-emerald-700 font-bold">
                          [Acc: {req.book_accession}]
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">{req.requester_name}</span>
                    {req.member_qr && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        ({req.member_qr})
                      </span>
                    )}
                  </div>

                  {req.reason && (
                    <div className="flex items-center gap-1.5 text-slate-500 italic max-w-md truncate">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">"{req.reason}"</span>
                    </div>
                  )}
                </div>

                {req.remarks && req.status !== 'pending' && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 flex items-start gap-2">
                    <span className="font-bold text-slate-700">Remarks:</span>
                    <span>{req.remarks}</span>
                    {req.approver_name && (
                      <span className="text-[10px] text-slate-400 font-medium ml-auto">
                        Reviewed by {req.approver_name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Action Buttons */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {req.type === 'archive' && !isSuperAdmin ? (
                    <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100">
                      Awaiting Super Admin Approval
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenAction(req, 'rejected')}
                        className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleOpenAction(req, 'approved')}
                        className="px-4 py-2 text-xs font-bold inline-flex items-center shadow-md shadow-emerald-950/20"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation & Remarks Modal Dialog */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setSelectedRequest(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 z-10 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white ${
                  actionType === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {actionType === 'approved' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {actionType === 'approved' ? 'Approve Request' : 'Reject Request'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    {selectedRequest.request_id} • {selectedRequest.type.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Target Book / Title:</span>
                <span className="font-bold text-slate-800">{selectedRequest.title || selectedRequest.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Requester:</span>
                <span className="font-bold text-slate-800">{selectedRequest.requester_name}</span>
              </div>
              {selectedRequest.type === 'borrowing' && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Available Copies:</span>
                  <span className={`font-bold ${selectedRequest.book_available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {selectedRequest.book_available_copies} remaining
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleProcessAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Staff Remarks & Review Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for the applicant (e.g. Approved for 14-day borrowing / Book acquisition queued)..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={actionType === 'approved' ? 'primary' : 'danger'}
                  isLoading={isSubmittingAction}
                  className="px-5 py-2.5 text-xs font-bold shadow-md"
                >
                  Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
