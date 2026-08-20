// src/lib/bookApi.ts
import axios from 'axios';
import api from './api';

export interface BookDetails {
  title: string;
  author: string;
  publisher?: string;
  accession_number?: string;
  isbn: string;
  category: string;
  year: number;
  description: string;
  cover_image: string;
  shelf_location?: string;
  format?: string;
  total_copies?: number;
  status?: string;
  source: 'local-ai' | 'database' | 'google' | 'openlibrary';
}

const mapCategory = (categoryStr?: string): string => {
  if (!categoryStr) return 'Fiction';
  const cat = categoryStr.toLowerCase().trim();

  // 1. Children / Juvenile
  if (
    cat.includes('children') || 
    cat.includes('juvenile') || 
    cat.includes('kids') || 
    cat.includes('nursery') || 
    cat.includes('fairy tales')
  ) {
    return 'Children\'s Books';
  }

  // 2. Science & Technology
  if (
    cat.includes('science') || 
    cat.includes('mathematics') || 
    cat.includes('physics') || 
    cat.includes('chemistry') || 
    cat.includes('biology') || 
    cat.includes('nature') || 
    cat.includes('medicine') ||
    cat.includes('medical') ||
    cat.includes('astronomy') ||
    cat.includes('technology') || 
    cat.includes('computer') || 
    cat.includes('programming') || 
    cat.includes('software') || 
    cat.includes('engineering')
  ) {
    return 'Science & Technology';
  }

  // 3. Philippine History / History
  if (
    cat.includes('philippine') ||
    cat.includes('filipino') ||
    cat.includes('tagalog') ||
    cat.includes('rizal') ||
    cat.includes('manila')
  ) {
    return 'Philippine History';
  }

  if (
    cat.includes('history') || 
    cat.includes('historical') || 
    cat.includes('archaeology') || 
    cat.includes('social science') ||
    cat.includes('political science') ||
    cat.includes('anthropology') ||
    cat.includes('geography') ||
    cat.includes('travel')
  ) {
    return 'Philippine History';
  }

  // 4. Biography & Memoir
  if (
    cat.includes('biography') || 
    cat.includes('autobiography') || 
    cat.includes('memoir') ||
    cat.includes('personal memoirs')
  ) {
    return 'Biography & Memoir';
  }

  // 5. Philosophy & Psychology
  if (
    cat.includes('philosophy') || 
    cat.includes('ethics') || 
    cat.includes('logic') || 
    cat.includes('religion') || 
    cat.includes('theology') ||
    cat.includes('spirituality') ||
    cat.includes('self-help') ||
    cat.includes('psychology') ||
    cat.includes('mind') ||
    cat.includes('body & spirit')
  ) {
    return 'Philosophy & Psychology';
  }

  // 6. Literature & Poetry
  if (
    cat.includes('poetry') ||
    cat.includes('poem') ||
    cat.includes('drama') ||
    cat.includes('plays') ||
    cat.includes('literature') ||
    cat.includes('classics')
  ) {
    return 'Literature & Poetry';
  }

  // 7. Academic Research / Reference
  if (
    cat.includes('reference') ||
    cat.includes('dictionary') ||
    cat.includes('encyclopedia') ||
    cat.includes('atlas')
  ) {
    return 'General Reference';
  }

  if (
    cat.includes('academic') ||
    cat.includes('research') ||
    cat.includes('journal') ||
    cat.includes('education')
  ) {
    return 'Academic Research';
  }

  if (
    cat.includes('non-fiction') ||
    cat.includes('nonfiction')
  ) {
    return 'Non-Fiction';
  }

  return 'Fiction'; // Default fallback
};

/**
 * Attempt 1: Local AI / Library DB Endpoint (http://127.0.0.1:1234 & Local DB)
 * Supports Accession Number or ISBN lookup
 */
export const fetchFromLocalAiOrDb = async (query: string): Promise<BookDetails | null> => {
  try {
    const response = await api.post('/ai/isbn-lookup', { query, isbn: query, accession_number: query }, { timeout: 15000 });
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      return {
        title: data.title || '',
        author: data.author || '',
        publisher: data.publisher || '',
        accession_number: data.accession_number,
        isbn: data.isbn || (query.toUpperCase().startsWith('ACC') ? '' : query),
        category: mapCategory(data.category),
        year: parseInt(data.year) || new Date().getFullYear(),
        description: data.description || '',
        cover_image: data.cover_image || '',
        shelf_location: data.shelf_location || 'Main Shelf',
        format: data.format || 'Paperback',
        total_copies: data.total_copies,
        status: data.status,
        source: data.source === 'database' ? 'database' : 'local-ai'
      };
    }
  } catch (error) {
    console.warn('Local lookup failed or timed out, trying online fallback...', error);
  }
  return null;
};

/**
 * Attempt 2: Google Books API
 */
export const fetchFromGoogleBooks = async (isbn: string): Promise<BookDetails | null> => {
  try {
    const clean = isbn.trim().replace(/[-\s]/g, '');
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`, {
      timeout: 8000,
    });
    const data = response.data;
    if (data && data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      const title = volumeInfo.title || '';
      const author = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
      const description = volumeInfo.description || '';
      
      let year = new Date().getFullYear();
      if (volumeInfo.publishedDate) {
        const yearMatch = volumeInfo.publishedDate.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      const rawCategory = volumeInfo.categories ? volumeInfo.categories[0] : '';
      const category = mapCategory(rawCategory);
      
      let cover_image = '';
      if (volumeInfo.imageLinks) {
        cover_image = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || '';
        if (cover_image.startsWith('http://')) {
          cover_image = cover_image.replace('http://', 'https://');
        }
      }
      
      const publisher = volumeInfo.publisher || '';
      
      return {
        title,
        author,
        publisher,
        isbn,
        category,
        year,
        description,
        cover_image,
        source: 'google'
      };
    }
  } catch (error) {
    console.error('Google Books API failed, attempting fallback...', error);
  }
  return null;
};

/**
 * Attempt 3: Open Library API
 */
export const fetchFromOpenLibrary = async (isbn: string): Promise<BookDetails | null> => {
  try {
    const formattedIsbn = isbn.replace(/[-\s]/g, '');
    const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${formattedIsbn}&jscmd=data&format=json`, {
      timeout: 8000,
    });
    const data = response.data;
    const key = `ISBN:${formattedIsbn}`;
    if (data && data[key]) {
      const bookData = data[key];
      const title = bookData.title || '';
      const author = bookData.authors ? bookData.authors.map((a: any) => a.name).join(', ') : '';
      
      let year = new Date().getFullYear();
      if (bookData.publish_date) {
        const yearMatch = bookData.publish_date.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      let description = '';
      if (typeof bookData.description === 'string') {
        description = bookData.description;
      } else if (bookData.description && typeof bookData.description.value === 'string') {
        description = bookData.description.value;
      } else if (bookData.notes) {
        description = bookData.notes;
      } else if (bookData.subtitle) {
        description = bookData.subtitle;
      }
      
      const rawCategory = bookData.subjects && bookData.subjects.length > 0 ? bookData.subjects[0].name : '';
      const category = mapCategory(rawCategory);
      
      let cover_image = '';
      if (bookData.cover) {
        cover_image = bookData.cover.large || bookData.cover.medium || bookData.cover.small || '';
        if (cover_image.startsWith('http://')) {
          cover_image = cover_image.replace('http://', 'https://');
        }
      }
      
      const publisher = bookData.publishers && bookData.publishers.length > 0 ? bookData.publishers[0].name : '';

      return {
        title,
        author,
        publisher,
        isbn,
        category,
        year,
        description,
        cover_image,
        source: 'openlibrary'
      };
    }
  } catch (error) {
    console.error('Open Library API fallback failed:', error);
  }
  return null;
};

/**
 * Main Lookup function supporting both Accession Number and ISBN
 * Priority: Local AI (qwen/qwen3-1.7b @ http://127.0.0.1:1234) / Library DB -> Google Books -> Open Library
 */
export const fetchBookByIsbn = async (query: string): Promise<BookDetails> => {
  const clean = query.trim();
  if (!clean) {
    throw new Error('Accession Number or ISBN is required.');
  }
  
  // 1. Try Local AI / Database Lookup
  const localResult = await fetchFromLocalAiOrDb(clean);
  if (localResult && localResult.title) {
    return localResult;
  }

  // 2. Try Google Books API (if query could be an ISBN)
  const isPossibleIsbn = /^[0-9xX\- ]{9,18}$/.test(clean);
  if (isPossibleIsbn) {
    const googleResult = await fetchFromGoogleBooks(clean);
    if (googleResult && googleResult.title) {
      return googleResult;
    }
    
    // 3. Try Open Library API
    const openLibraryResult = await fetchFromOpenLibrary(clean);
    if (openLibraryResult && openLibraryResult.title) {
      return openLibraryResult;
    }
  }
  
  throw new Error(`Could not find book bibliographic records for "${query}".`);
};
