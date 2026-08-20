// src/pages/public/LandingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, Mail, Phone, ChevronLeft, ChevronRight, Menu, X, MapPin, Check, Landmark, ArrowRight, BookOpen, Search, Wifi, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import logoImg from '../../assets/logo.png';
import heroBgImg from '../../assets/hero-bg.jpg';
import about1 from '../../assets/about-1.jpg';
import about2 from '../../assets/about-2.jpg';
import about3 from '../../assets/about-3.jpg';
import about4 from '../../assets/about-4.jpg';
import about5 from '../../assets/about-5.jpg';

// Animated counter hook — counts from 0 to target when element is visible
const useAnimatedCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [prevTarget, setPrevTarget] = useState(target);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  if (target !== prevTarget) {
    setPrevTarget(target);
    setCount(0);
    setHasAnimated(false);
  }

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return { count, elementRef };
};

export const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const aboutImages = [about1, about2, about3, about4, about5];

  // Dynamic section highlight observer
  useEffect(() => {
    const sectionIds = ['hero', 'services', 'how-to-access', 'about-us', 'contact-us'];
    
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0.1,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id === 'hero' ? 'home' : id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (isAtBottom) {
        setActiveSection('contact-us');
      } else if (window.scrollY === 0) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll-reveal fade-in / fade-out observer
  useEffect(() => {
    const revealElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-stagger, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale'
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { root: null, threshold: 0.15 }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, []);

  // --- Public Stats ---
  const LIBRARY_ESTABLISHED_YEAR = 1991;
  const yearsOfService = new Date().getFullYear() - LIBRARY_ESTABLISHED_YEAR;
  const [totalBooks, setTotalBooks] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);

  const { count: booksCount, elementRef: booksRef } = useAnimatedCounter(totalBooks);
  const { count: membersCount, elementRef: membersRef } = useAnimatedCounter(activeMembers);
  const { count: yearsCounterVal, elementRef: yearsRef } = useAnimatedCounter(yearsOfService);

  // Fetch public stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/public-stats');
        if (res.data && res.data.success) {
          setTotalBooks(res.data.data.total_books);
          setActiveMembers(res.data.data.active_members);
        }
      } catch (err) {
        console.error('Failed to load public stats:', err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % aboutImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
    <div id="home" className="min-h-screen bg-slate-50 gradient-bg flex flex-col scroll-smooth overflow-x-clip">
      {/* Header navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo & Seal */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-white">
              <img src={logoImg} alt="Balingasag Municipal Library Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-xs font-black tracking-wider text-[#15803d] uppercase leading-none">
                BALINGASAG MUNICIPAL
              </span>
              <span className="text-sm sm:text-base font-black tracking-tight text-[#064e3b] uppercase leading-tight mt-0.5">
                PUBLIC LIBRARY
              </span>
            </div>
          </div>

          {/* Center navigation links for Desktop */}
          <nav className="hidden lg:flex items-center gap-8">
            <a
              href="#home"
              className={`text-xs font-black tracking-wider uppercase transition-colors relative py-1 ${
                activeSection === 'home'
                  ? 'text-[#16a34a] border-b-2 border-[#16a34a]'
                  : 'text-slate-700 hover:text-[#16a34a]'
              }`}
            >
              HOME
            </a>
            <a
              href="#services"
              className={`text-xs font-black tracking-wider uppercase transition-colors relative py-1 ${
                activeSection === 'services'
                  ? 'text-[#16a34a] border-b-2 border-[#16a34a]'
                  : 'text-slate-700 hover:text-[#16a34a]'
              }`}
            >
              SERVICES
            </a>
            <a
              href="#how-to-access"
              className={`text-xs font-black tracking-wider uppercase transition-colors relative py-1 ${
                activeSection === 'how-to-access'
                  ? 'text-[#16a34a] border-b-2 border-[#16a34a]'
                  : 'text-slate-700 hover:text-[#16a34a]'
              }`}
            >
              HOW TO ACCESS
            </a>
            <a
              href="#about-us"
              className={`text-xs font-black tracking-wider uppercase transition-colors relative py-1 ${
                activeSection === 'about-us'
                  ? 'text-[#16a34a] border-b-2 border-[#16a34a]'
                  : 'text-slate-700 hover:text-[#16a34a]'
              }`}
            >
              ABOUT US
            </a>
            <a
              href="#contact-us"
              className={`text-xs font-black tracking-wider uppercase transition-colors relative py-1 ${
                activeSection === 'contact-us'
                  ? 'text-[#16a34a] border-b-2 border-[#16a34a]'
                  : 'text-slate-700 hover:text-[#16a34a]'
              }`}
            >
              CONTACT US
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap text-xs font-bold text-[#15803d] border-2 border-[#16a34a] px-5 rounded-lg hover:bg-emerald-50 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap px-5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile hamburger icon trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
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
                <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm ring-1 ring-emerald-100">
                  <img src={logoImg} alt="Library Logo" className="h-full w-full object-contain" />
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
            <nav className="flex-1 px-4 py-8 flex flex-col gap-1.5">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-150 ${
                  activeSection === 'home'
                    ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-150 ${
                  activeSection === 'services'
                    ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                Services
              </a>
              <a
                href="#how-to-access"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-150 ${
                  activeSection === 'how-to-access'
                    ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                How to Access
              </a>
              <a
                href="#about-us"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-150 ${
                  activeSection === 'about-us'
                    ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                About Us
              </a>
              <a
                href="#contact-us"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-150 ${
                  activeSection === 'contact-us'
                    ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                Contact Us
              </a>
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full h-11 items-center justify-center text-sm font-bold text-[#15803d] bg-white border-2 border-[#16a34a] rounded-xl transition-all shadow-sm"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full h-11 items-center justify-center bg-[#15803d] hover:bg-[#166534] text-white text-sm font-bold rounded-xl shadow-md transition-all duration-150"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hero section */}
      <section id="hero" className="relative bg-[#06332c] text-white px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 overflow-hidden min-h-[520px] flex items-center">
        {/* Base Background Image: Sharp and vivid */}
        <div 
          className="absolute inset-0 bg-cover bg-right md:bg-center z-0 scale-105"
          style={{ backgroundImage: `url(${heroBgImg})` }}
        />

        {/* Left-Side Prominent Blurred Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-right md:bg-center z-0 filter blur-[14px] md:blur-[18px] scale-110 pointer-events-none"
          style={{ 
            backgroundImage: `url(${heroBgImg})`,
            maskImage: 'linear-gradient(115deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'linear-gradient(115deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)'
          }}
        />

        {/* Global subtle photo dimming */}
        <div className="absolute inset-0 bg-black/25 z-0" />

        {/* Slanted translucent emerald overlay (115deg) - maintains readability while letting blurred textures through */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,51,44,0.88)_0%,rgba(6,51,44,0.82)_35%,rgba(6,51,44,0.65)_55%,rgba(6,51,44,0.25)_78%,transparent_100%)] z-0" />

        {/* Frosted backdrop blur layer */}
        <div 
          className="absolute inset-0 backdrop-blur-[8px] md:backdrop-blur-[12px] pointer-events-none z-0"
          style={{
            maskImage: 'linear-gradient(115deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 42%, rgba(0,0,0,0) 72%)',
            WebkitMaskImage: 'linear-gradient(115deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 42%, rgba(0,0,0,0) 72%)'
          }}
        />

        {/* Diagonal glass accent ribbon */}
        <div 
          className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-[#06332c]/50 via-emerald-900/25 to-transparent pointer-events-none z-0 hidden sm:block"
          style={{ clipPath: 'polygon(0 0, 100% 0, 72% 100%, 0% 100%)' }}
        />

        {/* Soft ambient background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-3xl space-y-6 text-left scroll-reveal">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Landmark className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>BALINGASAG MUNICIPAL PUBLIC LIBRARY • EST. 1991</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight">
              Borrow. Read. Grow. <span className="text-[#4ade80] block sm:inline">All in One Place</span>
            </h1>

            {/* Subtext */}
            <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Welcome to the official digital portal of Balingasag Municipal Public Library. Explore thousands of books, reserve physical titles online, manage your membership card, and access municipal learning resources.
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 hover:gap-3 transition-all duration-200 active:scale-95 group"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Hero Quick Stats Row */}
            <div className="pt-8 border-t border-white/15 flex items-center justify-start gap-6 sm:gap-10 flex-wrap">
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-white">5,000+</span>
                <span className="text-xs text-slate-300 font-medium">Titles Available</span>
              </div>
              <div className="h-9 w-px bg-white/20 hidden sm:block" />
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-[#4ade80]">Free</span>
                <span className="text-xs text-slate-300 font-medium">Municipal Access</span>
              </div>
              <div className="h-9 w-px bg-white/20 hidden sm:block" />
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-white">Instant</span>
                <span className="text-xs text-slate-300 font-medium">Book Holds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Library Services Section */}
      <section id="services" className="py-20 bg-white border-t border-b border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3 scroll-reveal">
            <div className="flex flex-col items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Library Services & System Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Our Core Services & Digital Support
              </h2>
              <div className="w-14 h-1 bg-[#15803d] rounded-full mt-3"></div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Discover how Balingasag Municipal Public Library combines a welcoming learning sanctuary with automated digital systems to serve readers, researchers, and students.
            </p>
          </div>

          {/* 3 Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch scroll-reveal-stagger">
            
            {/* Service 1: General Reading and Study Services */}
            <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/80 p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    Service 01
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug group-hover:text-emerald-800 transition-colors">
                    General Reading and Study Services
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The library provides a quiet, air-conditioned environment where visitors can read books, study, and complete academic work. The proposed system supports this service by allowing librarians to efficiently manage library resources and monitor the availability of books.
                  </p>
                </div>
              </div>
            </div>

            {/* Service 2: Research and Reference Access */}
            <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/80 p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Search className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    Service 02
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug group-hover:text-emerald-800 transition-colors">
                    Research and Reference Access
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The library provides access to printed books and reference materials for educational and research purposes. The proposed system digitizes the catalog, making it easier for users to locate relevant materials.
                  </p>
                </div>
              </div>
            </div>

            {/* Service 3: Free Public Wi-Fi */}
            <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/80 p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Wifi className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    Service 03
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug group-hover:text-emerald-800 transition-colors">
                    Free Public Wi-Fi
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The library provides free internet access for visitors to conduct online research and educational activities. While the Wi-Fi infrastructure is managed separately, the proposed system complements this service by providing digital library functions accessible through internet-connected devices.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How to Access the Library Section */}
      <section id="how-to-access" className="py-16 bg-slate-50 border-t border-b border-slate-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          
          {/* Header */}
          <div className="space-y-3 scroll-reveal">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider mb-1">
                Access Guide
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                How to Access the Library
              </h2>
              <div className="w-12 h-1 bg-emerald-600 rounded-full mt-3"></div>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Four simple steps stand between you and borrowing your next favorite book.
            </p>
          </div>

          {/* Stepper Flow */}
          <div className="relative max-w-5xl mx-auto py-8">
            {/* Horizontal line for desktop */}
            <div className="absolute top-[64px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-100 hidden md:block z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10 scroll-reveal-stagger">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-emerald-700 border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black">
                    1
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white stroke-[4px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Register Online</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                    Create an account on our library portal and fill out your profile details.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-emerald-700 border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black">
                    2
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white stroke-[4px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Prepare Requirements</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                    Prepare a valid student or government ID and proof of residency in Balingasag.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-emerald-700 border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black">
                    3
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white stroke-[4px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Verify at Counter</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                    Visit the library counter in person to verify your requirements and approve your account.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center space-y-4 px-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-emerald-700 border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black">
                    4
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white stroke-[4px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Start Borrowing</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                    Claim your physical library card and start borrowing up to 3 books for 14 days.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Call to Action Button */}
          <div className="pt-4 scroll-reveal-scale">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-150 active:scale-95 group"
            >
              <span>Get Your Library Account</span>
              <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* About Us Comprehensive Section */}
      <section id="about-us" className="bg-white border-t border-b border-slate-100 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
          <div className="space-y-6 scroll-reveal-left">
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
                <span ref={booksRef} className="block text-xl md:text-2xl font-black text-emerald-600">
                  {booksCount.toLocaleString()}+
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Catalog Books</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <span ref={membersRef} className="block text-xl md:text-2xl font-black text-emerald-600">
                  {membersCount.toLocaleString()}+
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Members</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <span ref={yearsRef} className="block text-xl md:text-2xl font-black text-emerald-600">
                  {yearsCounterVal}+ Yrs
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 h-80 bg-slate-100 group scroll-reveal-right">
            {aboutImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Balingasag Municipal Library Activity ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
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
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/50 hover:bg-white'
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
          <div className="text-center space-y-3 scroll-reveal">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-reveal-stagger">
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
      <footer className="bg-primary-950 text-emerald-100/90 px-6 sm:px-12 py-16 border-t border-primary-900/60 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/40 flex-shrink-0 flex items-center justify-center bg-white shadow-sm">
                <img src={logoImg} alt="Library Logo" className="h-full w-full object-cover rounded-full" />
              </div>
              <div>
                <h3 className="font-heading font-black tracking-tight text-emerald-400 text-lg leading-tight uppercase m-0">
                  Balingasag
                </h3>
                <span className="font-heading font-black text-white text-base tracking-widest leading-none uppercase block mt-0.5">
                  Public Library
                </span>
              </div>
            </div>
            <p className="text-sm text-primary-200/80 leading-relaxed font-medium">
              A modern digital haven and municipal sanctuary of knowledge nestled in Balingasag, Misamis Oriental where learning meets community.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/atina2022" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-primary-800/40 flex items-center justify-center text-white hover:text-emerald-400 hover:border-emerald-400 hover:bg-white/5 transition-all" aria-label="Facebook">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h2V2h-3c-3 0-5 2-5 5v1z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-primary-800/40 flex items-center justify-center text-white hover:text-emerald-400 hover:border-emerald-400 hover:bg-white/5 transition-all" aria-label="Instagram">
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-primary-800/40 flex items-center justify-center text-white hover:text-emerald-400 hover:border-emerald-400 hover:bg-white/5 transition-all" aria-label="YouTube">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.022 0 12 0 12s0 3.978.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.978 24 12 24 12s0-3.978-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-primary-800/40 flex items-center justify-center text-white hover:text-emerald-400 hover:border-emerald-400 hover:bg-white/5 transition-all" aria-label="X (Twitter)">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-white tracking-wide uppercase m-0">
                Quick Links
              </h3>
              <div className="w-12 h-[2.5px] bg-emerald-500 mt-1.5"></div>
            </div>
            <ul className="space-y-2.5 text-sm font-medium list-none p-0 m-0">
              <li>
                <a href="#home" className="text-primary-200/80 hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#services" className="text-primary-200/80 hover:text-white transition-colors">Services</a>
              </li>
              <li>
                <a href="#how-to-access" className="text-primary-200/80 hover:text-white transition-colors">Access Guide</a>
              </li>
              <li>
                <a href="#about-us" className="text-primary-200/80 hover:text-white transition-colors">About Us</a>
              </li>
              <li>
                <a href="#contact-us" className="text-primary-200/80 hover:text-white transition-colors">Contact Us</a>
              </li>
              <li>
                <Link to="/login" className="text-primary-200/80 hover:text-white transition-colors">Portal Login</Link>
              </li>
              <li>
                <Link to="/signup" className="text-primary-200/80 hover:text-white transition-colors">Create Account</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Get in Touch */}
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-white tracking-wide uppercase m-0">
                Get in Touch
              </h3>
              <div className="w-12 h-[2.5px] bg-emerald-500 mt-1.5"></div>
            </div>
            <ul className="space-y-3.5 text-sm text-primary-200/80 font-medium list-none p-0 m-0">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Balingasag, Misamis Oriental, Philippines</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <a href="tel:+639552450503" className="hover:text-white transition-colors">+63 955 245 0503</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <a href="mailto:raymarkacierto27@gmail.com" className="hover:text-white transition-colors">raymarkacierto27@gmail.com</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Mon - Fri: 8:00 AM - 5:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Find Us */}
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-white tracking-wide uppercase m-0">
                Find Us
              </h3>
              <div className="w-12 h-[2.5px] bg-emerald-500 mt-1.5"></div>
            </div>
            <div className="space-y-3">
              {/* Google Maps embed */}
              <div className="rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg bg-primary-900/40 relative">
                <iframe 
                  src="https://maps.google.com/maps?q=Balingasag%20Public%20Library%2C%20Balingasag%2C%20Misamis%20Oriental%2C%20Philippines&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  className="w-full h-[120px] border-0 block" 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Library Google Map"
                />
              </div>
              <a 
                href="https://www.google.com/maps?q=Balingasag%20Public%20Library%2C%20Balingasag%2C%20Misamis%20Oriental%2C%20Philippines"
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Get Directions <span className="text-xs">→</span>
              </a>
            </div>
          </div>

        </div>

        {/* Development Team */}
        <div className="max-w-7xl mx-auto border-primary-900/60 mt-12 pt-6 text-center">
          <p className="text-[10px] text-white-400 font-bold uppercase tracking-wider mb-1.5">Development Team</p>
          <p className="text-xs text-primary-300 font-medium">
            Raymark Jay Acierto &nbsp;·&nbsp; Althea Roa
          </p>
        </div>

        {/* Bottom copyright row */}
        <div className="max-w-7xl mx-auto border-t border-primary-900/60 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-300/80 gap-4">
          <p className="m-0">© {new Date().getFullYear()} Balingasag Municipal Library. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-primary-900/60">|</span>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
