// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  Check, 
  Clock, 
  Users,
  Trash2,
  Edit,
  X,
  CheckSquare,
  UserCheck,
  Shield
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended' | 'inactive'>('all');
  const toast = useToast();

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // --- Role Switch Modal State ---
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTargetUsers, setRoleTargetUsers] = useState<any[] | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // --- Deactivate / Activate / Suspend Modal State ---
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetUsers, setStatusTargetUsers] = useState<any[] | null>(null);
  const [statusTargetType, setStatusTargetType] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [statusLoading, setStatusLoading] = useState(false);

  // --- Delete Modal State ---
  const [deleteConfirmUsers, setDeleteConfirmUsers] = useState<any[] | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [approvingId, setApprovingId] = useState<number | string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/list');
      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute live directory stats
  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter(u => u.status === 'pending').length;
    const active = users.filter(u => u.status === 'active').length;
    const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
    const suspended = users.filter(u => u.status === 'suspended' || u.status === 'inactive').length;
    return { total, pending, active, admins, suspended };
  }, [users]);

  // Selected users
  const selectedUsers = useMemo(() => {
    return users.filter(u => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  // --- Approve Pending User ---
  const handleApproveUser = async (user: any) => {
    setApprovingId(user.id);
    try {
      const response = await api.post('/users/update', {
        id: user.id,
        status: 'active'
      });
      if (response.data && response.data.success) {
        toast.success(`Library card for ${user.first_name} ${user.last_name} approved!`);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve user registration.');
    } finally {
      setApprovingId(null);
    }
  };

  // --- Batch Approve Pending Users ---
  const handleBatchApprove = async (usersList: any[]) => {
    const pending = usersList.filter(u => u.status === 'pending');
    if (pending.length === 0) return;
    setBatchLoading(true);
    try {
      const ids = pending.map(u => u.id);
      const response = await api.post('/users/update', {
        ids,
        status: 'active'
      });
      if (response.data && response.data.success) {
        toast.success(`Approved ${pending.length} library card registration(s)!`);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve selected members.');
    } finally {
      setBatchLoading(false);
    }
  };

  // --- Open Role Switch Confirmation ---
  const openRoleModal = (usersInput: any | any[]) => {
    const list = Array.isArray(usersInput) ? usersInput : [usersInput];
    setRoleTargetUsers(list);
    setRoleModalOpen(true);
  };

  const confirmRoleToggle = async (newRole?: string) => {
    if (!roleTargetUsers || roleTargetUsers.length === 0) return;
    const targetRole = newRole || (roleTargetUsers[0].role === 'admin' ? 'member' : 'admin');
    setRoleLoading(true);
    try {
      const ids = roleTargetUsers.map(u => u.id);
      const response = await api.post('/users/update', {
        ids,
        role: targetRole
      });
      if (response.data && response.data.success) {
        fetchUsers();
        toast.success(`Updated ${roleTargetUsers.length} member(s) role to ${targetRole.toUpperCase()}.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update user role(s).');
    } finally {
      setRoleLoading(false);
      setRoleModalOpen(false);
      setRoleTargetUsers(null);
    }
  };

  // --- Open Deactivate / Activate Confirmation ---
  const openStatusModal = (usersInput: any | any[], targetStatus?: 'active' | 'inactive' | 'suspended') => {
    const list = Array.isArray(usersInput) ? usersInput : [usersInput];
    setStatusTargetUsers(list);
    if (targetStatus) {
      setStatusTargetType(targetStatus);
    } else {
      setStatusTargetType(list[0]?.status === 'active' ? 'inactive' : 'active');
    }
    setStatusModalOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!statusTargetUsers || statusTargetUsers.length === 0) return;
    setStatusLoading(true);
    try {
      const ids = statusTargetUsers.map(u => u.id);
      const response = await api.post('/users/update', {
        ids,
        status: statusTargetType
      });
      if (response.data && response.data.success) {
        fetchUsers();
        toast.success(`Account status updated to ${statusTargetType} for ${statusTargetUsers.length} member(s).`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update user status.');
    } finally {
      setStatusLoading(false);
      setStatusModalOpen(false);
      setStatusTargetUsers(null);
    }
  };

  // --- Delete Confirmation Handlers ---
  const handleOpenDeleteConfirm = (usersInput: any | any[]) => {
    const list = Array.isArray(usersInput) ? usersInput : [usersInput];
    if (list.length === 0) return;
    if (list.some(u => u.id === currentUser?.id)) {
      toast.warn('You cannot delete your own logged-in administrator account.');
      return;
    }
    const withActiveLoans = list.filter(u => (u.active_loans || 0) > 0);
    if (withActiveLoans.length > 0) {
      toast.warn(`Deletion BLOCKED. ${withActiveLoans.length} of the selected members have active borrowed books in circulation.`);
      return;
    }
    setDeleteConfirmUsers(list);
  };

  const handleDeleteExecute = async (usersToDelete: any[]) => {
    if (!usersToDelete || usersToDelete.length === 0) return;
    setDeleteLoading(true);
    try {
      const ids = usersToDelete.map(u => u.id);
      const response = await api.post('/users/delete', { ids });
      if (response.data && response.data.success) {
        fetchUsers();
        setSelectedUserIds(prev => prev.filter(id => !ids.includes(id)));
        toast.success(response.data.message || `${usersToDelete.length} member account(s) deleted.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete member account(s).');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmUsers(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const pendingSelectedCount = selectedUsers.filter(u => u.status === 'pending').length;

  const columns = [
    {
      header: 'Member / Patron',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
            {row.first_name?.[0] || 'U'}{row.last_name?.[0] || ''}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <span>{row.email}</span>
              {row.qr_code && (
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  {row.qr_code}
                </span>
              )}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'last_name'
    },
    {
      header: 'Phone Contact',
      accessor: (row: any) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold font-mono">
          {row.phone || '—'}
        </span>
      )
    },
    {
      header: 'System Privilege',
      accessor: (row: any) => {
        const isSuper = row.role === 'superadmin';
        const isAdmin = row.role === 'admin';
        return (
          <span className={`px-3 py-1 border rounded-full text-[11px] font-bold capitalize inline-flex items-center gap-1.5 ${
            isSuper 
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-extrabold' 
              : isAdmin 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isSuper ? 'bg-amber-500' : isAdmin ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
            {row.role}
          </span>
        );
      },
      sortable: true,
      sortKey: 'role'
    },
    {
      header: 'Account Activity',
      accessor: (row: any) => (
        <div className="space-y-1 text-xs">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Active: <strong className="text-slate-800 dark:text-slate-200">{row.active_loans || 0} Loans</strong>
          </p>
          {parseFloat(row.total_unpaid_fines || 0) > 0 ? (
            <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Fine: ₱{parseFloat(row.total_unpaid_fines).toFixed(2)}
            </p>
          ) : (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Account in Good Standing</p>
          )}
        </div>
      )
    },
    {
      header: 'Directory Status',
      accessor: (row: any) => {
        if (row.status === 'pending') {
          return (
            <span className="px-3 py-1 border rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse flex items-center gap-1.5 w-fit">
              <Clock className="h-3 w-3" />
              Pending Review
            </span>
          );
        }
        if (row.status === 'suspended') {
          return (
            <span className="px-3 py-1 border rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
              Suspended
            </span>
          );
        }
        const isActive = row.status === 'active';
        return (
          <span className={`px-3 py-1 border rounded-full text-[11px] font-bold capitalize inline-flex items-center gap-1.5 ${
            isActive 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {row.status}
          </span>
        );
      },
      sortable: true,
      sortKey: 'status'
    }
  ];

  return (
    <div className="space-y-6 fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
              Municipal Member & Patron Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Review and approve registrations, manage role privileges, and inspect member standings
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Quick Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/60 dark:border-emerald-500/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Registered</span>
          <p className="text-2xl sm:text-3xl font-black">{stats.total}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift relative ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-900/20'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">Pending Approvals</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">{stats.pending}</p>
            {stats.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                Needs Action
              </span>
            )}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('active')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">Active Cardholders</span>
          <p className="text-2xl sm:text-3xl font-black">{stats.active}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('suspended')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
            statusFilter === 'suspended'
              ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-900/20'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Suspended Accounts</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400">{stats.suspended}</p>
        </div>
      </div>

      {/* Main Directory Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Querying member accounts...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          {/* Active Selection Actions Bar */}
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-lg border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  {selectedUserIds.length} {selectedUserIds.length === 1 ? 'Member' : 'Members'} Selected
                </span>
                {selectedUsers.length === 1 && (
                  <span className="text-xs text-slate-300 font-semibold hidden md:inline truncate max-w-sm">
                    "{selectedUsers[0].first_name} {selectedUsers[0].last_name}" ({selectedUsers[0].email})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Approve Pending Choice */}
                {pendingSelectedCount > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleBatchApprove(selectedUsers)}
                    isLoading={batchLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                    title="Approve Pending Registrations"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{pendingSelectedCount === 1 ? 'Approve Card' : `Approve (${pendingSelectedCount})`}</span>
                  </Button>
                )}

                {/* Change Role Choice */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRoleModal(selectedUsers)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                  title="Modify Privilege Role"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{selectedUsers.length === 1 ? 'Change Role' : `Role (${selectedUsers.length})`}</span>
                </Button>

                {/* Activate Choice */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusModal(selectedUsers, 'active')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                  title="Set status to Active"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Activate</span>
                </Button>

                {/* Deactivate Choice */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusModal(selectedUsers, 'inactive')}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                  title="Set status to Inactive"
                >
                  <UserX className="h-3.5 w-3.5 text-amber-400" />
                  <span>Deactivate</span>
                </Button>

                {/* Delete Choice */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOpenDeleteConfirm(selectedUsers)}
                  className="text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                  title="Delete Member Account(s)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{selectedUsers.length === 1 ? 'Delete' : `Delete (${selectedUsers.length})`}</span>
                </Button>

                {/* Deselect / Clear Choice */}
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
                  title="Deselect All"
                  aria-label="Deselect All"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredUsers}
            searchPlaceholder="Search directory by patron name, email, phone, QR code..."
            searchField={(row) => `${row.first_name} ${row.last_name} ${row.email} ${row.phone || ''} ${row.qr_code || ''}`}
            initialSortKey="last_name"
            itemsPerPage={10}
            selectable={true}
            selectedIds={selectedUserIds}
            onSelectionChange={(ids) => setSelectedUserIds(ids as string[])}
            rowIdKey="id"
            toolbarSlot={
              <div className="flex items-center gap-2">
                {selectedUserIds.length < filteredUsers.length && filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds(filteredUsers.map(u => u.id))}
                    className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select All ({filteredUsers.length})</span>
                  </button>
                )}
                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Deselect All</span>
                  </button>
                )}
              </div>
            }
          />
        </div>
      )}

      {/* ROLE SWITCH CONFIRMATION MODAL */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => { setRoleModalOpen(false); setRoleTargetUsers(null); }}
        title="Modify User Role & Privileges"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setRoleModalOpen(false); setRoleTargetUsers(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmRoleToggle()}
              isLoading={roleLoading}
              className="h-11 px-6 text-xs font-bold"
            >
              {roleLoading ? 'Updating Role...' : 'Toggle Role'}
            </Button>
          </div>
        }
      >
        {roleTargetUsers && roleTargetUsers.length > 0 && (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-md">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {roleTargetUsers.length === 1 
                  ? `Update access level for ${roleTargetUsers[0].first_name} ${roleTargetUsers[0].last_name}`
                  : `Update access level for ${roleTargetUsers.length} members`}
              </h4>
              {roleTargetUsers.length === 1 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Current Role: <strong className="text-emerald-600 dark:text-emerald-400">{roleTargetUsers[0].role.toUpperCase()}</strong>
                </p>
              )}
            </div>

            {isSuperAdmin && (
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('member')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95"
                >
                  Set Member
                </button>
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('admin')}
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all active:scale-95"
                >
                  Set Admin
                </button>
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('superadmin')}
                  className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 transition-all active:scale-95"
                >
                  Set Super Admin
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* STATUS TOGGLE CONFIRMATION MODAL */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setStatusTargetUsers(null); }}
        title="Confirm Account Status Change"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setStatusModalOpen(false); setStatusTargetUsers(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant={statusTargetType === 'active' ? 'primary' : 'danger'}
              onClick={confirmStatusToggle}
              isLoading={statusLoading}
              className="h-11 px-6 text-xs font-bold"
            >
              Confirm Status Change
            </Button>
          </div>
        }
      >
        {statusTargetUsers && statusTargetUsers.length > 0 && (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-md">
              <UserX className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 capitalize">
                Set {statusTargetType} Status
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {statusTargetUsers.length === 1 ? (
                  <>Are you sure you want to change status to <strong className="capitalize text-slate-800 dark:text-slate-200">{statusTargetType}</strong> for <strong>{statusTargetUsers[0].first_name} {statusTargetUsers[0].last_name}</strong>?</>
                ) : (
                  <>Are you sure you want to change status to <strong className="capitalize text-slate-800 dark:text-slate-200">{statusTargetType}</strong> for these <strong>{statusTargetUsers.length} members</strong>?</>
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmUsers && deleteConfirmUsers.length > 0}
        onClose={() => setDeleteConfirmUsers(null)}
        title={deleteConfirmUsers && deleteConfirmUsers.length > 1 ? `Confirm Deletion (${deleteConfirmUsers.length} Members)` : 'Confirm Deletion'}
        size={deleteConfirmUsers && deleteConfirmUsers.length > 1 ? 'md' : 'sm'}
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmUsers(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteLoading}
              onClick={() => {
                if (deleteConfirmUsers) {
                  handleDeleteExecute(deleteConfirmUsers);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              {deleteConfirmUsers && deleteConfirmUsers.length > 1 ? `Delete ${deleteConfirmUsers.length} Members` : 'Delete Member'}
            </Button>
          </div>
        }
      >
        {deleteConfirmUsers && deleteConfirmUsers.length > 0 && (
          <div className="space-y-4 text-center px-2 pt-2 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 mb-1 animate-pulse">
              <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {deleteConfirmUsers.length === 1 ? 'Confirm Account Deletion' : `Confirm Deletion of ${deleteConfirmUsers.length} Member Accounts`}
              </h4>
              {deleteConfirmUsers.length === 1 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you absolutely sure you want to permanently delete <span className="font-extrabold text-slate-800 dark:text-slate-100">"{deleteConfirmUsers[0].first_name} {deleteConfirmUsers[0].last_name}"</span>?
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you sure you want to permanently delete these <span className="font-bold text-rose-600 dark:text-rose-400">{deleteConfirmUsers.length} members</span>? This action cannot be undone.
                </p>
              )}
            </div>

            {deleteConfirmUsers.length > 1 && (
              <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Selected Members:
                </p>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {deleteConfirmUsers.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 truncate font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="truncate">{u.first_name} {u.last_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({u.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Internal icon alias
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AdminUsers;
