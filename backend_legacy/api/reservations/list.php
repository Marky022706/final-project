<?php
// backend/api/reservations/list.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/middleware.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed. Only GET is supported.', 405);
}

// Authenticate user
$currentUser = Middleware::requireAuth();

$status = $_GET['status'] ?? '';
$filterUserId = $_GET['user_id'] ?? null;

$isStaff = in_array($currentUser['role'] ?? '', ['admin', 'superadmin']);

$targetUserId = $currentUser['id'];
if ($isStaff) {
    $targetUserId = !empty($filterUserId) ? $filterUserId : null;
} else {
    $targetUserId = $currentUser['id'];
}

try {
    $db = Database::getConnection();

    // Dynamic WHERE clauses
    $whereClauses = [];
    $params = [];

    if (!empty($targetUserId)) {
        $whereClauses[] = "r.user_id = :user_id";
        $params[':user_id'] = $targetUserId;
    }

    if (!empty($status)) {
        $whereClauses[] = "r.status = :status";
        $params[':status'] = $status;
    }

    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    // Query reservations joined with books and users
    $sql = "
        SELECT 
            r.id,
            r.reservation_id,
            r.user_id,
            r.book_id,
            r.reservation_date,
            r.status,
            u.first_name,
            u.last_name,
            u.email,
            b.title,
            b.author,
            b.isbn,
            b.cover_image,
            b.category,
            b.year,
            b.available_copies
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        " . $whereSql . "
        ORDER BY r.reservation_date DESC, r.id DESC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate queue positions in real-time
    $processedReservations = [];
    foreach ($reservations as $res) {
        if ($res['status'] === 'pending') {
            $stmtQueue = $db->prepare("
                SELECT COUNT(*) FROM reservations 
                WHERE book_id = :book_id 
                  AND status IN ('pending', 'ready')
                  AND reservation_date < :res_date
            ");
            $stmtQueue->execute([
                ':book_id' => $res['book_id'],
                ':res_date' => $res['reservation_date']
            ]);
            $beforeCount = (int)$stmtQueue->fetchColumn();
            $res['queue_position'] = $beforeCount + 1;
        } else {
            $res['queue_position'] = 0;
        }
        $processedReservations[] = $res;
    }

    Response::success($processedReservations, 'Reservations list compiled successfully.');

} catch (PDOException $e) {
    Response::error('Server database error: ' . $e->getMessage());
}
