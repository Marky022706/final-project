// src/pages/public/TermsOfService.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 gradient-bg flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white">
              <img src={logoImg} alt="Library Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-800 m-0 leading-tight">
                Balingasag Municipal
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-extrabold uppercase tracking-wider leading-none mt-0.5">
                Public Library
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-600 px-4 rounded-xl hover:bg-emerald-50/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-3xl p-8 md:p-12 space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none m-0">
                Terms of Service
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                Last Updated: May 25, 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed md:text-base">
            <p>
              By registering an account and using the Balingasag Municipal Public Library digital portal, you agree to comply with the terms and guidelines detailed below. Please read these terms carefully.
            </p>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              1. Account Eligibility and Responsibilities
            </h2>
            <p>
              To borrow physical library items or reserve books online, you must create a validated library card account. You are responsible for keeping your credentials confidential and are liable for all actions taken under your account.
            </p>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              2. Borrowing & Renewal Policies
            </h2>
            <p>
              Members must strictly adhere to the following borrowing guidelines:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A member may borrow up to a maximum of <strong>3 books</strong> simultaneously.</li>
              <li>The standard borrowing period for books is <strong>14 days</strong>.</li>
              <li>Accounts with outstanding late balances or unreturned items will be restricted from reserving new catalog books.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              3. Late Returns & Fines
            </h2>
            <p>
              To ensure all community members have equal access to reading materials, the library enforces strict penalty policies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any book returned past its due date will incur a late return penalty of <strong>₱5.00 per day</strong>.</li>
              <li>Unpaid fines will accumulate on the user's dashboard and must be fully paid at the municipal library counter to restore full borrowing rights.</li>
              <li>Damaged or lost items must be replaced with the exact edition or paid for at full replacement value.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              4. Code of Conduct
            </h2>
            <p>
              Users agree to use our digital registry and library premises respectfully. We reserve the right to suspend or terminate accounts that engage in fraudulent behavior, damage physical property, or systematically hoard books.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
