// src/pages/MyBooks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Calendar, AlertTriangle, Award, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBooks: React.FC = () => {
  const { refreshProfile } = useAuth();
  
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/list', {
        params: { status: 'active' }, // Fetches active + overdue
      });
      if (response.data && response.data.success) {
        setLoans(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load active loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleReturn = async (loan: any) => {
    if (!confirm(`Are you ready to return "${loan.title}"? if overdue, a daily fine of ₱5.00 will be added.`)) {
      return;
    }

    setFeedback(null);
    setActionLoadingId(loan.id);
    try {
      const response = await api.post('/transactions/return', {
        transaction_id: loan.transaction_id,
      });

      if (response.data && response.data.success) {
        setFeedback({
          type: 'success',
          message: response.data.message || 'Book checked in successfully!',
        });
        
        // Refresh loans listing and global profile counters
        fetchActiveLoans();
        refreshProfile();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to check in book copy.',
      });
    } finally {
      setActionLoadingId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
          My Borrowed Books
        </h2>
        <p className="text-xs text-slate-400 font-semibold">
          Check due dates, extend durations, and settle returns
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed border ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'
        }`}>
          <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="flex gap-4">
                <div className="h-20 w-14 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
          <Award className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-600">No active checkout books</h4>
          <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
            You currently hold zero physical inventory copies from Balingasag Public Library.
          </p>
          <Link to="/catalog" className="mt-5">
            <Button variant="primary" className="text-xs px-6 py-2.5">
              Browse Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => {
            const isOverdue = loan.status === 'overdue';
            return (
              <Card 
                key={loan.id} 
                className={`flex flex-col justify-between border transition-all ${
                  isOverdue ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'
                }`}
              >
                <div className="flex gap-4">
                  {/* Cover */}
                  <div className="h-24 w-18 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {loan.cover_image && loan.cover_image.startsWith('http') ? (
                      <img src={loan.cover_image} alt={loan.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/40 px-2 py-0.5 rounded uppercase tracking-wider">
                      {loan.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2" title={loan.title}>
                      {loan.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">By {loan.author}</p>
                  </div>
                </div>

                {/* Deadlines and return status */}
                <div className="my-5 border-t border-slate-50 pt-4 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Checkout Date:
                    </span>
                    <span className="text-slate-700">{new Date(loan.borrow_date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Due Date:
                    </span>
                    <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                      {new Date(loan.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  {isOverdue && (
                    <div className="flex items-center gap-1.5 p-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-100">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Overdue Loan! Daily charges of ₱5.00 active.</span>
                    </div>
                  )}
                </div>

                {/* Settle Return */}
                <Button
                  variant={isOverdue ? 'danger' : 'primary'}
                  size="sm"
                  isLoading={actionLoadingId === loan.id}
                  onClick={() => handleReturn(loan)}
                  className="w-full text-xs"
                >
                  Settle Return Checkout
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBooks;
