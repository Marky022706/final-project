// src/pages/admin/AdminActivityLog.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { 
  Activity, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  BookOpen, 
  Users, 
  FileText, 
  ShieldCheck, 
  RefreshCw, 
  Globe, 
  Clock 
} from 'lucide-react';

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  description: string;
  ip_address: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  previous_value: string | null;
  new_value: string | null;
  related_entity_id: number | null;
  related_entity_type: string | null;
}

interface ActivityStats {
  total_activities: number;
  by_module: Array<{ module: string; count: number }>;
  by_action: Array<{ action: string; count: number }>;
  recent_activities: number;
}

const moduleIcons: Record<string, any> = {
  'Books': BookOpen,
  'Users': Users,
  'Transactions': FileText,
  'Inventory': BookOpen,
  'Fines': FileText,
  'Reservations': BookOpen,
  'Attendance': Calendar,
  'Authentication': UserIcon,
  'Members': Users,
};

const actionColors: Record<string, string> = {
  'created': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'updated': 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'deleted': 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'borrowed': 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'returned': 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'registered': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'login': 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'logout': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  'failed_login': 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'time_in': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'time_out': 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'invalid_qr_scan': 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'duplicate_scan': 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

export const AdminActivityLog: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    totalCount: 0,
  });

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      if (filters.user_id) params.user_id = parseInt(filters.user_id);
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      params.limit = pagination.limit;
      params.offset = pagination.offset;

      const response = await api.get('/activity-logs/list', { params });
      
      if (response.data && response.data.success) {
        setLogs(response.data.data.logs || []);
        setStats(response.data.data.stats || null);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.data.total_count || 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [filters, pagination.offset, pagination.limit]);

  const columns = [
    {
      header: 'Actor / User',
      accessor: (row: ActivityLog) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
            {row.first_name?.[0] || 'U'}{row.last_name?.[0] || ''}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {row.email}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'last_name'
    },
    {
      header: 'Action Executed',
      accessor: (row: ActivityLog) => (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${actionColors[row.action] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
          {row.action ? row.action.replace('_', ' ').toUpperCase() : 'ACTION'}
        </span>
      ),
      sortable: true,
      sortKey: 'action'
    },
    {
      header: 'System Module',
      accessor: (row: ActivityLog) => {
        const Icon = moduleIcons[row.module] || Activity;
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-xs text-slate-700 dark:text-slate-200">{row.module}</span>
          </div>
        );
      },
      sortable: true,
      sortKey: 'module'
    },
    {
      header: 'Event Description',
      accessor: (row: ActivityLog) => (
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md font-medium leading-relaxed">
          {row.description}
        </p>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (row: ActivityLog) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            {new Date(row.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            {new Date(row.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
      ),
      sortable: true,
      sortKey: 'created_at'
    },
    {
      header: 'Origin IP',
      accessor: (row: ActivityLog) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 flex items-center gap-1 w-fit">
          <Globe className="h-3 w-3 text-slate-400" />
          {row.ip_address || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
              Activity Log & System Audit Trail
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Forensic audit logs, administrative mutations, authorization checks & security history
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchActivityLogs}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift interactive-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Audit Events</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                  {stats.total_activities}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift interactive-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Last 7 Days</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {stats.recent_activities}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift interactive-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Top Active Module</span>
                <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 truncate">
                  {stats.by_module[0]?.module || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift interactive-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Frequent Action</span>
                <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 capitalize truncate">
                  {stats.by_action[0]?.action || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mr-2">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          <select
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Modules</option>
            <option value="Books">Books</option>
            <option value="Users">Users</option>
            <option value="Transactions">Transactions</option>
            <option value="Inventory">Inventory</option>
            <option value="Fines">Fines</option>
            <option value="Reservations">Reservations</option>
            <option value="Attendance">Attendance</option>
            <option value="Authentication">Authentication</option>
            <option value="Members">Members</option>
          </select>

          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="borrowed">Borrowed</option>
            <option value="returned">Returned</option>
            <option value="registered">Registered</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="failed_login">Failed Login</option>
            <option value="time_in">Time In</option>
            <option value="time_out">Time Out</option>
            <option value="invalid_qr_scan">Invalid QR Scan</option>
            <option value="duplicate_scan">Duplicate Scan</option>
          </select>

          <input
            type="text"
            placeholder="User ID..."
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 w-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          <input
            type="date"
            placeholder="From"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          <input
            type="date"
            placeholder="To"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          <button
            onClick={() => setFilters({ module: '', action: '', user_id: '', date_from: '', date_to: '' })}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Querying audit logs...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <DataTable
            columns={columns}
            data={logs}
            searchPlaceholder="Search audit events by user, action, module, description..."
            searchField={(row) => `${row.first_name} ${row.last_name} ${row.email} ${row.action} ${row.module} ${row.description}`}
            initialSortKey="created_at"
            itemsPerPage={15}
          />
          
          {/* Pagination Bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-800 dark:text-slate-200">{pagination.offset + 1}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(pagination.offset + pagination.limit, pagination.totalCount)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{pagination.totalCount}</strong> entries
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), offset: 0 })}
                className="px-3 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              <button
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Previous
              </button>
              
              <span className="px-2 font-bold text-slate-600 dark:text-slate-400">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.max(1, Math.ceil(pagination.totalCount / pagination.limit))}
              </span>
              
              <button
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= pagination.totalCount}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLog;
