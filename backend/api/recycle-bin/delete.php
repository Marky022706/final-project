<?php
// backend/api/recycle-bin/delete.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed.', 405);
}

// Super Admin ONLY for permanent destructive deletions
$user = JWT::requireSuperAdmin();
$input = Utils::getJsonInput();

$itemType = $input['item_type'] ?? '';
$itemId = $input['item_id'] ?? null;

if (!$itemId || !in_array($itemType, ['book', 'announcement', 'user'])) {
    Response::badRequest('Item ID and item type required.');
}

try {
    $db = Database::getConnection();

    if ($itemType === 'book') {
        $stmt = $db->prepare("DELETE FROM books WHERE id = :id AND deleted_at IS NOT NULL");
        $stmt->execute([':id' => $itemId]);
    } elseif ($itemType === 'announcement') {
        $stmt = $db->prepare("DELETE FROM announcements WHERE id = :id");
        $stmt->execute([':id' => $itemId]);
    } elseif ($itemType === 'user') {
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id AND deleted_at IS NOT NULL");
        $stmt->execute([':id' => $itemId]);
    }

    logActivity(
        $user['id'],
        'permanent_delete',
        'RecycleBin',
        "Super Admin permanently deleted $itemType ID $itemId from database."
    );

    Response::success(null, "Record was permanently deleted from the database.");

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
