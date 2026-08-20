<?php
// backend/api/announcements/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed.', 405);
}

try {
    $db = Database::getConnection();
    $stmt = $db->query("
        SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS author_name 
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.status != 'deleted' AND a.deleted_at IS NULL
        ORDER BY a.published_at DESC
    ");
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    Response::success($announcements, 'Announcements fetched successfully.');
} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
