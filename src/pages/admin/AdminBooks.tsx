// src/pages/admin/AdminBooks.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { BookOpen, Edit, Trash2, Plus, Info, CheckCircle, XCircle, Search, Sparkles, X, Loader2 } from 'lucide-react';
import { fetchBookByIsbn } from '../../lib/bookApi';

export const AdminBooks: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction',
    year: new Date().getFullYear(),
    description: '',
    cover_image: '',
    total_copies: 1
  });

  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automated ISBN lookup state
  const [isbnInput, setIsbnInput] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleFetchBookDetails = async () => {
    const clean = isbnInput.trim().replace(/[-\s]/g, '');
    if (!clean) {
      setFetchStatus({ type: 'error', message: 'Please enter a valid ISBN code.' });
      return;
    }
    setFetchingDetails(true);
    setFetchStatus({ type: 'info', message: 'Searching catalog databases...' });
    try {
      const details = await fetchBookByIsbn(clean);
      setFormData((prev) => ({
        ...prev,
        title: details.title || prev.title,
        author: details.author || prev.author,
        isbn: details.isbn || prev.isbn,
        category: details.category || prev.category,
        year: details.year || prev.year,
        description: details.description || prev.description,
        cover_image: details.cover_image || prev.cover_image
      }));
      setFetchStatus({
        type: 'success',
        message: `Found "${details.title}" via ${details.source === 'google' ? 'Google Books' : 'Open Library'}!`
      });
    } catch (err: any) {
      setFetchStatus({
        type: 'error',
        message: err.message || 'Could not retrieve book details for this ISBN.'
      });
    } finally {
      setFetchingDetails(false);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/books/getAll', { params: { limit: 100 } });
      if (response.data && response.data.success) {
        setBooks(response.data.data.books);
      }
    } catch (err) {
      console.error('Failed to query catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'total_copies' ? parseInt(value) || 0 : value
    }));
  };

  const handleOpenAdd = () => {
    setFeedback(null);
    setIsbnInput('');
    setFetchStatus(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiction',
      year: new Date().getFullYear(),
      description: '',
      cover_image: '',
      total_copies: 1
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (book: any) => {
    setFeedback(null);
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      year: book.year,
      description: book.description || '',
      cover_image: book.cover_image || '',
      total_copies: book.total_copies
    });
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFormLoading(true);
    try {
      const response = await api.post('/books/create', formData);
      if (response.data && response.data.success) {
        setAddModalOpen(false);
        fetchBooks();
        alert('Book catalog record successfully created!');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to create book.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    setFeedback(null);
    setFormLoading(true);
    try {
      const response = await api.post('/books/update', {
        id: selectedBook.id,
        ...formData
      });
      if (response.data && response.data.success) {
        setEditModalOpen(false);
        fetchBooks();
        alert('Book catalog modifications successfully saved!');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to save modifications.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (book: any) => {
    const activeBorrows = book.total_copies - book.available_copies;
    if (activeBorrows > 0) {
      alert(`Deletion BLOCKED. The title currently has ${activeBorrows} physical copy loans in active circulation.`);
      return;
    }

    if (!confirm(`Are you absolutely sure you want to permanently delete "${book.title}" from the catalog registry?`)) {
      return;
    }

    try {
      const response = await api.post(`/books/delete?id=${book.id}`);
      if (response.data && response.data.success) {
        fetchBooks();
        alert('Book catalog record deleted successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete book.');
    }
  };

  const columns = [
    {
      header: 'Book details',
      accessor: (row: any) => (
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-8.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-center flex-shrink-0">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div>
            <p className="font-extrabold text-slate-700 leading-snug line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Author: {row.author} | ISBN: {row.isbn}</p>
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
      header: 'Inventory Stock',
      accessor: (row: any) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
          row.available_copies > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {row.available_copies > 0 ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {row.available_copies} of {row.total_copies} available
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold capitalize ${
          row.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
        }`}>
          {row.status}
        </span>
      ),
      sortable: true,
      sortKey: 'status'
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="p-2 border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-emerald-700 rounded-xl"
            title="Edit Details"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row)}
            className="p-2 border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-xl"
            title="Delete Book"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const categories = [
    'Fiction',
    'Science',
    'History',
    'Biography',
    'Philosophy',
    'Technology',
    'Children'
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
            Book Inventory Manager
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Catalog new arrivals, adjust copies levels, and edit book profiles
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          className="text-xs"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Catalog New Book</span>
        </Button>
      </div>

      {/* Main registry Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={books}
          searchPlaceholder="Filter registry by title, author, isbn..."
          searchField={(row) => `${row.title} ${row.author} ${row.isbn}`}
          initialSortKey="title"
          itemsPerPage={8}
        />
      )}

      {/* ADD BOOK MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Catalog New Title"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4.5">
          {feedback && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* ISBN Autofill Card */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Smart Catalog via ISBN
              </label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Enter 10 or 13 digit ISBN (e.g. 9780743273565)"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  className="input-field text-sm pr-8 bg-white border-slate-200"
                />
                {isbnInput && (
                  <button
                    type="button"
                    onClick={() => setIsbnInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchBookDetails}
                disabled={fetchingDetails || !isbnInput.trim()}
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex-shrink-0 py-2.5 h-auto rounded-xl shadow-sm border"
              >
                {fetchingDetails ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="animate-spin h-3.5 w-3.5 text-emerald-600" />
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    Lookup
                  </span>
                )}
              </Button>
            </div>
            {fetchStatus && (
              <p className={`text-[11px] font-bold flex items-center gap-1 ${
                fetchStatus.type === 'success' ? 'text-emerald-600' : fetchStatus.type === 'info' ? 'text-emerald-600 animate-pulse' : 'text-rose-500'
              }`}>
                {fetchStatus.type === 'success' && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                {fetchStatus.type === 'error' && <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                {fetchStatus.type === 'info' && <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />}
                <span>{fetchStatus.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Book Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="input-field text-sm" placeholder="The Great Gatsby" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Author *</label>
              <input type="text" name="author" required value={formData.author} onChange={handleInputChange} className="input-field text-sm" placeholder="F. Scott Fitzgerald" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">ISBN Code *</label>
              <input type="text" name="isbn" required value={formData.isbn} onChange={handleInputChange} className="input-field text-sm" placeholder="9780743273565" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Genre Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="input-field text-sm font-semibold text-slate-600">
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Publication Year *</label>
              <input type="number" name="year" required value={formData.year} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Total Copies Stock *</label>
              <input type="number" name="total_copies" required min={1} value={formData.total_copies} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Cover Image URL</label>
              <input type="text" name="cover_image" value={formData.cover_image} onChange={handleInputChange} className="input-field text-sm" placeholder="http://example.com/cover.jpg" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Book Abstract Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="input-field text-sm py-2" placeholder="Summary synopsis of the book content..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={formLoading}>Catalog Book</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT BOOK MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Book Metadata"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4.5">
          {feedback && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Book Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Author *</label>
              <input type="text" name="author" required value={formData.author} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">ISBN Code *</label>
              <input type="text" name="isbn" required value={formData.isbn} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Genre Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="input-field text-sm font-semibold text-slate-600">
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Publication Year *</label>
              <input type="number" name="year" required value={formData.year} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Total Copies Stock *</label>
              <input type="number" name="total_copies" required min={1} value={formData.total_copies} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Cover Image URL</label>
              <input type="text" name="cover_image" value={formData.cover_image} onChange={handleInputChange} className="input-field text-sm" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Book Abstract Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="input-field text-sm py-2" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={formLoading}>Save Modifications</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBooks;
