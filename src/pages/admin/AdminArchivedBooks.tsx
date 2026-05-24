// src/pages/admin/AdminArchivedBooks.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { BookOpen, CheckCircle, XCircle, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const AdminArchivedBooks: React.FC = () => {
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Unarchive confirm modal state
  const [unarchiveConfirmBook, setUnarchiveConfirmBook] = useState<any | null>(null);
  const [unarchiveLoading, setUnarchiveLoading] = useState(false);

  // Delete confirm modal state
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<any | null>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchArchivedBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/books/getAll', {
        params: { limit: 200, include_archived: 'true' }
      });
      if (response.data && response.data.success) {
        const all = response.data.data.books;
        setBooks(all.filter((b: any) => b.status === 'archived'));
      }
    } catch (err) {
      console.error('Failed to load archived books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArchivedBooks();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleUnarchiveExecute = async (book: any) => {
    setUnarchiveLoading(true);
    try {
      const response = await api.post('/books/archive', { id: book.id });
      if (response.data && response.data.success) {
        fetchArchivedBooks();
        toast.success(response.data.message || `"${book.title}" has been restored to the active catalog!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to unarchive book.');
    } finally {
      setUnarchiveLoading(false);
      setUnarchiveConfirmBook(null);
    }
  };

  const handleDeleteExecute = async (book: any) => {
    try {
      const response = await api.post(`/books/delete?id=${book.id}`);
      if (response.data && response.data.success) {
        fetchArchivedBooks();
        toast.success('Book permanently deleted from the system.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete book.');
    } finally {
      setDeleteConfirmBook(null);
    }
  };

  const columns = [
    {
      header: 'Book Details',
      accessor: (row: any) => (
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-8 bg-amber-50 border border-amber-100 rounded flex items-center justify-center flex-shrink-0">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <Archive className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div>
            <p className="font-extrabold text-slate-700 leading-snug line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">By {row.author} &nbsp;|&nbsp; ISBN: {row.isbn}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'title'
    },
    {
      header: 'Genre',
      accessor: 'category',
      sortable: true,
      className: 'text-xs capitalize font-semibold'
    },
    {
      header: 'Copies',
      accessor: (row: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border bg-slate-50 text-slate-500 border-slate-100">
          <BookOpen className="h-3.5 w-3.5" />
          {row.total_copies} copies
        </span>
      )
    },
    {
      header: 'Status',
      accessor: () => (
        <span className="px-2 py-0.5 border rounded-full text-[10px] font-bold capitalize bg-amber-50 text-amber-700 border-amber-200">
          Archived
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        const isOpen = activeDropdownId === row.id;
        return (
          <div className="relative inline-block text-left actions-dropdown-container">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownId(isOpen ? null : row.id);
              }}
              className="px-3.5 h-10 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-amber-700 rounded-xl flex items-center gap-1.5 font-bold shadow-sm animate-fade-in"
            >
              <span>Actions</span>
              <span className="text-[9px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </Button>

            {isOpen && (
              <div
                className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-100 shadow-xl py-1.5 z-[100] animate-fade-in text-left pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Unarchive Book — primary action */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdownId(null);
                    setUnarchiveConfirmBook(row);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
                  <span>Unarchive Book</span>
                </button>

                {/* Delete permanently */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdownId(null);
                    setDeleteConfirmBook(row);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 border-t border-slate-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                  <span>Delete Books</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1 flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-500" />
            Archive Books
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Books hidden from the member catalog — restore or permanently delete them here
          </p>
        </div>

        <Link to="/admin/books">
          <Button variant="outline" size="sm" className="text-xs">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>View Active Books</span>
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs font-semibold text-amber-800 leading-relaxed">
        <Archive className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900 mb-0.5">About Archived Books</p>
          <p>
            Archived books are <span className="font-bold">hidden from the member catalog</span> but their records and transaction history are preserved.
            Use <span className="font-bold text-teal-700">Unarchive Book</span> to restore visibility, or permanently delete books that are no longer needed.
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs font-semibold text-slate-400">Loading archived books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-amber-200 rounded-3xl bg-amber-50/20">
          <Archive className="h-12 w-12 text-amber-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-600">No archived books found</h4>
          <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
            All books in the catalog are currently active. Archive a book from the{' '}
            <Link to="/admin/books" className="text-emerald-600 font-bold hover:underline">
              Book Inventory
            </Link>{' '}
            page to see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
            <span className="px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full">
              {books.length} Archived Book{books.length !== 1 ? 's' : ''}
            </span>
          </div>
          <DataTable
            columns={columns}
            data={books}
            searchPlaceholder="Search archived books by title, author, isbn..."
            searchField={(row) => `${row.title} ${row.author} ${row.isbn}`}
            initialSortKey="title"
            itemsPerPage={10}
          />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          UNARCHIVE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!unarchiveConfirmBook}
        onClose={() => setUnarchiveConfirmBook(null)}
        title="Unarchive Book"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnarchiveConfirmBook(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={unarchiveLoading}
              onClick={() => {
                if (unarchiveConfirmBook) {
                  handleUnarchiveExecute(unarchiveConfirmBook);
                }
              }}
              className="h-11 px-6 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 border-teal-600 shadow-md shadow-teal-100"
            >
              Unarchive Book
            </Button>
          </div>
        }
      >
        {unarchiveConfirmBook && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mb-1 animate-pulse">
              <RotateCcw className="h-6 w-6 text-teal-600" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">Restore Book to Catalog</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Are you sure you want to unarchive{' '}
                <span className="font-extrabold text-slate-700">"{unarchiveConfirmBook.title}"</span>?
              </p>
            </div>

            <div className="p-3.5 bg-teal-50/50 border border-teal-100/80 rounded-xl text-xs text-teal-800 font-semibold text-left leading-relaxed">
              <CheckCircle className="h-4 w-4 text-teal-600 inline-block mr-1.5 flex-shrink-0" />
              This will make the book visible again to all members in the library catalog.
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!deleteConfirmBook}
        onClose={() => setDeleteConfirmBook(null)}
        title="Permanently Delete Book"
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmBook(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (deleteConfirmBook) {
                  handleDeleteExecute(deleteConfirmBook);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              Delete Permanently
            </Button>
          </div>
        }
      >
        {deleteConfirmBook && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-1 animate-pulse">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">Confirm Permanent Deletion</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Are you absolutely sure you want to permanently delete{' '}
                <span className="font-extrabold text-slate-700">"{deleteConfirmBook.title}"</span> from the system?
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100/80 rounded-xl text-xs text-rose-800 font-semibold text-left leading-relaxed">
              <XCircle className="h-4 w-4 text-rose-500 inline-block mr-1.5 flex-shrink-0" />
              This action <span className="font-black">cannot be undone</span>. All associated data will be permanently removed.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminArchivedBooks;
