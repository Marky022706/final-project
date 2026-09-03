// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warn: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Auto dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((msg: string, dur?: number) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast(msg, 'error', dur), [addToast]);
  const warn = useCallback((msg: string, dur?: number) => addToast(msg, 'warning', dur), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast(msg, 'info', dur), [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warn, info }}>
      {children}

      {/* Floating Toasts Deck rendered in Portal */}
      {createPortal(
        <div className="fixed top-6 right-6 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((t) => {
            const typeConfig = {
              success: {
                bg: 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-emerald-900/10',
                badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
                bar: 'bg-emerald-500',
                icon: CheckCircle2,
                title: 'Success'
              },
              error: {
                bg: 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 dark:border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-rose-900/10',
                badgeBg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400',
                bar: 'bg-rose-500',
                icon: AlertCircle,
                title: 'System Notice'
              },
              warning: {
                bg: 'bg-white/95 dark:bg-slate-900/95 border-amber-500/30 dark:border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-amber-900/10',
                badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
                bar: 'bg-amber-500',
                icon: AlertTriangle,
                title: 'Attention'
              },
              info: {
                bg: 'bg-white/95 dark:bg-slate-900/95 border-sky-500/30 dark:border-sky-500/40 text-sky-950 dark:text-sky-100 shadow-sky-900/10',
                badgeBg: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400',
                bar: 'bg-sky-500',
                icon: Info,
                title: 'Information'
              },
            }[t.type];

            const Icon = typeConfig.icon;
            const duration = t.duration || 4000;

            return (
              <div
                key={t.id}
                role="alert"
                className={`relative flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-left overflow-hidden ${typeConfig.bg}`}
              >
                {/* Progress bar countdown */}
                <div
                  className={`absolute bottom-0 left-0 h-1 ${typeConfig.bar} opacity-70 animate-toast-progress`}
                  style={{ animationDuration: `${duration}ms` }}
                />

                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${typeConfig.badgeBg}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      {typeConfig.title}
                    </h4>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed mt-1 text-slate-700 dark:text-slate-300">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0 focus:outline-none"
                  aria-label="Close notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
