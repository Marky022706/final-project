// src/pages/admin/AdminActivityLog.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import { 
  Activity, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  BookOpen, 
  Users, 
  FileText
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
  'created': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'updated': 'bg-blue-100 text-blue-700 border-blue-200',
  'deleted': 'bg-rose-100 text-rose-700 border-rose-200',
  'borrowed': 'bg-teal-100 text-teal-700 border-teal-200',
  'returned': 'bg-purple-100 text-purple-700 border-purple-200',
  'registered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'login': 'bg-blue-100 text-blue-700 border-blue-200',
  'logout': 'bg-slate-100 text-slate-700 border-slate-200',
  'failed_login': 'bg-rose-100 text-rose-700 border-rose-200',
  'time_in': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'time_out': 'bg-amber-100 text-amber-700 border-amber-200',
  'invalid_qr_scan': 'bg-rose-100 text-rose-700 border-rose-200',
  'duplicate_scan': 'bg-amber-100 text-amber-700 border-amber-200',
};

export const AdminActivityLog: React.FC = () => {
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
        setLogs(response.data.data.logs);
        setStats(response.data.data.stats);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.data.total_count
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
      header: 'User',
      accessor: (row: ActivityLog) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (row: ActivityLog) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${actionColors[row.action] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {row.action.charAt(0).toUpperCase() + row.action.slice(1)}
        </span>
      ),
    },
    {
      header: 'Module',
      accessor: (row: ActivityLog) => {
        const Icon = moduleIcons[row.module] || Activity;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">{row.module}</span>
          </div>
        );
      },
    },
    {
      header: 'Description',
      accessor: (row: ActivityLog) => (
        <p className="text-sm text-slate-600 max-w-md truncate">
          {row.description}
        </p>
      ),
    },
    {
      header: 'Date & Time',
      accessor: (row: ActivityLog) => (
        <div className="text-sm text-slate-600">
          <p className="font-medium">
            {new Date(row.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(row.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessor: (row: ActivityLog) => (
        <span className="text-sm text-slate-500 font-mono">
          {row.ip_address || 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          Activity Log / Audit Trail
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Monitor all system actions performed by users
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.total_activities}
                </p>
                <p className="text-xs text-slate-500">Total Activities</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.recent_activities}
                </p>
                <p className="text-xs text-slate-500">Last 7 Days</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.by_module[0]?.count || 0}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.by_module[0]?.module || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.by_action[0]?.count || 0}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.by_action[0]?.action || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filters:</span>
          </div>
          
          <select
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
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
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
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
            placeholder="User ID"
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 w-24"
          />

          <input
            type="date"
            placeholder="From"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
          />

          <input
            type="date"
            placeholder="To"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
          />

          <button
            onClick={() => setFilters({ module: '', action: '', user_id: '', date_from: '', date_to: '' })}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            emptyMessage="No activity logs found"
          />
          
          {/* Pagination */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), offset: 0 })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              <button
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-slate-600">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.totalCount / pagination.limit)}
              </span>
              
              <button
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= pagination.totalCount}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminActivityLog;
