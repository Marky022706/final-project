<?php
// backend/api/books/getOne.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    Response::badRequest('A valid Book ID is required.');
}

try {
    $db = Database::getConnection();
    
    // Fetch book details
    $stmt = $db->prepare("SELECT * FROM books WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $book = $stmt->fetch();
    
    if (!$book) {
        Response::notFound('The requested book could not be found.');
    }
    
    // Fetch active borrow transactions for this book (optional overlay)
    $stmtTxn = $db->prepare("
        SELECT t.id, t.transaction_id, t.borrow_date, t.due_date, u.first_name, u.last_name, u.email
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.book_id = :book_id AND t.status IN ('active', 'overdue')
    ");
    $stmtTxn->execute([':book_id' => $id]);
    $activeBorrows = $stmtTxn->fetchAll();
    
    $book['active_borrows'] = $activeBorrows;

    Response::success($book, 'Book details retrieved successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
