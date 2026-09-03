<?php
// backend/api/books/update.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only PUT/POST is supported for updates.', 405);
}

// Admin / Super Admin Route Guard
$currentUser = JWT::requireRole(['admin', 'superadmin']);
$input = Utils::getJsonInput();

if (!isset($input['id'])) {
    Response::badRequest('A valid Book ID is required for updates.');
}

$id = $input['id'];
$title = $input['title'] ?? null;
$author = $input['author'] ?? null;
$publisher = $input['publisher'] ?? null;
$isbn = $input['isbn'] ?? null;
$accessionNumber = $input['accession_number'] ?? null;
$category = $input['category'] ?? null;
$year = isset($input['year']) ? (int)$input['year'] : null;
$shelfLocation = $input['shelf_location'] ?? null;
$format = $input['format'] ?? null;
$condition = $input['book_condition'] ?? null;
$description = $input['description'] ?? null;
$coverImage = $input['cover_image'] ?? null;
$totalCopies = isset($input['total_copies']) ? (int)$input['total_copies'] : null;
$statusInput = $input['status'] ?? null;
$softDelete = $input['soft_delete'] ?? false;

try {
    $db = Database::getConnection();
    
    // 1. Fetch old book details
    $stmtFetchOld = $db->prepare("SELECT * FROM books WHERE id = :id");
    $stmtFetchOld->execute([':id' => $id]);
    $oldBook = $stmtFetchOld->fetch(PDO::FETCH_ASSOC);
    
    if (!$oldBook) {
        Response::notFound('The book to update does not exist.');
    }

    if ($softDelete) {
        $stmtDel = $db->prepare("UPDATE books SET deleted_at = NOW(), status = 'unavailable' WHERE id = :id");
        $stmtDel->execute([':id' => $id]);

        logActivity(
            $currentUser['id'],
            'delete_book',
            'Books',
            "Moved book '{$oldBook['title']}' to Recycle Bin."
        );
        Response::success(null, 'Book moved to Recycle Bin.');
    }
    
    // 2. Uniqueness check for ISBN if updated
    if ($isbn !== null && $isbn !== $oldBook['isbn']) {
        $stmtCheck = $db->prepare("SELECT id FROM books WHERE isbn = :isbn AND id != :id AND deleted_at IS NULL");
        $stmtCheck->execute([':isbn' => $isbn, ':id' => $id]);
        if ($stmtCheck->fetch()) {
            Response::badRequest('A book with this new ISBN already exists.');
        }
    }

    // 3. Uniqueness check for Accession number if updated
    if ($accessionNumber !== null && $accessionNumber !== $oldBook['accession_number']) {
        $stmtCheckAcc = $db->prepare("SELECT id FROM books WHERE accession_number = :acc AND id != :id AND deleted_at IS NULL");
        $stmtCheckAcc->execute([':acc' => $accessionNumber, ':id' => $id]);
        if ($stmtCheckAcc->fetch()) {
            Response::badRequest('Accession number is already in use by another book.');
        }
    }
    
    // 4. Calculate stock adjustments if total_copies is changing
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
    
    $status = $statusInput ?? ($newAvailable > 0 ? 'available' : 'unavailable');
    
    // 5. Update the book
    $stmtUpdate = $db->prepare("
        UPDATE books 
        SET title = :title, 
            author = :author, 
            publisher = :publisher,
            isbn = :isbn, 
            accession_number = :accession_number,
            category = :category, 
            year = :year, 
            shelf_location = :shelf_location,
            format = :format,
            book_condition = :condition,
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
        ':publisher' => $publisher ?? ($oldBook['publisher'] ?? 'Standard Publication'),
        ':isbn' => $isbn ?? $oldBook['isbn'],
        ':accession_number' => $accessionNumber ?? ($oldBook['accession_number'] ?? ''),
        ':category' => $category ?? $oldBook['category'],
        ':year' => $year ?? $oldBook['year'],
        ':shelf_location' => $shelfLocation ?? ($oldBook['shelf_location'] ?? 'Main Shelf'),
        ':format' => $format ?? ($oldBook['format'] ?? 'Paperback'),
        ':condition' => $condition ?? ($oldBook['book_condition'] ?? 'good'),
        ':description' => $description ?? $oldBook['description'],
        ':cover_image' => $coverImage ?? $oldBook['cover_image'],
        ':total_copies' => $totalCopies,
        ':available_copies' => $newAvailable,
        ':status' => $status,
        ':id' => $id
    ]);

    logActivity(
        $currentUser['id'],
        'update_book',
        'Books',
        "Updated metadata for book '{$oldBook['title']}' (ID: $id)"
    );

    Response::success(null, 'Book details updated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
