// src/components/member/MemberLibraryCardModal.tsx
import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { IdCard, Printer, X, ShieldCheck } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import Button from '../common/Button';

interface MemberLibraryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const MemberLibraryCardModal: React.FC<MemberLibraryCardModalProps> = ({ isOpen, onClose, user }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !user) return null;

  const qrValue = user.qr_code || `LIB-MEM-${user.id}`;
  const fullName = `${user.first_name || ''} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name || ''}`.trim() || 'Library Cardholder';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-scale-up space-y-5 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Official Digital Library Card
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Scan this card for instant library check-in and book borrowing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* The Card View */}
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-emerald-950 via-primary-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 overflow-hidden space-y-6"
        >
          {/* Background Decorative Rings */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-white p-0.5 shadow-sm">
                <img src={logoImg} alt="Logo" className="h-full w-full object-cover rounded-full" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold tracking-wide text-white uppercase">
                  Balingasag Municipal Library
                </h4>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  Misamis Oriental • Smart Library Card
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-3 flex-1 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Cardholder Name
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {fullName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Member ID
                  </span>
                  <p className="font-mono font-bold text-emerald-300">
                    {user.id}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Member Since
                  </span>
                  <p className="font-medium text-slate-200">
                    {user.member_since || new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-emerald-400/40 flex flex-col items-center gap-1.5 shrink-0">
              <QRCode
                value={qrValue}
                size={96}
                level="H"
              />
              <span className="text-[9px] font-mono font-bold text-slate-600">
                {qrValue}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              Verified Cardholder
            </span>
            <span className="font-mono">Republic of the Philippines</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2 text-xs font-bold">
            Close
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
          >
            <Printer className="h-4 w-4" />
            <span>Print Library Card</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MemberLibraryCardModal;
