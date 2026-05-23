// src/pages/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Book, Library, Search, Clock, ShieldCheck, HelpCircle, MessageSquare, Mail, Phone, ChevronLeft, ChevronRight, Filter, Menu, X } from 'lucide-react';
import api from '../lib/api';
import BookCard from '../components/common/BookCard';
import type { BookItem } from '../components/common/BookCard';
import Modal from '../components/common/Modal';
import logoImg from '../assets/logo.png';
import heroBgImg from '../assets/hero-bg.jpg';
import about1 from '../assets/about-1.jpg';
import about2 from '../assets/about-2.jpg';
import about3 from '../assets/about-3.jpg';
import about4 from '../assets/about-4.jpg';
import about5 from '../assets/about-5.jpg';

export const LandingPage: React.FC = () => {
  const [featuredBooks, setFeaturedBooks] = useState<BookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const aboutImages = [about1, about2, about3, about4, about5];

  // Full Catalog States
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoriesList = [
    'Fiction',
    'Science',
    'History',
    'Biography',
    'Philosophy',
    'Technology',
    'Children',
  ];

  const fetchCatalog = async () => {
    setCatalogLoading(true);
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
        setFeaturedBooks(response.data.data.books);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % aboutImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [page]);

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

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div id="home" className="min-h-screen bg-slate-50 gradient-bg flex flex-col scroll-smooth overflow-x-hidden">
      {/* Header navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-6 py-5 sm:py-4.5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white">
              <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-800 m-0 leading-tight">
                Balingasag Municipal
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-extrabold uppercase tracking-wider leading-none mt-0.5">
                Public Library
              </p>
            </div>
          </div>

          {/* Center navigation links for Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider">
              Home
            </a>
            <a href="#catalog-preview" className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider">
              Catalog
            </a>
            <a href="#about-us" className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider">
              About Us
            </a>
            <a href="#contact-us" className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider">
              Contact Us
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap text-xs font-bold text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-600 px-4 rounded-xl hover:bg-emerald-50/20 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-95"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile hamburger icon trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Slideout Sidebar Menu Drawer */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu Window */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 animate-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/80">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full overflow-hidden border-2 border-emerald-200 shadow-sm shadow-emerald-100/50 ring-1 ring-emerald-50">
                  <img src={logoImg} alt="Library Logo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black tracking-tight text-slate-700 uppercase leading-none">
                    Library Portal
                  </h3>
                  <p className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none mt-0.5">Balingasag</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Vertical Link Navigation */}
            <nav className="flex-1 px-6 py-8 flex flex-col gap-5">
              <a 
                href="#home" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-3 py-1.5"
              >
                Home
              </a>
              <a 
                href="#catalog-preview" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-3 py-1.5"
              >
                Catalog
              </a>
              <a 
                href="#about-us" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-3 py-1.5"
              >
                About Us
              </a>
              <a 
                href="#contact-us" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-3 py-1.5"
              >
                Contact Us
              </a>
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full h-11 items-center justify-center text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 hover:border-emerald-600 rounded-xl transition-all shadow-sm"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full h-11 items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-150"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hero section */}
      <section className="relative text-white px-6 py-20 md:py-28 text-center overflow-hidden">
        {/* Background Image Container with Blur effect and scale to prevent edge bleed */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-[5px] scale-105 z-0"
          style={{ backgroundImage: `url(${heroBgImg})` }}
        />
        
        {/* Cinematic dark gradient overlay for superb contrast and legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/90 via-primary-950/75 to-emerald-950/85 z-10" />
        
        {/* Soft decorative blur circle on top of overlay */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl z-10" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-20">
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/20 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Balingasag Municipal Public Library
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover a World of Knowledge at Your Fingertips
          </h1>
          <p className="text-sm md:text-base text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Welcome to the official digital portal of the Balingasag Municipal Public Library. Explore our dynamic catalog, borrow bestsellers, check outstanding balances, and track history.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="px-6 py-3.5 bg-white text-primary-900 hover:bg-emerald-50 text-sm font-bold rounded-xl shadow-lg transition-all duration-150"
            >
              Get Library Card
            </Link>
            <a
              href="#catalog-preview"
              className="px-6 py-3.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-100 text-sm font-bold rounded-xl border border-emerald-500/20 transition-all duration-150"
            >
              Browse Catalog
            </a>
          </div>
        </div>
      </section>

      {/* Info values banner */}
      <section id="quick-info" className="max-w-7xl mx-auto w-full px-6 -mt-8 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-2xl p-6 flex gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Opening Hours</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Monday - Friday: 8:00 AM - 5:00 PM<br />
              Closed on Weekends & Public Holidays.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-2xl p-6 flex gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Strict Borrowing Policies</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Borrow up to 3 books for 14 days. Outstanding late dues incur daily charges of ₱5.00/day.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-2xl p-6 flex gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Help & Guidance</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Need assistance? Drop by the Municipal Information Counter or email library@balingasag.gov.ph
            </p>
          </div>
        </div>
      </section>

      {/* Catalog Preview */}
      <section id="catalog-preview" className="max-w-7xl mx-auto w-full px-6 py-16 flex-1 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Explore our Curated Book Registry
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-lg mx-auto">
            Search our physical shelves and browse books. Create an account or sign in to borrow books digitally.
          </p>
        </div>

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

            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors">
              Query Shelves
            </button>
          </div>
        </form>

        {/* Books grid layout */}
        {catalogLoading ? (
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
        ) : featuredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-18 border border-dashed border-slate-200 rounded-3xl bg-white/40 text-slate-400">
            <Book className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-600">No books found</h4>
            <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1">
              Try adjusting your fuzzy search query or choosing a different genre filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onViewDetails={setSelectedBook}
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
      </section>

      {/* Book details Modal overlay */}
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
              <span className="text-xs font-semibold text-slate-400">Want to borrow this book?</span>
              <Link
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-primary-700 hover:from-emerald-700 hover:to-primary-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 transition-all duration-150"
              >
                Sign In to Borrow
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* About Us Comprehensive Section */}
      <section id="about-us" className="bg-white border-t border-b border-slate-100 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
          <div className="space-y-6">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Our Legacy & Mission
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Serving Balingasag Borrowers Since 1991
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Established in 1991, the Balingasag Municipal Public Library is dedicated to encouraging lifelong learning, local literacy, and educational growth in our municipal community. We provide free access to a rich collection of literary masterpieces, scientific papers, history resources, and modern computer technologies.
            </p>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Through collaborative programs, digital access terminals, and continuous catalog updates, we enable both students and senior residents to expand their boundaries, learn critical skills, and connect with local history resources.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4 text-center">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <span className="block text-xl md:text-2xl font-black text-emerald-600">3,000+</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Catalog Books</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <span className="block text-xl md:text-2xl font-black text-emerald-600">1,500+</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Members</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <span className="block text-xl md:text-2xl font-black text-emerald-600">35+ Yrs</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
              </div>
            </div>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 h-80 bg-slate-100 group">
            {aboutImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Balingasag Municipal Library Activity ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                }`}
              />
            ))}
            {/* Cinematic dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-20" />
            
            {/* Manual slideshow controls (visible on hover) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setCurrentSlide((prev) => (prev - 1 + aboutImages.length) % aboutImages.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-30"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setCurrentSlide((prev) => (prev + 1) % aboutImages.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-30"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Caption & Indicators overlay */}
            <div className="absolute bottom-5 left-5 right-5 text-left z-30 space-y-2.5">
              <p className="text-white text-xs font-bold leading-normal drop-shadow">
                {currentSlide === 0 && "Children engaging in storytelling and reading lessons inside our library."}
                {currentSlide === 1 && "Local youth and high-school students studying in our dedicated learning center."}
                {currentSlide === 2 && "Outdoors literacy circle: Storytelling sessions for children in the municipal park."}
                {currentSlide === 3 && "Work immersion and computer literacy workshops hosted by our dedicated librarians."}
                {currentSlide === 4 && "Vibrant children's corner: Learning on colorful educational puzzle mats."}
              </p>
              
              {/* Slide Indicator dots */}
              <div className="flex gap-1.5 justify-start">
                {aboutImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentSlide(index);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/50 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Comprehensive Section */}
      <section id="contact-us" className="bg-slate-50 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Get In Touch
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
              We'd Love to Hear From You
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Have questions about borrowing limits, registration, or municipal books? Reach out!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Details Card 1 - Gmail Direct Link */}
            <a 
              href="mailto:raymarkacierto27@gmail.com"
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col items-center text-center space-y-4 group"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <Mail className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Gmail Support</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Click here to compose an email directly to our Gmail helpdesk for general inquiries and registration support.
              </p>
              <span className="text-xs font-bold text-emerald-600 group-hover:underline font-mono">
                raymarkacierto27@gmail.com
              </span>
            </a>

            {/* Contact Details Card 2 - Facebook Page Direct Link */}
            <a 
              href="https://www.facebook.com/atina2022" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col items-center text-center space-y-4 group"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Facebook Page</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Click here to open our official Facebook page to ask questions, view updates, and get support.
              </p>
              <span className="text-xs font-bold text-emerald-600 group-hover:underline font-mono">
                facebook.com/BalingasagLibrary
              </span>
            </a>

            {/* Contact Details Card 3 - Mobile Hotline Direct Link */}
            <a 
              href="tel:+639552450503"
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col items-center text-center space-y-4 group"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <Phone className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Mobile Hotline</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Click here to call our library staff directly during operating hours (Mon-Fri 8:00 AM - 5:00 PM).
              </p>
              <span className="text-xs font-bold text-emerald-600 group-hover:underline font-mono">
                +63 955 245 0503
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-950 text-primary-200 px-6 py-12 text-center border-t border-primary-900/60 text-sm">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 text-white font-bold">
            <Library className="h-5 w-5 text-emerald-400" />
            <span>Balingasag Public Library System</span>
          </div>
          <p className="text-xs text-primary-400 font-medium">
            © {new Date().getFullYear()} Balingasag Municipal Library. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
