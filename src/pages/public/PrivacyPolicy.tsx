// src/pages/public/PrivacyPolicy.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none m-0">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                Last Updated: May 25, 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed md:text-base">
            <p>
              At Balingasag Municipal Public Library, we are committed to protecting the privacy of our members, visitors, and users of our digital portal. This Privacy Policy details how we collect, use, and protect your information when you register and interact with our services.
            </p>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              1. Information We Collect
            </h2>
            <p>
              To provide access to our physical book registry and borrow services, we collect necessary personal details:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Credentials:</strong> Full name, email address, password hash, and member profile details.</li>
              <li><strong>Contact Information:</strong> Phone number and mailing address for catalog reservation alerts and late notification reminders.</li>
              <li><strong>Library Activity:</strong> History of book borrowing, reservations, outstanding fines, and logs of active sessions.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              2. How We Use Your Information
            </h2>
            <p>
              We utilize the collected information strictly for municipal library operations:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To manage your library card account and verify your identification during book borrowing.</li>
              <li>To process book reservations, track return deadlines, and calculate outstanding dues.</li>
              <li>To send urgent notifications regarding library closures, fine dues, or reservation availabilities.</li>
              <li>To compile aggregate statistics regarding library activity for municipal growth reports.</li>
            </ul>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              3. Data Security and Retention
            </h2>
            <p>
              We prioritize data safety and implement robust security protocols to protect your personal details against unauthorized access. We retain your account information for as long as your membership is active, or as required by the municipal retention policies.
            </p>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mt-8">
              4. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or wish to modify or close your library account, please contact us at:
            </p>
            <p className="font-mono text-emerald-600 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 inline-block text-xs md:text-sm">
              Email: raymarkacierto27@gmail.com<br />
              Hotline: +63 955 245 0503<br />
              Location: Balingasag Municipal Library, Misamis Oriental, Philippines
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
