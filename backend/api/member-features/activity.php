<?php
// backend/api/member-features/activity.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed.', 405);
}

$user = JWT::requireAuth();
$db = Database::getConnection();

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(50, max(1, (int)($_GET['limit'] ?? 15)));
$offset = ($page - 1) * $limit;

try {
    // Count total activity logs for this member
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM activity_logs WHERE user_id = :uid");
    $stmtCount->execute([':uid' => $user['id']]);
    $total = (int)$stmtCount->fetchColumn();

    // Fetch activities
    $stmt = $db->prepare("
        SELECT id, action, module, description, created_at, ip_address
        FROM activity_logs
        WHERE user_id = :uid
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':uid', $user['id']);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success([
        'activities' => $activities,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]
    ], 'Member activity history fetched successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
