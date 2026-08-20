// src/pages/admin/AdminRecycleBin.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Book, Megaphone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export const AdminRecycleBin: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'books' | 'announcements' | 'users'>('books');
  const [data, setData] = useState<{ books: any[]; announcements: any[]; users: any[]; total: number }>({
    books: [],
    announcements: [],
    users: [],
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals for Restore & Permanent Delete
  const [targetItem, setTargetItem] = useState<{ type: string; id: any; name: string } | null>(null);
  const [modalAction, setModalAction] = useState<'restore' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRecycleBin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/recycle-bin/list');
      if (response.data && response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recycle bin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem || !modalAction) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (modalAction === 'restore') {
        const response = await api.post('/recycle-bin/restore', {
          item_type: targetItem.type,
          item_id: targetItem.id
        });
        if (response.data && response.data.success) {
          setSuccessMsg(`Successfully restored "${targetItem.name}".`);
          setTargetItem(null);
          setModalAction(null);
          fetchRecycleBin();
          setTimeout(() => setSuccessMsg(null), 4000);
        }
      } else {
        const response = await api.post('/recycle-bin/delete', {
          item_type: targetItem.type,
          item_id: targetItem.id
        });
        if (response.data && response.data.success) {
          setSuccessMsg(`Permanently deleted "${targetItem.name}".`);
          setTargetItem(null);
          setModalAction(null);
          fetchRecycleBin();
          setTimeout(() => setSuccessMsg(null), 4000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${modalAction} record.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/10">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Recycle Bin & Archival Storage
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Recover soft-deleted catalog books, archived announcements, and user profiles
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={fetchRecycleBin} className="px-4 py-2 text-xs font-bold">
          Refresh Bin
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'books' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Book className="h-4 w-4" />
          <span>Deleted Books ({data.books.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'announcements' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Announcements ({data.announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Deactivated Users ({data.users.length})</span>
        </button>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading recycle bin records...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Trash2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">Recycle bin is empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no deleted {activeTab} currently in storage.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          {currentList.map((item: any) => {
            const displayName = item.title || item.name || 'Unnamed Record';
            const subtext = item.author || item.email || item.category || '';
            const deletedDate = item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'Recently';

            return (
              <div key={item.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">{displayName}</h4>
                  <p className="text-xs text-slate-400">
                    {subtext && <span className="mr-3 text-slate-600 font-medium">{subtext}</span>}
                    <span>Deleted on: {deletedDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTargetItem({
                        type: activeTab === 'books' ? 'book' : (activeTab === 'announcements' ? 'announcement' : 'user'),
                        id: item.id,
                        name: displayName
                      });
                      setModalAction('restore');
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 border-emerald-200 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore</span>
                  </Button>

                  {isSuperAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTargetItem({
                          type: activeTab === 'books' ? 'book' : (activeTab === 'announcements' ? 'announcement' : 'user'),
                          id: item.id,
                          name: displayName
                        });
                        setModalAction('delete');
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Permanent Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {targetItem && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setTargetItem(null)} />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 z-10 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white ${
                modalAction === 'restore' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                {modalAction === 'restore' ? <RotateCcw className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {modalAction === 'restore' ? 'Confirm Record Restoration' : 'Confirm Permanent Deletion'}
                </h3>
                <p className="text-xs text-slate-400 font-medium capitalize">
                  {targetItem.type} Record
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {modalAction === 'restore' ? (
                <>Are you sure you want to restore <strong>"{targetItem.name}"</strong> back to the active library database?</>
              ) : (
                <span className="text-rose-700 font-medium">
                  <strong>Warning:</strong> This action cannot be undone. <strong>"{targetItem.name}"</strong> will be permanently wiped from the MySQL database tables.
                </span>
              )}
            </p>

            <form onSubmit={handleExecuteAction} className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setTargetItem(null)} className="px-4 py-2 text-xs font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                variant={modalAction === 'restore' ? 'primary' : 'danger'}
                isLoading={isProcessing}
                className="px-5 py-2 text-xs font-bold shadow-md"
              >
                {modalAction === 'restore' ? 'Yes, Restore Record' : 'Permanently Delete'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecycleBin;
