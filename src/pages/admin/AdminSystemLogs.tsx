// src/pages/admin/AdminSystemLogs.tsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, AlertTriangle, AlertCircle, Info, Shield, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';

export const AdminSystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logType, setLogType] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (logType) params.log_type = logType;
      if (severity) params.severity = severity;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/system-logs/list', { params });
      if (response.data && response.data.success) {
        setLogs(response.data.data.logs || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType, severity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="h-3 w-3 text-blue-600" />
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              System & Security Event Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Super Admin audit records of authentication failures, backup operations, and security exceptions
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={fetchLogs} className="px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Type</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Event Types</option>
              <option value="auth_failure">Authentication Failure</option>
              <option value="backup">Database Backup</option>
              <option value="restore">Database Restore</option>
              <option value="security_alert">Security Alert</option>
              <option value="system_error">System Exception</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search log messages or IP address..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Logs Table / Cards */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-800 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading system event records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No system events logged</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No system warnings or security alerts match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          {logs.map((lg) => (
            <div key={lg.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(lg.severity)}
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                    [{lg.log_type}]
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(lg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {lg.message}
                </p>
              </div>

              {lg.ip_address && (
                <div className="text-right text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl shrink-0">
                  IP: {lg.ip_address}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSystemLogs;
