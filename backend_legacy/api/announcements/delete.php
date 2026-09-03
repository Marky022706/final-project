<?php
// backend/api/announcements/delete.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed.', 405);
}

$user = JWT::requireRole(['admin', 'superadmin']);
$input = Utils::getJsonInput();
$id = $input['id'] ?? ($_GET['id'] ?? null);

if (!$id) {
    Response::badRequest('Announcement ID is required.');
}

try {
    $db = Database::getConnection();
    // Soft delete to Recycle Bin
    $stmt = $db->prepare("UPDATE announcements SET status = 'deleted', deleted_at = NOW() WHERE id = :id");
    $stmt->execute([':id' => $id]);

    logActivity(
        $user['id'],
        'delete_announcement',
        'Announcements',
        "Moved announcement ID $id to Recycle Bin."
    );

    Response::success(null, 'Announcement moved to Recycle Bin.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
