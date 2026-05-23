// src/pages/BookCatalog.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import BookCard from '../components/common/BookCard';
import type { BookItem } from '../components/common/BookCard';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { Search, Info, Filter, Book, BookMarked, CheckCircle } from 'lucide-react';

export const BookCatalog: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [borrowConfirmBook, setBorrowConfirmBook] = useState<BookItem | null>(null);
  const [successModalData, setSuccessModalData] = useState<{ title: string; dueDate: string } | null>(null);

  const [borrowLoadingId, setBorrowLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination parameters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const response = await api.get('/books/getAll', {
        params: {
          search: search || undefined,
          category: category || undefined,
          page,
          limit: 8,
        },
      });

      if (response.data && response.data.success) {
        setBooks(response.data.data.books);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [page]);

  // Reset page and trigger fetch on search/filter changes
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCatalog();
  };

  const handleFilterChange = (catVal: string) => {
    setCategory(catVal);
    setPage(1);
    // Timeout to let state apply
    setTimeout(fetchCatalog, 50);
  };

  const handleQuickBorrow = async (book: BookItem) => {
    setFeedback(null);
    setBorrowLoadingId(book.id);
    try {
      const response = await api.post('/transactions/borrow', {
        book_id: book.id,
      });

      if (response.data && response.data.success) {
        setSuccessModalData({
          title: book.title,
          dueDate: new Date(response.data.data.due_date).toLocaleDateString(),
        });

        // Sync stats and refresh listings
        fetchCatalog();
        refreshProfile();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to borrow book.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBorrowLoadingId(null);
    }
  };

  const categoriesList = [
    'Fiction',
    'Science',
    'History',
    'Biography',
    'Philosophy',
    'Technology',
    'Children',
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Library Book Catalog
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Search our physical shelves and borrow books digitally
          </p>
        </div>
      </div>

      {/* Policies Alert for member guidance */}
      {user && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl border border-emerald-500/10 flex-shrink-0">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Municipal Borrowing Policies</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Maximum of <span className="font-bold text-slate-700">3 books</span> checked out concurrently. Loans expire in <span className="font-bold text-slate-700">14 days</span>. Overdue loans incur a penalty of <span className="font-bold text-slate-700">₱5.00/day</span>. Outstanding fines block further borrowings.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-emerald-100 rounded-lg text-[10px] font-bold text-slate-600">
              My Active: {user.stats?.active_loans || 0}/3 Books
            </span>
            <span className={`px-3 py-1 border rounded-lg text-[10px] font-bold ${(user.stats?.unread_notifications || 0) > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white border-emerald-100 text-slate-600'
              }`}>
              My Fines: ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(user.stats?.unpaid_fines || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Transaction Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
          <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search and filter controls */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/10">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Book Title, Author name, or ISBN number..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm placeholder-slate-400"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Filter className="h-4 w-4" />
              </span>
              <select
                value={category}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-550/15 focus:border-primary-550 transition-all duration-200 text-sm text-slate-600 appearance-none font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">▼</span>
          </div>

          <Button type="submit" variant="primary" size="md" className="text-xs px-5">
            Query Shelves
          </Button>
        </div>
      </form>

      {/* Books grid layout */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-44 bg-slate-100 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3.5 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-3">
                <div className="h-3 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
          <Book className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-600">No books found</h4>
          <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
            Try adjusting your fuzzy search query or choosing a different genre filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={setSelectedBook}
              onQuickBorrow={(book) => setBorrowConfirmBook(book)}
              isBorrowLoading={borrowLoadingId === book.id}
            />
          ))}
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-500 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Book details Modal */}
      <Modal
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        title="Book Profile Details"
      >
        {selectedBook && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover */}
              <div className="w-full md:w-44 h-56 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedBook.cover_image && selectedBook.cover_image.startsWith('http') ? (
                  <img src={selectedBook.cover_image} alt={selectedBook.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Book className="h-10 w-10 text-emerald-600/50 mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{selectedBook.category}</span>
                  </div>
                )}
              </div>

              {/* Title & metadata */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {selectedBook.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">Written by {selectedBook.author}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-t border-b border-slate-100 py-3.5 text-slate-500">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">ISBN</span>
                    <span className="text-slate-700">{selectedBook.isbn}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Year Published</span>
                    <span className="text-slate-700">{selectedBook.year}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Copies Available</span>
                    <span className={selectedBook.available_copies > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                      {selectedBook.available_copies} of {selectedBook.total_copies}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</span>
                    <span className="capitalize">{selectedBook.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Abstract Description</span>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100/50 p-4 rounded-xl">
                {selectedBook.description || 'No summary overview currently cataloged for this book.'}
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 pt-4.5 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedBook(null)}>
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedBook.available_copies <= 0 || selectedBook.status === 'unavailable'}
                isLoading={borrowLoadingId === selectedBook.id}
                onClick={() => {
                  const bk = selectedBook;
                  setSelectedBook(null);
                  setBorrowConfirmBook(bk);
                }}
              >
                Borrow Book Copy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Borrow Confirmation Modal */}
      <Modal
        isOpen={!!borrowConfirmBook}
        onClose={() => setBorrowConfirmBook(null)}
        title="Confirm Book Borrowing"
        footer={
          borrowConfirmBook && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBorrowConfirmBook(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={borrowLoadingId === borrowConfirmBook.id}
                onClick={async () => {
                  const bk = borrowConfirmBook;
                  setBorrowConfirmBook(null);
                  await handleQuickBorrow(bk);
                }}
              >
                Proceed
              </Button>
            </>
          )
        }
      >
        {borrowConfirmBook && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <Book className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">Confirm Book Borrowing</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                You are about to check out <span className="font-extrabold text-slate-700">"{borrowConfirmBook.title}"</span> by {borrowConfirmBook.author}.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-2 text-left max-w-sm mx-auto">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Borrowing Terms</h5>
              <div className="space-y-1 text-xs text-slate-600">
                <p className="flex justify-between">
                  <span className="text-slate-400">Loan Duration:</span>
                  <span className="font-bold text-slate-700">14 Days</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Overdue Fine:</span>
                  <span className="font-bold text-rose-600">₱5.00 / day</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Borrow Success Modal */}
      <Modal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        title="Checkout Successful"
        showFooter={false}
        size="sm"
      >
        {successModalData && (
          <div className="space-y-5 text-center px-4 pt-4 pb-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-slate-800">Check Out Successful!</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                You have successfully checked out <span className="font-extrabold text-slate-700">"{successModalData.title}"</span>.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 max-w-sm mx-auto">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Return Deadline</span>
              <span className="text-sm font-black text-emerald-700">
                {successModalData.dueDate}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookCatalog;
