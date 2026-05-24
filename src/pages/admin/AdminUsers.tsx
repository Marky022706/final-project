// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, ShieldCheck, UserX, UserCheck, AlertTriangle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // --- Role Switch Modal State ---
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState<any>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // --- Deactivate / Activate Modal State ---
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // --- Open Role Switch Confirmation ---
  const openRoleModal = (user: any) => {
    setRoleTargetUser(user);
    setRoleModalOpen(true);
  };

  const confirmRoleToggle = async () => {
    if (!roleTargetUser) return;
    const newRole = roleTargetUser.role === 'admin' ? 'member' : 'admin';
    setRoleLoading(true);
    try {
      const response = await api.post('/users/update', {
        id: roleTargetUser.id,
        role: newRole
      });
      if (response.data && response.data.success) {
        fetchUsers();
        toast.success(`"${roleTargetUser.first_name} ${roleTargetUser.last_name}" role updated to ${newRole.toUpperCase()}.`);
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

  const columns = [
    {
      header: 'Member Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold select-none text-xs">
            {row.first_name[0]}{row.last_name[0]}
          </div>
          <div>
            <p className="font-extrabold text-slate-700 leading-snug">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Registered: {row.email}</p>
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
        const isAdmin = row.role === 'admin';
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold capitalize ${
            isAdmin ? 'bg-primary-950/10 text-primary-900 border-primary-950/20' : 'bg-slate-50 text-slate-500 border-slate-100'
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
            Active: <span className="font-bold text-slate-700">{row.active_loans} Checkouts</span>
          </p>
          {parseFloat(row.total_unpaid_fines) > 0 ? (
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
        const isActive = row.status === 'active';
        return (
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold capitalize ${
            isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
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
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRoleModal(row)}
            className="text-[10px] py-1 px-2 border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Toggle admin/member privileges"
          >
            Switch Role
          </Button>

          <Button
            variant={row.status === 'active' ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => openStatusModal(row)}
            className={`text-[10px] py-1 px-2 border-slate-200 ${
              row.status === 'active' 
                ? 'hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600' 
                : 'hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700'
            }`}
            title="Enable/Disable borrower account"
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  // --- Derived values for modals ---
  const roleTargetName = roleTargetUser ? `${roleTargetUser.first_name} ${roleTargetUser.last_name}` : '';
  const roleNewRole = roleTargetUser?.role === 'admin' ? 'MEMBER' : 'ADMIN';

  const statusTargetName = statusTargetUser ? `${statusTargetUser.first_name} ${statusTargetUser.last_name}` : '';
  const isDeactivating = statusTargetUser?.status === 'active';

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          Municipal Member Directory
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Manage user permissions, de-activate delinquent members, and review accounts dues
        </p>
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
          data={users}
          searchPlaceholder="Query directory by member name, email..."
          searchField={(row) => `${row.first_name} ${row.last_name} ${row.email}`}
          initialSortKey="last_name"
          itemsPerPage={10}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          ROLE SWITCH CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => { setRoleModalOpen(false); setRoleTargetUser(null); }}
        title="Confirm Role Change"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setRoleModalOpen(false); setRoleTargetUser(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmRoleToggle}
              disabled={roleLoading}
              className="h-11 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
            >
              {roleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
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
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-amber-500" />
          </div>

          {/* Prompt */}
          <div>
            <p className="text-sm font-bold text-slate-800 leading-snug">
              Are you sure you want to change
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-1">
              "{roleTargetName}"
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              role to <span className={`font-extrabold ${roleNewRole === 'ADMIN' ? 'text-primary-700' : 'text-slate-600'}`}>{roleNewRole}</span>?
            </p>
          </div>

          {/* Warning Callout */}
          <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-100 rounded-xl p-3 text-left w-full">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
              {roleNewRole === 'ADMIN'
                ? 'Granting admin privileges will allow this user to manage books, users, and system settings.'
                : 'Revoking admin privileges will restrict this user to member-level access only.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          DEACTIVATE / ACTIVATE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setStatusTargetUser(null); }}
        title={isDeactivating ? 'Deactivate Account' : 'Activate Account'}
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { setStatusModalOpen(false); setStatusTargetUser(null); }}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmStatusToggle}
              disabled={statusLoading}
              className={`h-11 px-5 text-xs font-bold text-white border-transparent ${
                isDeactivating
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {statusLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isDeactivating ? 'Proceed' : 'Activate Account'
              )}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          {/* Icon */}
          <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${
            isDeactivating
              ? 'bg-rose-50 border-rose-100'
              : 'bg-emerald-50 border-emerald-100'
          }`}>
            {isDeactivating
              ? <UserX className="h-7 w-7 text-rose-500" />
              : <UserCheck className="h-7 w-7 text-emerald-500" />
            }
          </div>

          {/* Prompt */}
          <div>
            {isDeactivating ? (
              <>
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  Deactivating <span className="font-extrabold text-slate-900">"{statusTargetName}"</span>
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  will prevent them from borrowing books. Proceed?
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  Re-activate <span className="font-extrabold text-slate-900">"{statusTargetName}"</span>?
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  This will restore their borrowing privileges.
                </p>
              </>
            )}
          </div>

          {/* Warning / Info Callout */}
          <div className={`flex items-start gap-2.5 border rounded-xl p-3 text-left w-full ${
            isDeactivating
              ? 'bg-rose-50/80 border-rose-100'
              : 'bg-emerald-50/80 border-emerald-100'
          }`}>
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
              isDeactivating ? 'text-rose-500' : 'text-emerald-500'
            }`} />
            <p className={`text-[11px] font-semibold leading-relaxed ${
              isDeactivating ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {isDeactivating
                ? 'The member will no longer be able to log in or borrow any materials until their account is re-activated by an administrator.'
                : 'The member will regain full access to their account, including the ability to borrow books and view their history.'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
