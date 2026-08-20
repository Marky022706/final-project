<?php
// backend/api/recycle-bin/restore.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

// Super Admin (or Admin for non-superadmin items)
$user = JWT::requireRole(['admin', 'superadmin']);
$input = Utils::getJsonInput();

$itemType = $input['item_type'] ?? ''; // 'book', 'announcement', 'user'
$itemId = $input['item_id'] ?? null;

if (!$itemId || !in_array($itemType, ['book', 'announcement', 'user'])) {
    Response::badRequest('Item ID and valid item type (book, announcement, user) required.');
}

if ($itemType === 'book' && ($user['role'] ?? '') !== 'superadmin') {
    Response::forbidden('Only the Super Admin has permissions to restore archived/deleted books.');
}

try {
    $db = Database::getConnection();

    if ($itemType === 'book') {
        $stmt = $db->prepare("UPDATE books SET deleted_at = NULL, status = 'available' WHERE id = :id");
        $stmt->execute([':id' => $itemId]);
    } elseif ($itemType === 'announcement') {
        $stmt = $db->prepare("UPDATE announcements SET deleted_at = NULL, status = 'active' WHERE id = :id");
        $stmt->execute([':id' => $itemId]);
    } elseif ($itemType === 'user') {
        $stmt = $db->prepare("UPDATE users SET deleted_at = NULL, status = 'active' WHERE id = :id");
        $stmt->execute([':id' => $itemId]);
    }

    logActivity(
        $user['id'],
        'restore_item',
        'RecycleBin',
        "Restored $itemType ID $itemId from Recycle Bin."
    );

    Response::success(null, "The $itemType was restored successfully.");

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
