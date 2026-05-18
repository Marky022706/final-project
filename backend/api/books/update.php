<?php
// backend/api/books/update.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only PUT/POST is supported for updates.', 405);
}

// Admin Route Guard
Middleware::requireAdmin();

$input = Utils::getJsonInput();

if (!isset($input['id']) || (int)$input['id'] <= 0) {
    Response::badRequest('A valid Book ID is required for updates.');
}

$id = (int)$input['id'];
$title = $input['title'] ?? null;
$author = $input['author'] ?? null;
$isbn = $input['isbn'] ?? null;
$category = $input['category'] ?? null;
$year = isset($input['year']) ? (int)$input['year'] : null;
$description = $input['description'] ?? null;
$coverImage = $input['cover_image'] ?? null;
$totalCopies = isset($input['total_copies']) ? (int)$input['total_copies'] : null;

try {
    $db = Database::getConnection();
    
    // 1. Fetch old book details
    $stmtFetchOld = $db->prepare("SELECT * FROM books WHERE id = :id");
    $stmtFetchOld->execute([':id' => $id]);
    $oldBook = $stmtFetchOld->fetch();
    
    if (!$oldBook) {
        Response::notFound('The book to update does not exist.');
    }
    
    // 2. If ISBN changes, ensure new one is unique
    if ($isbn !== null && $isbn !== $oldBook['isbn']) {
        $stmtCheck = $db->prepare("SELECT id FROM books WHERE isbn = :isbn");
        $stmtCheck->execute([':isbn' => $isbn]);
        if ($stmtCheck->fetch()) {
            Response::badRequest('A book with this new ISBN already exists.');
        }
    }
    
    // 3. Calculate stock adjustments if total_copies is changing
    $newAvailable = (int)$oldBook['available_copies'];
    if ($totalCopies !== null && $totalCopies !== (int)$oldBook['total_copies']) {
        if ($totalCopies < 0) {
            Response::badRequest('Total copies cannot be negative.');
        }
        
        $borrowedCopies = (int)$oldBook['total_copies'] - (int)$oldBook['available_copies'];
        if ($totalCopies < $borrowedCopies) {
            Response::badRequest("Cannot decrease total copies to $totalCopies. Currently, $borrowedCopies copies are on loan.");
        }
        
        $difference = $totalCopies - (int)$oldBook['total_copies'];
        $newAvailable = (int)$oldBook['available_copies'] + $difference;
    } else {
        $totalCopies = (int)$oldBook['total_copies'];
    }
    
    $status = $newAvailable > 0 ? 'available' : 'unavailable';
    
    // 4. Update the book
    $stmtUpdate = $db->prepare("
        UPDATE books 
        SET title = :title, 
            author = :author, 
            isbn = :isbn, 
            category = :category, 
            year = :year, 
            description = :description, 
            cover_image = :cover_image, 
            total_copies = :total_copies, 
            available_copies = :available_copies, 
            status = :status
        WHERE id = :id
    ");
    
    $stmtUpdate->execute([
        ':title' => $title ?? $oldBook['title'],
        ':author' => $author ?? $oldBook['author'],
        ':isbn' => $isbn ?? $oldBook['isbn'],
        ':category' => $category ?? $oldBook['category'],
        ':year' => $year ?? $oldBook['year'],
        ':description' => $description ?? $oldBook['description'],
        ':cover_image' => $coverImage ?? $oldBook['cover_image'],
        ':total_copies' => $totalCopies,
        ':available_copies' => $newAvailable,
        ':status' => $status,
        ':id' => $id
    ]);
    
    Response::success(null, 'Book details updated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
