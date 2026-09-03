<?php
// backend/api/activity-logs/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/activity_logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Authenticate user (admin / superadmin only)
$currentUser = Middleware::requireAdmin();

$filters = [
    'user_id' => !empty($_GET['user_id']) ? trim($_GET['user_id']) : null,
    'module' => $_GET['module'] ?? null,

    'action' => $_GET['action'] ?? null,
    'date_from' => $_GET['date_from'] ?? null,
    'date_to' => $_GET['date_to'] ?? null,
    'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : 50,
    'offset' => isset($_GET['offset']) ? (int)$_GET['offset'] : 0
];

// Build WHERE clause for count query
$whereClauses = [];
$params = [];
if (!empty($filters['user_id'])) {
    $whereClauses[] = "al.user_id = :user_id";
    $params[':user_id'] = $filters['user_id'];
}
if (!empty($filters['module'])) {
    $whereClauses[] = "al.module = :module";
    $params[':module'] = $filters['module'];
}
if (!empty($filters['action'])) {
    $whereClauses[] = "al.action = :action";
    $params[':action'] = $filters['action'];
}
if (!empty($filters['date_from'])) {
    $whereClauses[] = "al.created_at >= :date_from";
    $params[':date_from'] = $filters['date_from'];
}
if (!empty($filters['date_to'])) {
    $whereClauses[] = "al.created_at <= :date_to";
    $params[':date_to'] = $filters['date_to'];
}
$whereSql = !empty($whereClauses) ? ' WHERE ' . implode(' AND ', $whereClauses) : '';

try {
    $db = Database::getConnection();
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM activity_logs al JOIN users u ON al.user_id = u.id" . $whereSql;
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetchColumn();
    
    // Get activity logs
    $logs = getActivityLogs($db, $filters);
    
    // Get statistics
    $stats = getActivityStats($db);
    
    Response::success([
        'logs' => $logs,
        'stats' => $stats,
        'total_count' => $totalCount,
        'limit' => $filters['limit'],
        'offset' => $filters['offset']
    ], 'Activity logs retrieved successfully.');
    
} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
