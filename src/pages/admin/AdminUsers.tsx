// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRoleToggle = async (user: any) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    if (!confirm(`Are you sure you want to change "${user.first_name} ${user.last_name}" role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const response = await api.post('/users/update', {
        id: user.id,
        role: newRole
      });
      if (response.data && response.data.success) {
        fetchUsers();
        alert('User account role updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update user role.');
    }
  };

  const handleStatusToggle = async (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (newStatus === 'inactive' && !confirm(`Deactivating "${user.first_name} ${user.last_name}" will prevent them from borrowing books. Proceed?`)) {
      return;
    }

    try {
      const response = await api.post('/users/update', {
        id: user.id,
        status: newStatus
      });
      if (response.data && response.data.success) {
        fetchUsers();
        alert('User card validation status updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update user status.');
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
            onClick={() => handleRoleToggle(row)}
            className="text-[10px] py-1 px-2 border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Toggle admin/member privileges"
          >
            Switch Role
          </Button>

          <Button
            variant={row.status === 'active' ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => handleStatusToggle(row)}
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
    </div>
  );
};

export default AdminUsers;
