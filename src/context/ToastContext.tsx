// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const warn = useCallback((msg: string) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  // Hook into console.warn and console.error globally to turn them into UI notifications
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    // console.warn = (...args) => {
    //   originalWarn(...args);
    //   const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

    //   // Filter out framework dev noise to prevent UI alert spam
    //   if (
    //     message.includes('Warning:') ||
    //     message.includes('react-dom') ||
    //     message.includes('react-router') ||
    //     message.includes('recharts') ||
    //     message.includes('Vite') ||
    //     message.includes('HMR') ||
    //     message.includes('lucide-react') ||
    //     message.includes('tailwind')
    //   ) {
    //     return;
    //   }

    //   warn(message);
    // };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

      // Filter out framework dev noise to prevent UI alert spam
      if (
        message.includes('Warning:') ||
        message.includes('react-dom') ||
        message.includes('react-router') ||
        message.includes('recharts') ||
        message.includes('Download the React DevTools')
      ) {
        return;
      }

      error(message);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [warn, error]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warn, info }}>
      {children}

      {/* Floating Toasts Deck in Top-Right Corner */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-emerald-50/95 border-emerald-200 text-emerald-800 shadow-emerald-100/40',
            error: 'bg-rose-50/95 border-rose-200 text-rose-800 shadow-rose-100/40',
            warning: 'bg-amber-50/95 border-amber-200 text-amber-800 shadow-amber-100/40',
            info: 'bg-sky-50/95 border-sky-200 text-sky-800 shadow-sky-100/40',
          };

          const Icon = {
            success: CheckCircle,
            error: AlertCircle,
            warning: AlertTriangle,
            info: AlertCircle,
          }[t.type];

          const iconColors = {
            success: 'text-emerald-500',
            error: 'text-rose-500',
            warning: 'text-amber-500',
            info: 'text-sky-500',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-auto fade-in ${typeStyles[t.type]}`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold capitalize Outfit leading-tight">
                  {t.type === 'error' ? 'System Notification' : `${t.type} alert`}
                </h4>
                <p className="text-[11px] font-semibold leading-relaxed mt-1 text-slate-700">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 focus:outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
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
