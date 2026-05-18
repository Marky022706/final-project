<?php
// backend/api/reports/most-borrowed.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Admin Route Guard
Middleware::requireAdmin();

try {
    $db = Database::getConnection();
    
    // 1. Aggregated borrows by Category (for Recharts PieChart/BarChart)
    $sqlCategory = "
        SELECT b.category AS name, COUNT(t.id) AS value
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        GROUP BY b.category
        ORDER BY value DESC
    ";
    $stmtCat = $db->query($sqlCategory);
    $categoryBorrows = $stmtCat->fetchAll();

    // 2. Top 5 Most Borrowed Book Titles
    $sqlTopBooks = "
        SELECT b.title AS name, COUNT(t.id) AS value, b.author
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        GROUP BY b.id
        ORDER BY value DESC
        LIMIT 5
    ";
    $stmtTop = $db->query($sqlTopBooks);
    $topBooks = $stmtTop->fetchAll();

    Response::success([
        'categories' => $categoryBorrows,
        'books' => $topBooks
    ], 'Most borrowed reports generated successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
