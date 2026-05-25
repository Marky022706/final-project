// src/pages/Notifications.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import Button from '../components/common/Button';
import { Bell, Check, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { refreshProfile } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/get');
      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (err) {
      console.error('Failed to load notifications list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      const response = await api.post('/notifications/get?action=mark_read', { id });
      if (response.data && response.data.success) {
        fetchNotifs();
        refreshProfile();
      }
    } catch (err) {
      console.error('Error marking unread Alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    
    setActionLoading(true);
    try {
      const response = await api.post('/notifications/get?action=mark_all_read');
      if (response.data && response.data.success) {
        fetchNotifs();
        refreshProfile();
      }
    } catch (err) {
      console.error('Error marking all Alerts as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Library Notifications
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Track unread alerts, checkout reminders, and payment receipts
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={actionLoading}
            onClick={handleMarkAllRead}
            className="text-xs"
          >
            <Check className="h-4 w-4 mr-2" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
          <CheckCircle className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-600">No alerts listed</h4>
          <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
            Your notifications queue is empty.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const isRead = n.is_read;
            const isOverdue = n.type === 'overdue';
            
            return (
              <div 
                key={n.id} 
                className={`p-5 rounded-2xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${
                  isRead ? 'border-slate-100 bg-white' : 'border-emerald-100 bg-emerald-50/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border mt-0.5 flex-shrink-0 ${
                    isOverdue 
                      ? 'bg-rose-50 text-rose-500 border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {isOverdue ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 pt-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs self-end sm:self-center border border-slate-100 hover:bg-slate-50"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
