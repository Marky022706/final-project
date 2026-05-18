// src/pages/Fines.tsx
import React from 'react';
import useFetch from '../hooks/useFetch';
import Card from '../components/common/Card';
import { Wallet, AlertCircle, Calendar, CheckCircle2, Coins, ArrowRight } from 'lucide-react';

export const Fines: React.FC = () => {
  const { data: fines, loading } = useFetch<any[]>('/fines/list');

  // Sum total unpaid fines
  const totalUnpaid = fines
    ? fines
        .filter((fine) => fine.status === 'unpaid')
        .reduce((sum, fine) => sum + parseFloat(fine.amount), 0)
    : 0;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          My Fines & Dues
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Check unpaid penalties and past settled fine cards
        </p>
      </div>

      {/* Aggregate Unpaid fine alert card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between h-36 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-transparent shadow-lg shadow-emerald-100">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                Total Outstanding Fines
              </span>
              <h3 className="text-3xl font-extrabold tracking-tight">
                ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalUnpaid)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <Wallet className="h-5.5 w-5.5 text-white" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-100 font-semibold">
            Outstanding balance must be settled to resume borrowing privileges
          </p>
        </Card>

        {/* Cash payment guidance note */}
        <Card className="md:col-span-2 flex gap-4 border-slate-100">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <Coins className="h-6 w-6" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-slate-800">Cash Settlement Guidelines</h4>
            <p className="text-slate-500 font-semibold leading-relaxed mt-0.5">
              To settle any outstanding library fines, please visit the Balingasag Municipal Cashier desk located at the library main office. Present your library card, specify your fine card number, and pay the exact amount. 
            </p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 pt-1.5 uppercase tracking-wide">
              <span>Office hours: Monday - Friday 8:00 AM to 5:00 PM</span>
              <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </Card>
      </div>

      {/* Fines Lists */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      ) : !fines || fines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-600">No Fines Issued</h4>
          <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
            Excellent! Your account maintains a perfect, clean record with zero overdue penalties.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Fines Ledger Registry</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {fines.map((fine) => {
              const isUnpaid = fine.status === 'unpaid';
              return (
                <div 
                  key={fine.id} 
                  className={`p-5 rounded-2xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${
                    isUnpaid ? 'border-rose-100 bg-rose-50/5' : 'border-slate-150 border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border mt-0.5 flex-shrink-0 ${
                      isUnpaid ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {isUnpaid ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {fine.book_title}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          Card: {fine.fine_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-normal font-semibold">
                        {fine.reason}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Issued {new Date(fine.created_at).toLocaleDateString()}
                        </span>
                        {fine.paid_date && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Settled {new Date(fine.paid_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                    <span className={`text-base font-extrabold tracking-tight ${isUnpaid ? 'text-rose-600' : 'text-slate-500'}`}>
                      ₱{parseFloat(fine.amount).toFixed(2)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mt-1 ${
                      isUnpaid 
                        ? 'bg-rose-50 text-rose-500 border-rose-100' 
                        : fine.status === 'waived' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {fine.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;
