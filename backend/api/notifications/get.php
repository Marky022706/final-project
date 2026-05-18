<?php
// backend/api/notifications/get.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

// Accept GET or POST (for state changes)
$currentUser = Middleware::requireAuth();
$userId = $currentUser['id'];

try {
    $db = Database::getConnection();
    
    // Check if updating states
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    if ($action === 'mark_read') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
        if ($id > 0) {
            $stmtUpdate = $db->prepare("UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :user_id");
            $stmtUpdate->execute([':id' => $id, ':user_id' => $userId]);
            Response::success(null, 'Notification marked as read.');
        } else {
            Response::badRequest('Valid Notification ID required.');
        }
    }
    
    if ($action === 'mark_all_read') {
        $stmtUpdateAll = $db->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id");
        $stmtUpdateAll->execute([':user_id' => $userId]);
        Response::success(null, 'All notifications marked as read.');
    }
    
    // Fetch notifications list for logged-in user
    $stmtList = $db->prepare("SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 50");
    $stmtList->execute([':user_id' => $userId]);
    $notifications = $stmtList->fetchAll();
    
    // Count unread
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = FALSE");
    $stmtCount->execute([':user_id' => $userId]);
    $unreadCount = (int)$stmtCount->fetchColumn();
    
    Response::success([
        'notifications' => $notifications,
        'unread_count' => $unreadCount
    ], 'Notifications loaded successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
