<?php
// backend/api/reports/public-stats.php
// Public endpoint - no authentication required
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

try {
    $db = Database::getConnection();

    // 1. Total catalog book count
    $stmtBooks = $db->query("SELECT COUNT(*) FROM books");
    $totalBooks = (int)$stmtBooks->fetchColumn();

    // 2. Active member count (users with 'active' status, excluding admins)
    $stmtMembers = $db->query("SELECT COUNT(*) FROM users WHERE status = 'active' AND role = 'member'");
    $activeMembers = (int)$stmtMembers->fetchColumn();

    Response::success([
        'total_books' => $totalBooks,
        'active_members' => $activeMembers,
    ], 'Public statistics fetched successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
