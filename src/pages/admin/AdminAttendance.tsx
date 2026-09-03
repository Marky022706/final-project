// src/pages/admin/AdminAttendance.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar, 
  User, 
  LogIn, 
  QrCode, 
  Activity
} from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Aggregating Municipal Attendance Logs...
        </p>
      </div>
    );
  }

  const maxPeakCount = stats?.peak_hours?.length 
    ? Math.max(...stats.peak_hours.map((h: any) => h.count), 1) 
    : 1;

  const maxDailyVisitors = stats?.daily_stats?.length 
    ? Math.max(...stats.daily_stats.map((d: any) => d.visitors), 1) 
    : 1;

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
              Library Attendance & Patron Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Real-time gate statistics, occupant counts, peak visiting patterns & timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/qr-scan">
            <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl flex items-center gap-2 text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/20 active:scale-95">
              <QrCode className="h-4 w-4" />
              <span>Launch Live Kiosk Scanner</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Visitors Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-lift interactive-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Check-Ins Today
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats?.total_visitors_today || 0}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Official Gate Logs</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <Activity className="h-3 w-3" /> Live
            </span>
          </div>
        </div>

        {/* Current Visitors Inside */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-lift interactive-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Currently In Library
              </span>
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
                {stats?.current_visitors_inside || 0}
              </span>
            </div>
            <div className="p-3.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100 dark:border-teal-900/40">
              <LogIn className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Occupancy Capacity</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">Active</span>
          </div>
        </div>

        {/* Average Visit Duration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-lift interactive-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Avg Visit Duration
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {stats?.average_visit_duration || '00:00:00'}
              </span>
            </div>
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/40">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Study & Reading</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Computed</span>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-lift interactive-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Peak Visiting Window
              </span>
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {stats?.peak_hours?.[0]?.hour ? `${stats.peak_hours[0].hour}:00` : '—'}
              </span>
            </div>
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-900/40">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Highest Traffic</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">30 Days</span>
          </div>
        </div>
      </div>

      {/* Peak Hours Visual Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Peak Visiting Hours & Traffic Distribution
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Visitor load aggregated across municipal library operational hours
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 sm:gap-4 h-48 pt-6 px-2">
          {stats?.peak_hours?.slice(0, 14).map((hour: any, idx: number) => {
            const heightPercent = Math.max(12, (hour.count / maxPeakCount) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                  {hour.count} Patrons at {hour.hour}:00
                </div>

                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                  {hour.count}
                </span>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden h-36 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 dark:from-purple-500 dark:to-indigo-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                  {hour.hour}:00
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Two Columns: Frequent Patrons & Daily Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequent Visitors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                Most Frequent Patrons
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
              Top Readers
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {stats?.frequent_visitors?.slice(0, 10).map((visitor: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                    {visitor.first_name?.[0] || 'U'}{visitor.last_name?.[0] || ''}
                  </div>
                  <div className="truncate">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {visitor.first_name} {visitor.last_name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {visitor.email}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {visitor.visit_count}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block">visits</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Attendance Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                Daily Visitor Statistics (Last 30 Days)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
              Timeline
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {stats?.daily_stats?.slice(0, 15).map((day: any, idx: number) => {
              const widthPct = Math.max(5, (day.visitors / maxDailyVisitors) * 100);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-24">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 w-10 text-right">
                    {day.visitors}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
