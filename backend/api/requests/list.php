<?php
// backend/api/requests/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

$user = JWT::requireAuth();
$isStaff = in_array($user['role'] ?? '', ['admin', 'superadmin']);

$type = $_GET['type'] ?? ''; // 'borrowing', 'archive', 'acquisition' or empty for all
$status = $_GET['status'] ?? ''; // 'pending', 'approved', 'rejected', 'completed'
$search = trim($_GET['search'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

try {
    $db = Database::getConnection();

    $where = [];
    $params = [];

    // Members only see their own requests
    if (!$isStaff) {
        $where[] = "r.user_id = :auth_user_id";
        $params[':auth_user_id'] = $user['id'];
    }

    if (!empty($type)) {
        $where[] = "r.type = :type";
        $params[':type'] = $type;
    }

    if (!empty($status)) {
        $where[] = "r.status = :status";
        $params[':status'] = $status;
    }

    if (!empty($search)) {
        $where[] = "(r.request_id LIKE :search OR r.title LIKE :search OR r.author LIKE :search OR u.first_name LIKE :search OR u.last_name LIKE :search OR b.title LIKE :search)";
        $params[':search'] = "%$search%";
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    // Count query
    $countSql = "
        SELECT COUNT(*) 
        FROM requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN books b ON r.book_id = b.id
        $whereClause
    ";
    $stmtCount = $db->prepare($countSql);
    $stmtCount->execute($params);
    $totalCount = (int)$stmtCount->fetchColumn();

    // Data query
    $sql = "
        SELECT 
            r.*,
            CONCAT(u.first_name, ' ', u.last_name) AS requester_name,
            u.email AS requester_email,
            u.phone AS requester_phone,
            u.qr_code AS member_qr,
            b.title AS book_title,
            b.author AS book_author,
            b.accession_number AS book_accession,
            b.cover_image AS book_cover,
            b.available_copies AS book_available_copies,
            CONCAT(app.first_name, ' ', app.last_name) AS approver_name
        FROM requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN books b ON r.book_id = b.id
        LEFT JOIN users app ON r.approver_id = app.id
        $whereClause
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success([
        'requests' => $requests,
        'pagination' => [
            'total' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($totalCount / $limit)
        ]
    ], 'Requests fetched successfully.');

} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage());
}
