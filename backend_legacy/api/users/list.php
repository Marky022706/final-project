<?php
// backend/api/users/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Admin and Super Admin access
$currentUser = JWT::requireRole(['admin', 'superadmin']);

$status = trim($_GET['status'] ?? '');
$role = trim($_GET['role'] ?? '');
$search = trim($_GET['search'] ?? '');

try {
    $db = Database::getConnection();

    $where = ["u.deleted_at IS NULL"];
    $params = [];

    if (!empty($status) && $status !== 'all') {
        $where[] = "u.status = :status";
        $params[':status'] = $status;
    }

    if (!empty($role) && $role !== 'all') {
        $where[] = "u.role = :role";
        $params[':role'] = $role;
    }

    if (!empty($search)) {
        $where[] = "(u.first_name LIKE :search OR u.last_name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search OR u.qr_code LIKE :search)";
        $params[':search'] = "%$search%";
    }

    $whereClause = "WHERE " . implode(" AND ", $where);

    $sql = "
        SELECT 
            u.id, 
            u.first_name, 
            u.middle_name,
            u.last_name, 
            u.email, 
            u.role, 
            u.phone, 
            u.address, 
            u.status, 
            u.qr_code,
            u.member_since,
            u.created_at,
            (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.status IN ('active', 'overdue')) AS active_loans,
            COALESCE((SELECT SUM(f.amount) FROM fines f WHERE f.user_id = u.id AND f.status = 'unpaid'), 0.00) AS total_unpaid_fines
        FROM users u
        $whereClause
        ORDER BY 
            CASE WHEN u.status = 'pending' THEN 0 ELSE 1 END,
            u.role ASC, 
            u.last_name ASC, 
            u.first_name ASC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($users, 'User registry loaded successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
