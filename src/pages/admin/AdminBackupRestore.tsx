import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Database, RotateCcw, Plus, AlertTriangle, CheckCircle2, AlertCircle, HardDrive, FileCode } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';

export const AdminBackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Restore Modal
  const [selectedBackup, setSelectedBackup] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchBackups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/backup/list');
      if (response.data && response.data.success) {
        setBackups(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch database backups.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.post('/backup/create');
      if (response.data && response.data.success) {
        setSuccessMsg(`Database backup ${response.data.data.backup_name} created successfully!`);
        fetchBackups();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create database backup.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackup) return;

    setIsRestoring(true);
    setError(null);

    try {
      const response = await api.post('/backup/restore', {
        backup_id: selectedBackup.id
      });
      if (response.data && response.data.success) {
        setSuccessMsg(`Database has been successfully restored from snapshot ${selectedBackup.backup_name}.`);
        setSelectedBackup(null);
        setTimeout(() => setSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Database restoration failed.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Database Backup & Disaster Recovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Create complete MySQL database archives and restore system states safely
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleCreateBackup}
          isLoading={isCreating}
          className="px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-950/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Backup</span>
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

      {/* Info Card */}
      <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Automated Table Serialization & Foreign Key Integrity</h3>
            <p className="text-xs text-slate-300">
              Each backup snapshot contains structure and data for books, transactions, members, attendance, and audit logs.
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono text-emerald-300 border border-white/10">
          Total Backups: {backups.length}
        </div>
      </div>

      {/* Backup Archive List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading backup history...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileCode className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No backups generated yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Create New Backup" to generate your first complete database snapshot archive.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          {backups.map((bk) => (
            <div key={bk.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-mono font-bold text-slate-800">{bk.backup_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {bk.file_size_kb} KB
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pl-6">
                  <span>Created by: <strong className="text-slate-600">{bk.creator_name || 'Super Admin'}</strong></span>
                  <span>•</span>
                  <span>{new Date(bk.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedBackup(bk)}
                  className="px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 border-amber-200 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore from this snapshot</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedBackup && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setSelectedBackup(null)} />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5 z-10 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Confirm Database Restoration</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
                  {selectedBackup.backup_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Restoring from this snapshot will replace all active database tables with the state saved on <strong>{new Date(selectedBackup.created_at).toLocaleString()}</strong>.
            </p>

            <form onSubmit={handleExecuteRestore} className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedBackup(null)} className="px-4 py-2 text-xs font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isRestoring}
                className="px-5 py-2 text-xs font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white"
              >
                Execute Restore
              </Button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminBackupRestore;
