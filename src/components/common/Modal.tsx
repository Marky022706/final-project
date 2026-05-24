// src/components/common/Modal.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFooter?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showFooter = true,
}) => {
  // Prevent scrolling behind modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-modal-backdrop"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div className={`relative w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-modal-dialog z-10 ${sizes[size]} max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 leading-relaxed">
          {children}
        </div>

        {/* Footer Actions */}
        {showFooter && (
          footer ? (
            <div className="px-6 pt-4.5 pb-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              {footer}
            </div>
          ) : (
            <div className="px-6 pt-4.5 pb-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="h-11 px-5 text-xs font-bold">
                Dismiss
              </Button>
            </div>
          )
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
