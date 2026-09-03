<?php
// backend/api/recycle-bin/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed.', 405);
}

// Super Admin / Admin access
$user = JWT::requireRole(['admin', 'superadmin']);

try {
    $db = Database::getConnection();

    // 1. Soft-deleted Books
    $stmtBooks = $db->query("
        SELECT id, title, author, isbn, category, deleted_at, 'book' AS item_type
        FROM books
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    ");
    $deletedBooks = $stmtBooks->fetchAll(PDO::FETCH_ASSOC);

    // 2. Soft-deleted Announcements
    $stmtAnn = $db->query("
        SELECT id, title, category, published_at, deleted_at, 'announcement' AS item_type
        FROM announcements
        WHERE deleted_at IS NOT NULL OR status = 'deleted'
        ORDER BY deleted_at DESC
    ");
    $deletedAnnouncements = $stmtAnn->fetchAll(PDO::FETCH_ASSOC);

    // 3. Soft-deleted Users (Super Admin view)
    $stmtUsers = $db->query("
        SELECT id, CONCAT(first_name, ' ', last_name) AS name, email, role, deleted_at, 'user' AS item_type
        FROM users
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    ");
    $deletedUsers = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

    Response::success([
        'books' => $deletedBooks,
        'announcements' => $deletedAnnouncements,
        'users' => $deletedUsers,
        'total' => count($deletedBooks) + count($deletedAnnouncements) + count($deletedUsers)
    ], 'Recycle bin items fetched successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
