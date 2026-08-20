// src/pages/member/DigitalLibrary.tsx
import React, { useState, useEffect } from 'react';
import { Globe, Search, BookOpen, FileText, Sparkles, Clock, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/common/Button';

export const DigitalLibrary: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Reader Modal
  const [activeReadingItem, setActiveReadingItem] = useState<any | null>(null);
  const [readTimer, setReadTimer] = useState(0);

  const fetchDigitalResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/member-features/digital_resources', { params });
      if (response.data && response.data.success) {
        setResources(response.data.data.resources || []);
        setCategories(['All', ...(response.data.data.categories || [])]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load digital resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDigitalResources();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDigitalResources();
  };

  // Timer for active reading
  useEffect(() => {
    let interval: any = null;
    if (activeReadingItem) {
      interval = setInterval(() => {
        setReadTimer(t => t + 1);
      }, 1000);
    } else {
      setReadTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeReadingItem]);

  const handleOpenReader = async (item: any) => {
    setActiveReadingItem(item);
    setReadTimer(0);

    // Track initial access
    try {
      await api.post('/member-features/digital_resources', {
        resource_id: item.id,
        duration_seconds: 60
      });
    } catch (e) {}
  };

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/10">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Balingasag Digital e-Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Explore municipal archives, digital monographs, research journals, and open-access e-books
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search digital articles, Philippine history journals, municipal decrees..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Resource Cards Grid */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400">Loading digital resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No digital resources found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try a different search query or select another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wider">
                    {res.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {res.file_type} • {res.file_size_mb} MB
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Author / Publisher: {res.author}
                </p>
                {res.description && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleOpenReader(res)}
                  className="w-full py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-900/10"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Read Digital Material</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Digital Reader Modal */}
      {activeReadingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveReadingItem(null)} />

          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[85vh] overflow-hidden z-10 animate-scale-up">
            {/* Reader Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {activeReadingItem.title}
                  </h3>
                  <p className="text-xs text-teal-400 font-medium flex items-center gap-2">
                    <span>{activeReadingItem.author}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Session time: {Math.floor(readTimer / 60)}m {readTimer % 60}s
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveReadingItem(null)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Reader
              </button>
            </div>

            {/* Reader Body Viewer */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6">
              <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
                <div className="border-b border-slate-100 pb-6 text-center space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                    {activeReadingItem.category}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">
                    {activeReadingItem.title}
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Published by {activeReadingItem.author}
                  </p>
                </div>

                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4">
                  <p className="font-semibold text-slate-800">
                    Overview & Description:
                  </p>
                  <p>
                    {activeReadingItem.description || 'This digital monograph is part of the Balingasag Municipal Public Library digital repository. It is made available for online reading, academic study, and municipal research.'}
                  </p>
                  <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs text-teal-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      Digital Reading Rights & Citation
                    </p>
                    <p className="text-teal-800/80 leading-relaxed">
                      Source document verified by Balingasag Municipal Library. Reading activity is securely recorded to your member reading timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalLibrary;
