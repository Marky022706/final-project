<?php
// backend/api/users/get.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

// Default to self profile
$userId = !empty($_GET['id']) ? $_GET['id'] : $currentUser['id'];

$isStaff = in_array($currentUser['role'] ?? '', ['admin', 'superadmin']);

// Access Control: Members cannot query other users
if (!$isStaff && $userId !== $currentUser['id']) {
    Response::forbidden('You do not have permission to view this user profile.');
}

try {
    $db = Database::getConnection();
    
    // Fetch profile
    $stmt = $db->prepare("SELECT id, first_name, middle_name, last_name, email, role, phone, address, status, member_since, created_at, qr_code FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        Response::notFound('User profile not found.');
    }
    
    // Fetch user dashboard statistics
    // 1. Current Active Borrow Count
    $stmtActive = $db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :id AND status IN ('active', 'overdue')");
    $stmtActive->execute([':id' => $userId]);
    $activeCount = (int)$stmtActive->fetchColumn();

    // 2. Cumulative Loans
    $stmtTotal = $db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :id");
    $stmtTotal->execute([':id' => $userId]);
    $totalCount = (int)$stmtTotal->fetchColumn();

    // 3. Unpaid Fines Sum
    $stmtFines = $db->prepare("SELECT COALESCE(SUM(amount), 0.00) FROM fines WHERE user_id = :id AND status = 'unpaid'");
    $stmtFines->execute([':id' => $userId]);
    $finesSum = (float)$stmtFines->fetchColumn();

    // 4. Notifications Unread Count
    $stmtNotif = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :id AND is_read = FALSE");
    $stmtNotif->execute([':id' => $userId]);
    $unreadNotifCount = (int)$stmtNotif->fetchColumn();
    
    $user['stats'] = [
        'active_loans' => $activeCount,
        'total_loans' => $totalCount,
        'unpaid_fines' => $finesSum,
        'unread_notifications' => $unreadNotifCount
    ];
    
    Response::success($user, 'User profile fetched successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
