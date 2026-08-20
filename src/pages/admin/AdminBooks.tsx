// src/pages/admin/AdminBooks.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { 
  BookOpen, Edit, Trash2, Plus, Info, CheckCircle, XCircle, Search, Sparkles, 
  X, Loader2, Archive, RotateCcw, RefreshCw, Layers, MapPin
} from 'lucide-react';
import { fetchBookByIsbn } from '../../lib/bookApi';
import { useToast } from '../../context/ToastContext';

export const AdminBooks: React.FC = () => {
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<any | null>(null);
  const [archiveConfirmBook, setArchiveConfirmBook] = useState<any | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Form states with all required classification fields
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    publisher: '',
    year: new Date().getFullYear(),
    accession_number: '',
    isbn: '',
    shelf_location: 'Main Shelf',
    format: 'Paperback',
    total_copies: 1,
    status: 'available',
    book_condition: 'good',
    description: '',
    cover_image: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automated ISBN lookup state
  const [isbnInput, setIsbnInput] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science & Technology',
    'Philippine History',
    'Academic Research',
    'Biography & Memoir',
    'Philosophy & Psychology',
    'Literature & Poetry',
    'Children\'s Books',
    'General Reference'
  ];

  const shelfLocations = [
    'Main Shelf',
    'Filipiniana Section',
    'Reference Section',
    'Fiction Bay A',
    'Fiction Bay B',
    'Science & Tech Bay C',
    'Academic & Research Bay D',
    'Children\'s Section',
    'Circulation Display'
  ];

  const generateAccessionNumber = () => {
    const acc = `ACC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData(prev => ({ ...prev, accession_number: acc }));
  };

  const handleFetchBookDetails = async () => {
    const clean = isbnInput.trim();
    if (!clean) {
      setFetchStatus({ type: 'error', message: 'Please enter an Accession Number or ISBN code.' });
      return;
    }
    setFetchingDetails(true);
    setFetchStatus({ type: 'info', message: 'Searching library catalog & AI database...' });
    try {
      const details = await fetchBookByIsbn(clean);
      const sourceLabel = details.source === 'database'
        ? 'Library Database'
        : details.source === 'local-ai'
          ? 'Local Qwen AI (127.0.0.1:1234)'
          : details.source === 'google'
            ? 'Google Books'
            : 'Open Library';

      setFormData((prev) => ({
        ...prev,
        title: details.title || prev.title,
        author: details.author || prev.author,
        publisher: details.publisher || prev.publisher,
        accession_number: details.accession_number || prev.accession_number,
        isbn: details.isbn || prev.isbn,
        category: categories.includes(details.category) ? details.category : prev.category,
        year: details.year || prev.year,
        shelf_location: details.shelf_location || prev.shelf_location,
        format: details.format || prev.format,
        total_copies: details.total_copies !== undefined ? details.total_copies : prev.total_copies,
        status: details.status || prev.status,
        description: details.description || prev.description,
        cover_image: details.cover_image || prev.cover_image
      }));
      setFetchStatus({
        type: 'success',
        message: `Found "${details.title}"${details.publisher ? ` by ${details.publisher}` : ''} via ${sourceLabel}!`
      });
    } catch (err: any) {
      setFetchStatus({
        type: 'error',
        message: err.message || 'Could not retrieve book details for this Accession Number or ISBN.'
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
    const timer = setTimeout(() => {
      fetchBooks();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'total_copies' ? parseInt(value) || 0 : value
    }));
  };

  const handleAutoGenerateDescription = () => {
    const { title, author, category, year, publisher } = formData;
    if (!title || !author) return;

    const pubText = publisher ? `published by ${publisher}` : `published`;
    const templates = [
      `"${title}" is a comprehensive ${category.toLowerCase()} title written by ${author} and ${pubText} in ${year}. This work offers in-depth insights and engaging perspectives, making it an essential reference and educational resource for municipal library patrons.`,
      `Authored by ${author} (${pubText}, ${year}), "${title}" stands out as an exemplary addition to our ${category.toLowerCase()} collection. The text provides readers with a richly developed overview and thought-provoking analysis on its core themes.`,
      `"${title}" (${year}), authored by ${author} and ${pubText}, is an engaging and well-structured volume in the library's ${category.toLowerCase()} section. Ideal for research, self-directed learning, and academic enrichment.`
    ];

    const hash = (title.length + author.length + (parseInt(year.toString()) || 0)) % templates.length;
    setFormData((prev) => ({
      ...prev,
      description: templates[hash]
    }));
  };

  const handleOpenAdd = () => {
    setFeedback(null);
    setIsbnInput('');
    setFetchStatus(null);
    const newAcc = `ACC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData({
      title: '',
      author: '',
      category: 'Fiction',
      publisher: '',
      year: new Date().getFullYear(),
      accession_number: newAcc,
      isbn: '',
      shelf_location: 'Main Shelf',
      format: 'Paperback',
      total_copies: 1,
      status: 'available',
      book_condition: 'good',
      description: '',
      cover_image: ''
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (book: any) => {
    setFeedback(null);
    setSelectedBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      category: book.category || 'Fiction',
      publisher: book.publisher || '',
      year: book.year || new Date().getFullYear(),
      accession_number: book.accession_number || '',
      isbn: book.isbn || '',
      shelf_location: book.shelf_location || 'Main Shelf',
      format: book.format || 'Paperback',
      total_copies: book.total_copies || 1,
      status: book.status || 'available',
      book_condition: book.book_condition || 'good',
      description: book.description || '',
      cover_image: book.cover_image || ''
    });
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validate required fields
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.category.trim() ||
      !formData.publisher.trim() ||
      !formData.year ||
      !formData.accession_number.trim() ||
      !formData.isbn.trim() ||
      !formData.shelf_location.trim()
    ) {
      setFeedback({
        type: 'error',
        message: 'Please complete all required classification and catalog fields.'
      });
      return;
    }

    setFormLoading(true);
    try {
      const response = await api.post('/books/create', formData);
      if (response.data && response.data.success) {
        setAddModalOpen(false);
        fetchBooks();
        toast.success('Book catalog record successfully created with QR code!');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create book.';
      toast.error(errMsg);
      setFeedback({
        type: 'error',
        message: errMsg
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
        toast.success('Book catalog modifications successfully saved!');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save modifications.';
      toast.error(errMsg);
      setFeedback({
        type: 'error',
        message: errMsg
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (book: any) => {
    const activeBorrows = book.total_copies - book.available_copies;
    if (activeBorrows > 0) {
      toast.warn(`Deletion BLOCKED. The title currently has ${activeBorrows} physical copy loans in active circulation.`);
      return;
    }
    setDeleteConfirmBook(book);
  };

  const handleDeleteExecute = async (book: any) => {
    try {
      const response = await api.post(`/books/delete?id=${book.id}`);
      if (response.data && response.data.success) {
        fetchBooks();
        toast.success('Book catalog record deleted successfully.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete book.';
      toast.error(errMsg);
    }
  };

  const handleOpenArchiveConfirm = (book: any) => {
    if (book.status !== 'archived') {
      const activeBorrows = book.total_copies - book.available_copies;
      if (activeBorrows > 0) {
        toast.warn(`Archival BLOCKED. The title currently has ${activeBorrows} physical copy loans in active circulation.`);
        return;
      }
    }
    setArchiveConfirmBook(book);
  };

  const handleArchiveExecute = async (book: any) => {
    setArchiveLoading(true);
    try {
      const response = await api.post('/books/archive', {
        id: book.id
      });
      if (response.data && response.data.success) {
        fetchBooks();
        toast.success(response.data.message || 'Book status toggled successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle book archival status.');
    } finally {
      setArchiveLoading(false);
      setArchiveConfirmBook(null);
    }
  };

  const columns = [
    {
      header: 'Book details',
      accessor: (row: any) => (
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="font-extrabold text-slate-800 leading-snug line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              by <span className="text-slate-600 font-bold">{row.author}</span> • {row.publisher || 'N/A'} ({row.year})
            </p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'title'
    },
    {
      header: 'Classification & Shelf',
      accessor: (row: any) => (
        <div className="space-y-0.5">
          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold capitalize">
            {row.category}
          </span>
          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" />
            {row.shelf_location || 'Main Shelf'}
          </p>
        </div>
      ),
      sortable: true,
      sortKey: 'category'
    },
    {
      header: 'Accession / ISBN',
      accessor: (row: any) => (
        <div className="space-y-0.5">
          <p className="text-xs font-mono font-bold text-slate-700">{row.accession_number || '—'}</p>
          <p className="text-[10px] font-mono text-slate-400">ISBN: {row.isbn}</p>
        </div>
      ),
      sortable: true,
      sortKey: 'accession_number'
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
      header: 'Availability',
      accessor: (row: any) => {
        const statuses = {
          available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          unavailable: 'bg-rose-50 text-rose-600 border-rose-100',
          maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
          reserved: 'bg-blue-50 text-blue-600 border-blue-100',
          archived: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        const statusMap = row.status as keyof typeof statuses;
        return (
          <span className={`px-2.5 py-1 border rounded-full text-[10px] font-bold capitalize ${statuses[statusMap] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
            {row.status}
          </span>
        );
      },
      sortable: true,
      sortKey: 'status'
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              className="text-xs py-1.5 px-2.5 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-bold inline-flex items-center gap-1.5 rounded-xl shadow-xs"
              title="Edit Details"
            >
              <Edit className="h-3.5 w-3.5 text-slate-500 hover:text-emerald-700" />
              <span>Edit</span>
            </Button>

            {row.status === 'archived' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenArchiveConfirm(row)}
                className="text-xs py-1.5 px-2.5 border-teal-200 hover:bg-teal-50 text-teal-700 font-bold inline-flex items-center gap-1.5 rounded-xl shadow-xs"
                title="Unarchive Book"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Unarchive</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenArchiveConfirm(row)}
                className="text-xs py-1.5 px-2.5 border-amber-200 hover:bg-amber-50 text-amber-700 font-bold inline-flex items-center gap-1.5 rounded-xl shadow-xs"
                title="Archive Book"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDeleteConfirm(row)}
              className="text-xs py-1.5 px-2.5 border-rose-200 hover:bg-rose-50 text-rose-600 font-bold inline-flex items-center gap-1.5 rounded-xl shadow-xs"
              title="Delete Book"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        );
      }
    }
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
            Catalog new arrivals, adjust copies levels, and manage shelf classification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs shadow-md shadow-emerald-950/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Catalog New Book</span>
          </Button>
        </div>
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
          data={books.filter(b => b.status !== 'archived')}
          searchPlaceholder="Filter registry by title, author, isbn, accession, shelf..."
        />
      )}

      {/* CATALOG NEW BOOK MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Catalog New Book"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              form="add-book-form"
              isLoading={formLoading}
              className="h-11 px-6 text-xs font-bold shadow-md shadow-emerald-950/20"
            >
              Add to Catalog
            </Button>
          </>
        }
      >
        <form id="add-book-form" onSubmit={handleAddSubmit} className="space-y-5">
          {feedback && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Quick Accession & ISBN Autofill Search Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Quick Accession & ISBN Lookup (Local AI & Catalog)
              </label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Enter Accession Number (e.g. ACC-2026-00124) or ISBN (e.g. 9780743273565)"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {isbnInput && (
                  <button
                    type="button"
                    onClick={() => setIsbnInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex-shrink-0 px-4 rounded-xl shadow-xs"
              >
                {fetchingDetails ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="animate-spin h-3.5 w-3.5 text-emerald-600" />
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    Autofill
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

          {/* Section 1: Classification & Bibliographic Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              Bibliographic & Classification Details
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Book Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Florante at Laura"
                />
              </div>

              {/* 2. Author */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author *</label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Francisco Balagtas"
                />
              </div>

              {/* 3. Category / Classification */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Classification / Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* 4. Publisher */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Publisher *</label>
                <input
                  type="text"
                  name="publisher"
                  required
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Anvil Publishing, Inc."
                />
              </div>

              {/* 5. Publication Year */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Publication Year *</label>
                <input
                  type="number"
                  name="year"
                  required
                  min={1800}
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Library Identification & Inventory Location */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              Inventory, Shelf Location & Availability
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 6. Accession Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Accession Number *</label>
                  <button
                    type="button"
                    onClick={generateAccessionNumber}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  name="accession_number"
                  required
                  value={formData.accession_number}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. ACC-2026-00124"
                />
              </div>

              {/* 7. ISBN */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">ISBN Code *</label>
                <input
                  type="text"
                  name="isbn"
                  required
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. 9789712711572"
                />
              </div>

              {/* 8. Shelf Location */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Shelf Location *</label>
                <select
                  name="shelf_location"
                  required
                  value={formData.shelf_location}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {shelfLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              {/* 10. Availability & Total Copies */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Total Copies Stock *</label>
                <input
                  type="number"
                  name="total_copies"
                  required
                  min={1}
                  value={formData.total_copies}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Initial Availability *</label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="available">Available for Loan</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="reserved">Reserved Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Cover & Abstract */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Additional Overview (Optional)
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Cover Image URL</label>
                <input
                  type="text"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Book Abstract Description</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateDescription}
                    disabled={!formData.title || !formData.author}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>Generate Abstract</span>
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Summary synopsis of the book content..."
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* EDIT BOOK MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Book Metadata"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="h-11 px-5 text-xs font-bold"
            >
              Dismiss
            </Button>
            <Button
              type="submit"
              variant="primary"
              form="edit-book-form"
              isLoading={formLoading}
              className="h-11 px-6 text-xs font-bold shadow-md shadow-emerald-950/20"
            >
              Save Modifications
            </Button>
          </>
        }
      >
        <form id="edit-book-form" onSubmit={handleEditSubmit} className="space-y-5">
          {feedback && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section 1: Classification & Bibliographic Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              Bibliographic & Classification Details
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Book Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author *</label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Classification / Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Publisher *</label>
                <input
                  type="text"
                  name="publisher"
                  required
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Publication Year *</label>
                <input
                  type="number"
                  name="year"
                  required
                  min={1800}
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Library Identification & Inventory Location */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              Inventory, Shelf Location & Availability
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Accession Number *</label>
                  <button
                    type="button"
                    onClick={generateAccessionNumber}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  name="accession_number"
                  required
                  value={formData.accession_number}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">ISBN Code *</label>
                <input
                  type="text"
                  name="isbn"
                  required
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Shelf Location *</label>
                <select
                  name="shelf_location"
                  required
                  value={formData.shelf_location}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {shelfLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Total Copies Stock *</label>
                <input
                  type="number"
                  name="total_copies"
                  required
                  min={1}
                  value={formData.total_copies}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Availability Status *</label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="available">Available for Loan</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="reserved">Reserved Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Cover & Abstract */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Additional Overview (Optional)
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Cover Image URL</label>
                <input
                  type="text"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Book Abstract Description</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateDescription}
                    disabled={!formData.title || !formData.author}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>Generate Abstract</span>
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmBook}
        onClose={() => setDeleteConfirmBook(null)}
        title="Confirm Deletion"
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
                  setDeleteConfirmBook(null);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              Delete
            </Button>
          </div>
        }
      >
        {deleteConfirmBook && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-1 animate-pulse">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">Confirm Catalog Deletion</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Are you absolutely sure you want to permanently delete <span className="font-extrabold text-slate-700">"{deleteConfirmBook.title}"</span> from the catalog registry?
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ARCHIVE/UNARCHIVE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!archiveConfirmBook}
        onClose={() => setArchiveConfirmBook(null)}
        title={archiveConfirmBook?.status === 'archived' ? 'Unarchive Book' : 'Archive Book'}
        size="sm"
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveConfirmBook(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={archiveConfirmBook?.status === 'archived' ? 'primary' : 'danger'}
              isLoading={archiveLoading}
              onClick={() => {
                if (archiveConfirmBook) {
                  handleArchiveExecute(archiveConfirmBook);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              {archiveConfirmBook?.status === 'archived' ? 'Unarchive' : 'Archive'}
            </Button>
          </div>
        }
      >
        {archiveConfirmBook && (
          <div className="space-y-5 text-center px-4 pt-4 pb-2">
            <div className={`mx-auto h-12 w-12 rounded-full border flex items-center justify-center mb-1 ${
              archiveConfirmBook.status === 'archived'
                ? 'bg-teal-50 border-teal-100 text-teal-600'
                : 'bg-amber-50 border-amber-100 text-amber-600'
            }`}>
              {archiveConfirmBook.status === 'archived'
                ? <RotateCcw className="h-6 w-6" />
                : <Archive className="h-6 w-6" />
              }
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">
                {archiveConfirmBook.status === 'archived' ? 'Unarchive Book' : 'Archive Book'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {archiveConfirmBook.status === 'archived' ? (
                  <>
                    Are you sure you want to unarchive <span className="font-extrabold text-slate-700">"{archiveConfirmBook.title}"</span>? This will make it visible to members in the library catalog.
                  </>
                ) : (
                  <>
                    Are you sure you want to archive <span className="font-extrabold text-slate-700">"{archiveConfirmBook.title}"</span>? This will hide the title from members but preserve all past transaction logs.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AdminBooks;
