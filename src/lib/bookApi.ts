// src/lib/bookApi.ts
import axios from 'axios';

export interface BookDetails {
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  description: string;
  cover_image: string;
  source: 'google' | 'openlibrary';
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
    return 'Children';
  }

  // 2. Science
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
    cat.includes('earth sciences')
  ) {
    return 'Science';
  }

  // 3. History
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
    return 'History';
  }

  // 4. Biography
  if (
    cat.includes('biography') || 
    cat.includes('autobiography') || 
    cat.includes('memoir') ||
    cat.includes('personal memoirs')
  ) {
    return 'Biography';
  }

  // 5. Philosophy
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
    return 'Philosophy';
  }

  // 6. Technology
  if (
    cat.includes('technology') || 
    cat.includes('computer') || 
    cat.includes('internet') || 
    cat.includes('programming') || 
    cat.includes('software') || 
    cat.includes('engineering') || 
    cat.includes('computers') ||
    cat.includes('information technology') ||
    cat.includes('business') ||
    cat.includes('economics') ||
    cat.includes('finance')
  ) {
    return 'Technology';
  }

  return 'Fiction'; // Default fallback
};

export const fetchFromGoogleBooks = async (isbn: string): Promise<BookDetails | null> => {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      timeout: 8000,
    });
    const data = response.data;
    if (data && data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      const title = volumeInfo.title || '';
      const author = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
      const description = volumeInfo.description || '';
      
      // Extract year
      let year = new Date().getFullYear();
      if (volumeInfo.publishedDate) {
        const yearMatch = volumeInfo.publishedDate.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      // Category mapping
      const rawCategory = volumeInfo.categories ? volumeInfo.categories[0] : '';
      const category = mapCategory(rawCategory);
      
      // Cover image - ensure https
      let cover_image = '';
      if (volumeInfo.imageLinks) {
        cover_image = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || '';
        if (cover_image.startsWith('http://')) {
          cover_image = cover_image.replace('http://', 'https://');
        }
      }
      
      return {
        title,
        author,
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
      
      // Extract year
      let year = new Date().getFullYear();
      if (bookData.publish_date) {
        const yearMatch = bookData.publish_date.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      // Description extraction
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
      
      // Category mapping
      const rawCategory = bookData.subjects && bookData.subjects.length > 0 ? bookData.subjects[0].name : '';
      const category = mapCategory(rawCategory);
      
      // Cover image
      let cover_image = '';
      if (bookData.cover) {
        cover_image = bookData.cover.large || bookData.cover.medium || bookData.cover.small || '';
        if (cover_image.startsWith('http://')) {
          cover_image = cover_image.replace('http://', 'https://');
        }
      }
      
      return {
        title,
        author,
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

export const fetchBookByIsbn = async (isbn: string): Promise<BookDetails> => {
  const cleanIsbn = isbn.trim().replace(/[-\s]/g, '');
  if (!cleanIsbn) {
    throw new Error('ISBN is required.');
  }
  
  // Attempt 1: Google Books API
  const googleResult = await fetchFromGoogleBooks(cleanIsbn);
  if (googleResult) {
    return googleResult;
  }
  
  // Attempt 2: Open Library API (Fallback)
  const openLibraryResult = await fetchFromOpenLibrary(cleanIsbn);
  if (openLibraryResult) {
    return openLibraryResult;
  }
  
  throw new Error('Could not find book details for this ISBN in Google Books or Open Library.');
};
