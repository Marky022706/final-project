// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ShieldCheck, UserX, Check, Clock } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended' | 'inactive'>('all');
  const toast = useToast();

  // --- Role Switch Modal State ---
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState<any>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // --- Deactivate / Activate / Suspend Modal State ---
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/list');
      if (response.data && response.data.success) {
        setUsers(response.data.data);
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

  // --- Open Role Switch Confirmation ---
  const openRoleModal = (user: any) => {
    setRoleTargetUser(user);
    setRoleModalOpen(true);
  };

  const confirmRoleToggle = async (newRole?: string) => {
    if (!roleTargetUser) return;
    const targetRole = newRole || (roleTargetUser.role === 'admin' ? 'member' : 'admin');
    setRoleLoading(true);
    try {
      const response = await api.post('/users/update', {
        id: roleTargetUser.id,
        role: targetRole
      });
      if (response.data && response.data.success) {
        fetchUsers();
        toast.success(`"${roleTargetUser.first_name} ${roleTargetUser.last_name}" role updated to ${targetRole.toUpperCase()}.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update user role.');
    } finally {
      setRoleLoading(false);
      setRoleModalOpen(false);
      setRoleTargetUser(null);
    }
  };

  // --- Open Deactivate / Activate Confirmation ---
  const openStatusModal = (user: any) => {
    setStatusTargetUser(user);
    setStatusModalOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!statusTargetUser) return;
    const newStatus = statusTargetUser.status === 'active' ? 'inactive' : 'active';
    setStatusLoading(true);
    try {
      const response = await api.post('/users/update', {
        id: statusTargetUser.id,
        status: newStatus
      });
      if (response.data && response.data.success) {
        fetchUsers();
        toast.success(`"${statusTargetUser.first_name} ${statusTargetUser.last_name}" account ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update user status.');
    } finally {
      setStatusLoading(false);
      setStatusModalOpen(false);
      setStatusTargetUser(null);
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const columns = [
    {
      header: 'Member Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold select-none text-xs">
            {row.first_name?.[0] || 'U'}{row.last_name?.[0] || 'N'}
          </div>
          <div>
            <p className="font-extrabold text-slate-700 leading-snug">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {row.email} {row.qr_code && <span className="font-mono text-emerald-600 font-bold">[{row.qr_code}]</span>}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'last_name'
    },
    {
      header: 'Phone Contact',
      accessor: (row: any) => <span className="text-xs text-slate-500 font-semibold">{row.phone || '—'}</span>
    },
    {
      header: 'System Role',
      accessor: (row: any) => {
        const isSuper = row.role === 'superadmin';
        const isAdmin = row.role === 'admin';
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold capitalize ${
            isSuper 
              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' 
              : (isAdmin ? 'bg-primary-950/10 text-primary-900 border-primary-950/20 font-bold' : 'bg-slate-50 text-slate-500 border-slate-100')
          }`}>
            {row.role}
          </span>
        );
      },
      sortable: true,
      sortKey: 'role'
    },
    {
      header: 'Dues / Borrows Stats',
      accessor: (row: any) => (
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-semibold leading-none">
            Active: <span className="font-bold text-slate-700">{row.active_loans || 0} Checkouts</span>
          </p>
          {parseFloat(row.total_unpaid_fines || 0) > 0 ? (
            <p className="text-[10px] text-rose-500 font-bold leading-none flex items-center gap-0.5 animate-pulse">
              <ShieldAlert className="h-3 w-3" />
              Fine: ₱{parseFloat(row.total_unpaid_fines).toFixed(2)}
            </p>
          ) : (
            <p className="text-[9px] text-emerald-600 font-bold leading-none">Account Clean</p>
          )}
        </div>
      )
    },
    {
      header: 'Verification Status',
      accessor: (row: any) => {
        if (row.status === 'pending') {
          return (
            <span className="px-2.5 py-0.5 border rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-200 animate-pulse flex items-center gap-1 w-fit">
              <Clock className="h-3 w-3" />
              Pending Review
            </span>
          );
        }
        if (row.status === 'suspended') {
          return (
            <span className="px-2.5 py-0.5 border rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border-rose-200">
              Suspended
            </span>
          );
        }
        const isActive = row.status === 'active';
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold capitalize ${
            isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
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
        if (row.status === 'pending') {
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="primary"
                size="sm"
                isLoading={approvingId === row.id}
                onClick={() => handleApproveUser(row)}
                className="text-[10px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold inline-flex items-center gap-1 shadow-sm"
              >
                <Check className="h-3 w-3" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openStatusModal(row)}
                className="text-[10px] py-1 px-2 border-rose-200 hover:bg-rose-50 text-rose-600"
              >
                Reject
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRoleModal(row)}
              className="text-[10px] py-1 px-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
              title="Toggle role privileges"
            >
              Role
            </Button>

            <Button
              variant={row.status === 'active' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => openStatusModal(row)}
              className={`text-[10px] py-1 px-2 border-slate-200 font-medium ${
                row.status === 'active' 
                  ? 'hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600' 
                  : 'hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700'
              }`}
              title="Enable/Disable borrower account"
            >
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Municipal Member Directory
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Approve new registrations, manage user roles, and monitor member accounts
          </p>
        </div>

        {/* Status Filter Segment */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            All ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100/60'
            }`}
          >
            Pending Review {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold">{pendingCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Active ({users.filter(u => u.status === 'active').length})
          </button>
        </div>
      </div>

      {/* Main Table view */}
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
          data={filteredUsers}
          searchPlaceholder="Query directory by member name, email, QR code..."
          searchField={(row) => `${row.first_name} ${row.last_name} ${row.email} ${row.qr_code || ''}`}
          initialSortKey="last_name"
          itemsPerPage={10}
        />
      )}

      {/* ROLE SWITCH CONFIRMATION MODAL */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => { setRoleModalOpen(false); setRoleTargetUser(null); }}
        title="Change User Role"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRoleModalOpen(false); setRoleTargetUser(null); }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={roleLoading}
              onClick={() => confirmRoleToggle()}
              className="text-xs"
            >
              Confirm Role
            </Button>
          </div>
        }
      >
        {roleTargetUser && (
          <div className="space-y-4 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">
                Update privileges for "{roleTargetUser.first_name} {roleTargetUser.last_name}"
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Current role: <strong>{roleTargetUser.role.toUpperCase()}</strong>.
              </p>
            </div>

            {isSuperAdmin && (
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('member')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Set Member
                </button>
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('admin')}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-xs font-bold text-emerald-800"
                >
                  Set Admin
                </button>
                <button
                  type="button"
                  onClick={() => confirmRoleToggle('superadmin')}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-xl text-xs font-bold text-amber-900"
                >
                  Set Super Admin
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* DEACTIVATE / ACTIVATE CONFIRMATION MODAL */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setStatusTargetUser(null); }}
        title="Confirm Status Change"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStatusModalOpen(false); setStatusTargetUser(null); }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={statusLoading}
              onClick={confirmStatusToggle}
              className="text-xs"
            >
              Confirm Status
            </Button>
          </div>
        }
      >
        {statusTargetUser && (
          <div className="space-y-4 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 mb-1">
              <UserX className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">
                Toggle Account Status
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Are you sure you want to change the status for <span className="font-extrabold text-slate-700">"{statusTargetUser.first_name} {statusTargetUser.last_name}"</span>?
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
