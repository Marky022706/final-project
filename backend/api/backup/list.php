<?php
// backend/api/backup/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed.', 405);
}

// Super Admin only
$user = JWT::requireSuperAdmin();

try {
    $db = Database::getConnection();
    $stmt = $db->query("
        SELECT b.*, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
        FROM backups b
        LEFT JOIN users u ON b.created_by = u.id
        ORDER BY b.created_at DESC
    ");
    $backups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($backups, 'Backup history fetched successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
