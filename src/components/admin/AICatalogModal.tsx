import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Bot, Check, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import Button from '../common/Button';

interface AICatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedBook: any) => void;
}

export const AICatalogModal: React.FC<AICatalogModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Input query, Step 2: Review/Edit metadata
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata form state
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    publisher: '',
    category: 'General Collection',
    year: new Date().getFullYear(),
    isbn: '',
    accession_number: '',
    shelf_location: 'Main Shelf',
    format: 'Paperback',
    book_condition: 'good',
    total_copies: 1,
    description: '',
  });

  if (!isOpen) return null;

  const handleFetchAIMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTitle.trim() && !searchAuthor.trim()) {
      setError('Please provide at least a book title or author name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/catalog', {
        title: searchTitle.trim(),
        author: searchAuthor.trim(),
      });

      if (response.data && response.data.success) {
        const data = response.data.data;
        setMetadata({
          title: data.title || searchTitle,
          author: data.author || searchAuthor,
          publisher: data.publisher || 'Standard Publication',
          category: data.category || 'General Collection',
          year: data.year || new Date().getFullYear(),
          isbn: data.isbn || ('978-' + Math.floor(1000000000 + Math.random() * 9000000000)),
          accession_number: 'ACC-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          shelf_location: data.shelf_location || 'Main Shelf',
          format: data.format || 'Paperback',
          book_condition: 'good',
          total_copies: 1,
          description: data.description || '',
        });
        setStep(2);
      } else {
        throw new Error(response.data?.message || 'Could not retrieve metadata.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Book information could not be retrieved. Please enter manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await api.post('/books/create', metadata);
      if (response.data && response.data.success) {
        onSuccess(response.data.data);
        handleClose();
      } else {
        throw new Error(response.data?.message || 'Failed to save catalog record.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Server error while saving book.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSearchTitle('');
    setSearchAuthor('');
    setError(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>AI-Assisted Book Cataloging</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Gemini LLM
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {step === 1 ? 'Step 1: Search Bibliographic Metadata' : 'Step 2: Review, Edit & Confirm Catalog Entry'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleFetchAIMetadata} className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <Bot className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-900 leading-relaxed space-y-1">
                  <p className="font-bold">Automated Bibliographic Record Generation</p>
                  <p className="text-emerald-800/80">
                    Enter the book title and author. The AI cataloger will analyze Google Books & library ontologies to extract standard classification, ISBN, publisher, and summary descriptions.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="e.g. Noli Me Tangere or Clean Code"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Author Name (Optional but Recommended)
                </label>
                <input
                  type="text"
                  value={searchAuthor}
                  onChange={(e) => setSearchAuthor(e.target.value)}
                  placeholder="e.g. Jose Rizal or Robert C. Martin"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder-slate-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="px-5 py-2.5 text-xs font-bold">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-950/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Retrieve AI Metadata</span>
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Review Notice:</strong> Please verify all AI-extracted fields. You can edit any details before adding this book to the municipal catalog.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Official Title *</label>
                  <input
                    type="text"
                    required
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Author *</label>
                  <input
                    type="text"
                    required
                    value={metadata.author}
                    onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Publisher</label>
                  <input
                    type="text"
                    value={metadata.publisher}
                    onChange={(e) => setMetadata({ ...metadata, publisher: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Category *</label>
                  <input
                    type="text"
                    required
                    value={metadata.category}
                    onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Publication Year *</label>
                  <input
                    type="number"
                    required
                    value={metadata.year}
                    onChange={(e) => setMetadata({ ...metadata, year: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">ISBN *</label>
                  <input
                    type="text"
                    required
                    value={metadata.isbn}
                    onChange={(e) => setMetadata({ ...metadata, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Accession Number</label>
                  <input
                    type="text"
                    value={metadata.accession_number}
                    onChange={(e) => setMetadata({ ...metadata, accession_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Shelf Location</label>
                  <input
                    type="text"
                    value={metadata.shelf_location}
                    onChange={(e) => setMetadata({ ...metadata, shelf_location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Condition</label>
                  <select
                    value={metadata.book_condition}
                    onChange={(e) => setMetadata({ ...metadata, book_condition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="new">New (Pristine)</option>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair (Readable)</option>
                    <option value="damaged">Damaged / Needs Repair</option>
                    <option value="under_maintenance">Under Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Book Description & Summary</label>
                  <textarea
                    rows={3}
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-query AI</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} className="px-4 py-2.5 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    className="px-6 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Book & Generate QR</span>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AICatalogModal;
