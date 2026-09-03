import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { 
  BookOpen, Edit, Trash2, Plus, Info, CheckCircle, XCircle, Search, Sparkles, 
  X, Loader2, Archive, RotateCcw, RefreshCw, Layers, MapPin, CheckSquare
} from 'lucide-react';
import { fetchBookByIsbn } from '../../lib/bookApi';
import { useToast } from '../../context/ToastContext';

export const AdminBooks: React.FC = () => {
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [deleteConfirmBooks, setDeleteConfirmBooks] = useState<any[] | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveConfirmBooks, setArchiveConfirmBooks] = useState<any[] | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Selection state for books
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

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

  const handleOpenDeleteConfirm = (booksInput: any | any[]) => {
    const list = Array.isArray(booksInput) ? booksInput : [booksInput];
    if (list.length === 0) return;
    const blocked = list.filter(b => (b.total_copies - (b.available_copies ?? b.total_copies)) > 0);
    if (blocked.length > 0) {
      if (blocked.length === 1) {
        toast.warn(`Deletion BLOCKED for "${blocked[0].title}". The book currently has active borrower loans in circulation.`);
      } else {
        toast.warn(`Deletion BLOCKED. ${blocked.length} of the selected books have active borrower loans in circulation.`);
      }
      return;
    }
    setDeleteConfirmBooks(list);
  };

  const handleDeleteExecute = async (booksToDelete: any[]) => {
    if (!booksToDelete || booksToDelete.length === 0) return;
    setDeleteLoading(true);
    try {
      const ids = booksToDelete.map(b => b.id);
      const response = await api.post('/books/delete', { ids });
      if (response.data && response.data.success) {
        fetchBooks();
        setSelectedBookIds(prev => prev.filter(id => !ids.includes(id)));
        toast.success(response.data.message || `${booksToDelete.length} book(s) removed from catalog.`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete selected book(s).';
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmBooks(null);
    }
  };

  const handleOpenArchiveConfirm = (booksInput: any | any[]) => {
    const list = Array.isArray(booksInput) ? booksInput : [booksInput];
    if (list.length === 0) return;
    const blocked = list.filter(b => b.status !== 'archived' && (b.total_copies - (b.available_copies ?? b.total_copies)) > 0);
    if (blocked.length > 0) {
      if (blocked.length === 1) {
        toast.warn(`Archival BLOCKED for "${blocked[0].title}". The book currently has active borrower loans in circulation.`);
      } else {
        toast.warn(`Archival BLOCKED. ${blocked.length} of the selected books have active borrower loans in circulation.`);
      }
      return;
    }
    setArchiveConfirmBooks(list);
  };

  const handleArchiveExecute = async (booksToArchive: any[]) => {
    if (!booksToArchive || booksToArchive.length === 0) return;
    setArchiveLoading(true);
    try {
      const ids = booksToArchive.map(b => b.id);
      const response = await api.post('/books/archive', { ids });
      if (response.data && response.data.success) {
        fetchBooks();
        setSelectedBookIds(prev => prev.filter(id => !ids.includes(id)));
        toast.success(response.data.message || `${booksToArchive.length} book(s) status updated successfully.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to archive book(s).');
    } finally {
      setArchiveLoading(false);
      setArchiveConfirmBooks(null);
    }
  };

  const columns = [
    {
      header: 'Book details',
      accessor: (row: any) => (
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-9 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
            {row.cover_image && row.cover_image.startsWith('http') ? (
              <img src={row.cover_image} alt={row.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-5 w-5 text-slate-300 dark:text-slate-600" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              by <span className="text-slate-600 dark:text-slate-300 font-bold">{row.author}</span> • {row.publisher || 'N/A'} ({row.year})
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
          <span className="inline-block px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 rounded-md text-[10px] font-bold capitalize">
            {row.category}
          </span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
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
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{row.accession_number || '—'}</p>
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
          row.available_copies > 0 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'
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
          available: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
          unavailable: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
          maintenance: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
          reserved: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
          archived: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
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
    }
  ];

  // Compute inventory summary metrics
  const inventoryStats = useMemo(() => {
    const active = books.filter(b => b.status !== 'archived');
    const totalTitles = active.length;
    const totalCopies = active.reduce((acc, b) => acc + (b.total_copies || 0), 0);
    const availableCopies = active.reduce((acc, b) => acc + (b.available_copies || 0), 0);
    const inCirculation = totalCopies - availableCopies;
    const depleted = active.filter(b => (b.available_copies || 0) === 0).length;
    return { totalTitles, totalCopies, availableCopies, inCirculation, depleted };
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (b.status === 'archived') return false;
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      return true;
    });
  }, [books, selectedCategory]);

  const selectedBooks = useMemo(() => {
    return books.filter(b => selectedBookIds.includes(b.id));
  }, [books, selectedBookIds]);

  return (
    <div className="space-y-6 fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
              Book Inventory & Catalog Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Accession new acquisitions, monitor physical shelf copies & manage Dewey/subject classifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-950/20 active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Catalog New Book</span>
          </Button>
        </div>
      </div>

      {/* Interactive Inventory Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedCategory('all')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/60 dark:border-emerald-500/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Catalog Titles</span>
          <p className="text-2xl sm:text-3xl font-black">{inventoryStats.totalTitles}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Physical Copies</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{inventoryStats.totalCopies}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">In Circulation (Borrowed)</span>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">{inventoryStats.inCirculation}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Depleted / Zero Stock</span>
          <p className={`text-2xl sm:text-3xl font-black ${inventoryStats.depleted > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {inventoryStats.depleted}
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          All Categories ({inventoryStats.totalTitles})
        </button>
        {categories.map((cat) => {
          const count = books.filter(b => b.status !== 'archived' && b.category === cat).length;
          if (count === 0) return null;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Main registry Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading catalog inventory...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          {/* Active Selection Actions Bar */}
          {selectedBookIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-lg border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  {selectedBookIds.length} {selectedBookIds.length === 1 ? 'Book' : 'Books'} Selected
                </span>
                {selectedBooks.length === 1 && (
                  <span className="text-xs text-slate-300 font-semibold hidden md:inline truncate max-w-sm">
                    "{selectedBooks[0].title}"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Edit choice (enabled only when exactly 1 book is selected) */}
                {selectedBooks.length === 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(selectedBooks[0])}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                    title="Edit Selected Book Details"
                  >
                    <Edit className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Edit Book</span>
                  </Button>
                ) : (
                  <span 
                    className="text-[11px] font-semibold text-slate-400 hidden lg:inline px-2"
                    title="Select exactly 1 book to edit its details"
                  >
                    (Select 1 book to edit)
                  </span>
                )}

                {/* Archive choice */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenArchiveConfirm(selectedBooks)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs"
                  title={selectedBooks.length === 1 ? "Archive Book" : "Archive Selected Books"}
                >
                  <Archive className="h-3.5 w-3.5 text-amber-400" />
                  <span>{selectedBooks.length === 1 ? 'Archive Book' : `Archive Selected (${selectedBooks.length})`}</span>
                </Button>

                {/* Delete choice */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOpenDeleteConfirm(selectedBooks)}
                  className="text-xs font-bold flex items-center gap-1.5 h-9 px-3.5 rounded-xl shadow-xs bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                  title={selectedBooks.length === 1 ? "Delete Book" : "Delete Selected Books"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{selectedBooks.length === 1 ? 'Delete Book' : `Delete Selected (${selectedBooks.length})`}</span>
                </Button>

                {/* Deselect / Clear choice */}
                <button
                  type="button"
                  onClick={() => setSelectedBookIds([])}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
                  title="Deselect All"
                  aria-label="Deselect All"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredBooks}
            searchPlaceholder="Search catalog by title, author, ISBN, accession number, or shelf bay..."
            searchField={(row) => `${row.title} ${row.author} ${row.isbn} ${row.accession_number} ${row.shelf_location || ''}`}
            initialSortKey="title"
            itemsPerPage={10}
            selectable={true}
            selectedIds={selectedBookIds}
            onSelectionChange={(ids) => setSelectedBookIds(ids as string[])}
            rowIdKey="id"
            toolbarSlot={
              <div className="flex items-center gap-2">
                {selectedBookIds.length < filteredBooks.length && filteredBooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookIds(filteredBooks.map(b => b.id))}
                    className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select All ({filteredBooks.length})</span>
                  </button>
                )}
                {selectedBookIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookIds([])}
                    className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Deselect All</span>
                  </button>
                )}
              </div>
            }
          />
        </div>
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
        isOpen={!!deleteConfirmBooks && deleteConfirmBooks.length > 0}
        onClose={() => setDeleteConfirmBooks(null)}
        title={deleteConfirmBooks && deleteConfirmBooks.length > 1 ? `Confirm Deletion (${deleteConfirmBooks.length} Books)` : 'Confirm Deletion'}
        size={deleteConfirmBooks && deleteConfirmBooks.length > 1 ? 'md' : 'sm'}
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmBooks(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteLoading}
              onClick={() => {
                if (deleteConfirmBooks) {
                  handleDeleteExecute(deleteConfirmBooks);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              {deleteConfirmBooks && deleteConfirmBooks.length > 1 ? `Delete ${deleteConfirmBooks.length} Books` : 'Delete'}
            </Button>
          </div>
        }
      >
        {deleteConfirmBooks && deleteConfirmBooks.length > 0 && (
          <div className="space-y-4 text-center px-2 pt-2 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 mb-1 animate-pulse">
              <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {deleteConfirmBooks.length === 1 ? 'Confirm Catalog Deletion' : `Confirm Deletion of ${deleteConfirmBooks.length} Books`}
              </h4>
              {deleteConfirmBooks.length === 1 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you absolutely sure you want to permanently delete <span className="font-extrabold text-slate-800 dark:text-slate-100">"{deleteConfirmBooks[0].title}"</span> from the catalog registry?
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you sure you want to permanently delete these <span className="font-bold text-rose-600 dark:text-rose-400">{deleteConfirmBooks.length} books</span>? This action cannot be undone.
                </p>
              )}
            </div>

            {deleteConfirmBooks.length > 1 && (
              <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Selected Titles:
                </p>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {deleteConfirmBooks.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 truncate font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="truncate">{b.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({b.accession_number || b.isbn})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ARCHIVE/UNARCHIVE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!archiveConfirmBooks && archiveConfirmBooks.length > 0}
        onClose={() => setArchiveConfirmBooks(null)}
        title={archiveConfirmBooks && archiveConfirmBooks.length > 1 ? `Confirm Archival (${archiveConfirmBooks.length} Books)` : 'Archive Book'}
        size={archiveConfirmBooks && archiveConfirmBooks.length > 1 ? 'md' : 'sm'}
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveConfirmBooks(null)}
              className="h-11 px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={archiveLoading}
              onClick={() => {
                if (archiveConfirmBooks) {
                  handleArchiveExecute(archiveConfirmBooks);
                }
              }}
              className="h-11 px-6 text-xs font-bold"
            >
              {archiveConfirmBooks && archiveConfirmBooks.length > 1 ? `Archive ${archiveConfirmBooks.length} Books` : 'Archive'}
            </Button>
          </div>
        }
      >
        {archiveConfirmBooks && archiveConfirmBooks.length > 0 && (
          <div className="space-y-4 text-center px-2 pt-2 pb-2">
            <div className="mx-auto h-12 w-12 rounded-full border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
              <Archive className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {archiveConfirmBooks.length === 1 ? 'Archive Book Record' : `Archive ${archiveConfirmBooks.length} Book Records`}
              </h4>
              {archiveConfirmBooks.length === 1 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you sure you want to archive <span className="font-extrabold text-slate-800 dark:text-slate-100">"{archiveConfirmBooks[0].title}"</span>? This will hide the title from library members while preserving borrowing histories.
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Are you sure you want to archive these <span className="font-bold text-amber-600 dark:text-amber-400">{archiveConfirmBooks.length} books</span>? They will be hidden from the active catalog.
                </p>
              )}
            </div>

            {archiveConfirmBooks.length > 1 && (
              <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Selected Titles:
                </p>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {archiveConfirmBooks.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 truncate font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="truncate">{b.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({b.accession_number || b.isbn})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AdminBooks;
