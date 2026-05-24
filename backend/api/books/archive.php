<?php
// backend/api/books/archive.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only POST is supported.', 405);
}

// Admin Route Guard
Middleware::requireAdmin();

$input = Utils::getJsonInput();
$id = isset($input['id']) ? (int)$input['id'] : 0;

if ($id <= 0) {
    Response::badRequest('A valid Book ID is required to process archival.');
}

try {
    $db = Database::getConnection();
    
    // Start transaction
    $db->beginTransaction();

    // 1. Fetch book details
    $stmtBook = $db->prepare("SELECT * FROM books WHERE id = :id FOR UPDATE");
    $stmtBook->execute([':id' => $id]);
    $book = $stmtBook->fetch();

    if (!$book) {
        $db->rollBack();
        Response::notFound('The requested book could not be found.');
    }

    $currentStatus = $book['status'];
    $newStatus = '';
    $message = '';

    if ($currentStatus === 'archived') {
        // Unarchive/Restore book copy
        $newStatus = (int)$book['available_copies'] > 0 ? 'available' : 'unavailable';
        $message = 'Book catalog record successfully restored and unarchived!';
    } else {
        // Archive book copy
        // 2. Prevent archiving if there are active loans
        $borrowedCopies = (int)$book['total_copies'] - (int)$book['available_copies'];
        if ($borrowedCopies > 0) {
            $db->rollBack();
            Response::badRequest("Cannot archive this book. Currently, $borrowedCopies copies are on loan to library members.");
        }
        
        $newStatus = 'archived';
        $message = 'Book catalog record successfully archived!';
    }

    // 3. Update status in database
    $stmtUpdate = $db->prepare("UPDATE books SET status = :status WHERE id = :id");
    $stmtUpdate->execute([
        ':status' => $newStatus,
        ':id' => $id
    ]);

    // Commit transaction
    $db->commit();

    Response::success(['status' => $newStatus], $message);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    Response::error('Failed to update book archival status: ' . $e->getMessage());
}
