<?php
// backend/api/books/delete.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Only DELETE/POST is supported.', 405);
}

// Admin Route Guard
$currentUser = Middleware::requireAdmin();

$input = Utils::getJsonInput();
$id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

if ($id <= 0) {
    Response::badRequest('A valid Book ID is required for deletion.');
}

try {
    $db = Database::getConnection();
    
    // 1. Check if the book exists and get details for logging
    $stmtCheck = $db->prepare("SELECT total_copies, available_copies, title, author FROM books WHERE id = :id");
    $stmtCheck->execute([':id' => $id]);
    $book = $stmtCheck->fetch();
    
    if (!$book) {
        Response::notFound('The book to delete could not be found.');
    }
    
    // 2. Prevent deletion if there are active loans
    $borrowedCopies = (int)$book['total_copies'] - (int)$book['available_copies'];
    if ($borrowedCopies > 0) {
        Response::badRequest("Cannot delete this book. Currently, $borrowedCopies copies are on loan to library members.");
    }
    
    // 3. Delete the book
    $stmtDelete = $db->prepare("DELETE FROM books WHERE id = :id");
    $stmtDelete->execute([':id' => $id]);
    
    // Log activity with detailed information
    logActivity(
        $currentUser['id'],
        'deleted',
        'Books',
        "Deleted book: \"{$book['title']}\" by {$book['author']} (ID: $id)",
        json_encode($book),
        null,
        $id,
        'book'
    );
    
    Response::success(null, 'Book successfully removed from the library catalog.');

} catch (PDOException $e) {
    // If foreign key constraint blocks deletion, return a clean error
    if ($e->getCode() == '23000') {
        Response::error('Cannot delete this book because it is referenced in past transaction logs. You can change its status to unavailable or adjust its total copies instead.', 400);
    }
    Response::error('Server database error: ' . $e->getMessage());
}
