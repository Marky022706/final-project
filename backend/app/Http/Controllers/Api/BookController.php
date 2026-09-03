<?php

namespace App\Http\Controllers\Api;

use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BookController extends BaseApiController
{
    public function getAll(Request $request): JsonResponse
    {
        $query = Book::query();

        // Status / Archived filtering
        $status = $request->input('status');
        $includeArchived = filter_var($request->input('include_archived', false), FILTER_VALIDATE_BOOLEAN);

        if ($status === 'archived') {
            $query->where('status', 'archived');
        } elseif ($request->filled('status') && strtolower($status) !== 'all') {
            $query->where('status', $status);
        } elseif (!$includeArchived) {
            $query->where('status', '!=', 'archived');
        }

        // Category filtering
        $category = $request->input('category');
        if ($request->filled('category') && strtolower($category) !== 'all') {
            $query->where('category', $category);
        }

        // Condition filtering
        $condition = $request->input('condition');
        if ($request->filled('condition') && strtolower($condition) !== 'all') {
            $query->where('book_condition', $condition);
        }

        // Format filtering
        $format = $request->input('format');
        if ($request->filled('format') && strtolower($format) !== 'all') {
            $query->where('format', $format);
        }

        // Availability filtering
        $availability = $request->input('availability');
        if ($availability === 'available') {
            $query->where('available_copies', '>', 0)->where('status', 'available');
        } elseif ($availability === 'unavailable') {
            $query->where(function ($q) {
                $q->where('available_copies', '<=', 0)->orWhere('status', 'unavailable');
            });
        }

        // Search filtering
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('publisher', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('accession_number', 'like', "%{$search}%")
                  ->orWhere('shelf_location', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Distinct categories for filters
        $categories = Book::whereNotNull('category')
            ->where('category', '!=', '')
            ->where('status', '!=', 'archived')
            ->distinct()
            ->orderBy('category', 'asc')
            ->pluck('category');

        $totalBooks = $query->count();

        $page = max(1, (int) $request->input('page', 1));
        $limit = min(100, max(1, (int) $request->input('limit', 12)));
        $totalPages = $limit > 0 ? (int) ceil($totalBooks / $limit) : 1;
        $offset = ($page - 1) * $limit;

        $books = $query->orderBy('created_at', 'desc')
            ->orderBy('title', 'asc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return $this->success([
            'books' => $books,
            'categories' => $categories,
            'pagination' => [
                'total' => $totalBooks,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => $totalPages,
            ]
        ], 'Books retrieved successfully.');
    }

    public function getOne(Request $request): JsonResponse
    {
        $id = $request->input('id') ?? $request->query('id');

        if (!$id) {
            return $this->error('Book ID is required.', 400);
        }

        $book = Book::find($id);
        if (!$book) {
            return $this->error('Book not found.', 404);
        }

        return $this->success($book, 'Book details retrieved successfully.');
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:150',
            'publisher' => 'nullable|string|max:150',
            'isbn' => 'required|string|max:30|unique:books,isbn',
            'category' => 'required|string|max:100',
            'year' => 'required|integer',
            'shelf_location' => 'nullable|string|max:50',
            'format' => 'nullable|string|max:50',
            'book_condition' => 'nullable|string',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'total_copies' => 'nullable|integer|min:1',
            'accession_number' => 'nullable|string|unique:books,accession_number',
        ]);

        $bookId = 'BK-' . strtoupper(Str::random(10));
        $accession = $validated['accession_number'] ?? ('ACC-' . date('Y') . '-' . strtoupper(Str::random(5)));
        $totalCopies = $validated['total_copies'] ?? 1;

        $book = Book::create([
            'id' => $bookId,
            'accession_number' => $accession,
            'title' => $validated['title'],
            'author' => $validated['author'],
            'publisher' => $validated['publisher'] ?? null,
            'isbn' => $validated['isbn'],
            'category' => $validated['category'],
            'year' => $validated['year'],
            'shelf_location' => $validated['shelf_location'] ?? 'Main Shelf',
            'format' => $validated['format'] ?? 'Paperback',
            'book_condition' => $validated['book_condition'] ?? 'good',
            'description' => $validated['description'] ?? null,
            'cover_image' => $validated['cover_image'] ?? null,
            'total_copies' => $totalCopies,
            'available_copies' => $totalCopies,
            'qr_code' => 'BOOK-QR-' . $bookId,
            'status' => 'available',
        ]);

        $this->logActivity(
            $request->user()?->id,
            'book_create',
            'Catalog Management',
            "Added new catalog entry: '{$book->title}' (ISBN: {$book->isbn})",
            $request
        );

        return $this->success($book, 'Book added to catalog successfully.', 201);
    }

    public function update(Request $request): JsonResponse
    {
        $id = $request->input('id');
        if (!$id) {
            return $this->error('Book ID is required.', 400);
        }

        $book = Book::find($id);
        if (!$book) {
            return $this->error('Book not found.', 404);
        }

        $fillable = [
            'title', 'author', 'publisher', 'isbn', 'category', 'year',
            'shelf_location', 'format', 'book_condition', 'description',
            'cover_image', 'total_copies', 'available_copies', 'status',
            'accession_number'
        ];

        foreach ($fillable as $f) {
            if ($request->has($f)) {
                $book->$f = $request->input($f);
            }
        }

        $book->save();

        $this->logActivity(
            $request->user()?->id,
            'book_update',
            'Catalog Management',
            "Updated catalog entry: '{$book->title}' (ID: {$book->id})",
            $request
        );

        return $this->success($book, 'Book details updated successfully.');
    }

    public function delete(Request $request): JsonResponse
    {
        $ids = $request->input('ids');
        $id = $request->input('id') ?? $request->query('id');

        if (!$id && !$ids) {
            return $this->error('Book ID is required.', 400);
        }

        $idList = $ids ? (is_array($ids) ? $ids : explode(',', $ids)) : [$id];
        $books = Book::whereIn('id', $idList)->get();

        if ($books->isEmpty()) {
            return $this->error('No matching books found.', 404);
        }

        $deletedCount = 0;
        $deletedTitles = [];
        foreach ($books as $book) {
            $deletedTitles[] = $book->title;
            $book->delete();
            $deletedCount++;
        }

        $this->logActivity(
            $request->user()?->id,
            'book_delete',
            'Catalog Management',
            $deletedCount > 1 
                ? "Deleted {$deletedCount} books from catalog: " . implode(', ', array_slice($deletedTitles, 0, 3)) . ($deletedCount > 3 ? '...' : '')
                : "Deleted book from catalog: '{$deletedTitles[0]}'",
            $request
        );

        return $this->success(null, $deletedCount > 1 ? "{$deletedCount} books removed from catalog successfully." : 'Book removed from catalog successfully.');
    }

    public function archive(Request $request): JsonResponse
    {
        $ids = $request->input('ids');
        $id = $request->input('id');

        if (!$id && !$ids) {
            return $this->error('Book ID is required.', 400);
        }

        $idList = $ids ? (is_array($ids) ? $ids : explode(',', $ids)) : [$id];
        $books = Book::whereIn('id', $idList)->get();

        if ($books->isEmpty()) {
            return $this->error('No matching books found.', 404);
        }

        $archivedCount = 0;
        $titles = [];
        foreach ($books as $book) {
            $book->status = 'archived';
            $book->save();
            $archivedCount++;
            $titles[] = $book->title;
        }

        $this->logActivity(
            $request->user()?->id,
            'book_archive',
            'Catalog Management',
            $archivedCount > 1 
                ? "Archived {$archivedCount} book records: " . implode(', ', array_slice($titles, 0, 3)) . ($archivedCount > 3 ? '...' : '')
                : "Archived book record: '{$titles[0]}'",
            $request
        );

        return $this->success(null, $archivedCount > 1 ? "{$archivedCount} books archived successfully." : 'Book archived successfully.');
    }
}
