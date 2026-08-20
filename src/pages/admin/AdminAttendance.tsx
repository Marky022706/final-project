// src/pages/admin/AdminAttendance.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Users, Clock, TrendingUp, Calendar, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load attendance statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Library Attendance Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Monitor visitor statistics, peak hours, and attendance history
          </p>
        </div>
        <Link to="/admin/qr-scan">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 text-xs transition-all shadow-md shadow-emerald-100">
            <LogIn className="h-4 w-4" />
            QR Scanner
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visitors Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Today</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats?.total_visitors_today || 0}</span>
            </div>
          </div>
        </div>

        {/* Current Visitors Inside */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex-shrink-0">
              <LogIn className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inside Now</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats?.current_visitors_inside || 0}</span>
            </div>
          </div>
        </div>

        {/* Average Visit Duration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex-shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Duration</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats?.average_visit_duration || '00:00:00'}</span>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 flex-shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Hour</span>
              <span className="text-2xl font-extrabold text-slate-800">
                {stats?.peak_hours?.[0]?.hour ? `${stats.peak_hours[0].hour}:00` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          Peak Visiting Hours (Last 30 Days)
        </h3>
        <div className="flex items-end gap-3 h-40">
          {stats?.peak_hours?.slice(0, 12).map((hour: any, idx: number) => {
            const maxCount = Math.max(...stats.peak_hours.map((h: any) => h.count));
            const heightPercent = (hour.count / maxCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-purple-100 rounded-t-lg transition-all hover:bg-purple-200"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="h-full bg-purple-500 rounded-t-lg" style={{ height: '100%' }} />
                </div>
                <span className="text-[10px] font-bold text-slate-600">{hour.count}</span>
                <span className="text-[9px] text-slate-400">{hour.hour}:00</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Visitors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Most Frequent Visitors
          </h3>
          <div className="space-y-3">
            {stats?.frequent_visitors?.slice(0, 10).map((visitor: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {visitor.first_name[0]}{visitor.last_name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{visitor.first_name} {visitor.last_name}</p>
                    <p className="text-[10px] text-slate-400">{visitor.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600">{visitor.visit_count}</span>
                  <span className="text-[10px] text-slate-400 block">visits</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Daily Visitor Statistics (Last 30 Days)
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats?.daily_stats?.slice(0, 15).map((day: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <span className="text-xs font-medium text-slate-600 w-24">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(day.visitors / (stats.daily_stats[0]?.visitors || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">{day.visitors}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
