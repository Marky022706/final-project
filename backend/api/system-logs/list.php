<?php
// backend/api/system-logs/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed.', 405);
}

// Super Admin only
$user = JWT::requireSuperAdmin();

$logType = trim($_GET['log_type'] ?? '');
$severity = trim($_GET['severity'] ?? '');
$search = trim($_GET['search'] ?? '');
$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

try {
    $db = Database::getConnection();

    $where = [];
    $params = [];

    if (!empty($logType)) {
        $where[] = "log_type = :lt";
        $params[':lt'] = $logType;
    }
    if (!empty($severity)) {
        $where[] = "severity = :sev";
        $params[':sev'] = $severity;
    }
    if (!empty($search)) {
        $where[] = "(message LIKE :search OR ip_address LIKE :search)";
        $params[':search'] = "%$search%";
    }
    if (!empty($startDate)) {
        $where[] = "created_at >= :start";
        $params[':start'] = "$startDate 00:00:00";
    }
    if (!empty($endDate)) {
        $where[] = "created_at <= :end";
        $params[':end'] = "$endDate 23:59:59";
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    $countSql = "SELECT COUNT(*) FROM system_logs $whereClause";
    $stmtCount = $db->prepare($countSql);
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    $sql = "
        SELECT * FROM system_logs
        $whereClause
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success([
        'logs' => $logs,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]
    ], 'System logs fetched successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
