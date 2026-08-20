// src/pages/member/MemberActivityHistory.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Clock, BookOpen, Key, UserCheck, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export const MemberActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/member-features/activity');
      if (response.data && response.data.success) {
        setActivities(response.data.data.activities || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch your account activities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <Key className="h-4 w-4 text-emerald-600" />;
      case 'registered':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'borrow_request':
      case 'borrow':
        return <BookOpen className="h-4 w-4 text-teal-600" />;
      case 'return':
      case 'renew':
        return <RotateCcw className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3.5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            My Account Activity History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Chronological audit log of your library logins, borrowing requests, loans, returns, and digital reads
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading your personal activity history...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No activity recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your login events, book checkouts, reservations, and reading history will appear here.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {activities.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 h-6 w-6 rounded-full bg-white border-2 border-emerald-500 shadow-sm flex items-center justify-center">
                {getActionIcon(item.action)}
              </div>

              {/* Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {item.module}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberActivityHistory;
