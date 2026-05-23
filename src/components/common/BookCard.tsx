// src/components/common/BookCard.tsx
import React from 'react';
import { Book, CheckCircle, XCircle } from 'lucide-react';
import Button from './Button';

export interface BookItem {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  description?: string;
  cover_image?: string;
  total_copies: number;
  available_copies: number;
  status: 'available' | 'unavailable';
}

interface BookCardProps {
  book: BookItem;
  onViewDetails: (book: BookItem) => void;
  onQuickBorrow?: (book: BookItem) => void;
  isBorrowLoading?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewDetails,
  onQuickBorrow,
  isBorrowLoading = false,
}) => {
  const isOutOfStock = book.available_copies <= 0 || book.status === 'unavailable';

  return (
    <div className="flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 group">
      {/* Book Cover Illustration or placeholder */}
      <div className="relative h-52 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50">
        {book.cover_image && book.cover_image.startsWith('http') ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-350"
            loading="lazy"
            onError={(e) => {
              // Hide image on loading error, fall back to default styling
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col items-center justify-center p-6 text-center">
            <Book className="h-10 w-10 text-emerald-600/55 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {book.category} Book
            </span>
          </div>
        )}

        {/* Availability Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full">
              <XCircle className="h-3 w-3" />
              Out of Stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
              <CheckCircle className="h-3 w-3" />
              {book.available_copies} Available
            </span>
          )}
        </div>
      </div>

      {/* Book Metadata details */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {book.category}
          </span>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 font-medium">By {book.author}</p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50 mt-4.5 pt-3.5">
          <span>Published in {book.year}</span>
          <span className="font-semibold text-slate-400">ISBN: {book.isbn}</span>
        </div>

        {/* Action triggers */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(book)}
            className="w-full text-xs"
          >
            Details
          </Button>

          {onQuickBorrow && (
            <Button
              variant="primary"
              size="sm"
              disabled={isOutOfStock}
              isLoading={isBorrowLoading}
              onClick={() => onQuickBorrow(book)}
              className="w-full text-xs"
            >
              Borrow Book
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
